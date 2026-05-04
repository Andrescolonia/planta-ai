import { all, exec, get, run } from './connection.js';
import { hashPassword, normalizeEmail, normalizeRole } from '../services/authService.js';

function usersTableSql(tableName = 'users', ifNotExists = true) {
  return `
    CREATE TABLE ${ifNotExists ? 'IF NOT EXISTS ' : ''}${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT NOT NULL CHECK (role IN ('invitado', 'usuario', 'supervisor', 'administrador')),
      active INTEGER NOT NULL DEFAULT 1,
      is_guest INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT
    );
  `;
}

async function createUserIndexes() {
  await exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
    ON users(email)
    WHERE email IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
  `);
}

async function createOrMigrateUsersTable() {
  const table = await get(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'"
  );

  if (!table) {
    await exec(usersTableSql());
    await createUserIndexes();
    return;
  }

  const columns = await all('PRAGMA table_info(users)');
  const columnNames = new Set(columns.map((column) => column.name));
  const hasNewRoleCheck = String(table.sql || '').includes("'invitado'");
  const needsMigration =
    !columnNames.has('email') ||
    !columnNames.has('password_hash') ||
    !columnNames.has('is_guest') ||
    !columnNames.has('last_login') ||
    !hasNewRoleCheck;

  if (!needsMigration) {
    await createUserIndexes();
    return;
  }

  const existingUsers = await all('SELECT * FROM users');

  await exec('PRAGMA foreign_keys = OFF;');
  await exec(`
    ${usersTableSql('users_next', false)}
    DROP TABLE users;
    ALTER TABLE users_next RENAME TO users;
  `);

  for (const user of existingUsers) {
    const passwordHash =
      user.password_hash || (user.password ? await hashPassword(user.password) : null);

    await run(
      `INSERT INTO users (
        id,
        name,
        username,
        email,
        password_hash,
        role,
        active,
        is_guest,
        created_at,
        last_login
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.name,
        user.username,
        normalizeEmail(user.email),
        passwordHash,
        normalizeRole(user.role),
        user.active ?? 1,
        user.is_guest ?? 0,
        user.created_at,
        user.last_login ?? null
      ]
    );
  }

  await exec('PRAGMA foreign_keys = ON;');
  await createUserIndexes();
}

export async function createSchema() {
  await createOrMigrateUsersTable();

  await exec(`
    CREATE TABLE IF NOT EXISTS zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      campus_area TEXT NOT NULL,
      description TEXT NOT NULL,
      general_status TEXT NOT NULL DEFAULT 'estable',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      diagnostic_state TEXT NOT NULL UNIQUE,
      risk_level TEXT NOT NULL,
      priority TEXT NOT NULL,
      irrigation_recommendation TEXT NOT NULL,
      automatic_observation TEXT NOT NULL,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      zone_id INTEGER NOT NULL,
      created_by INTEGER,
      location TEXT NOT NULL,
      image_path TEXT,
      image_filename TEXT,
      diagnostic_state TEXT NOT NULL,
      confidence REAL NOT NULL,
      risk_level TEXT NOT NULL,
      irrigation_recommendation TEXT NOT NULL,
      observations TEXT NOT NULL,
      priority TEXT NOT NULL,
      analysis_mode TEXT NOT NULL DEFAULT 'demo',
      FOREIGN KEY (zone_id) REFERENCES zones(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
    CREATE INDEX IF NOT EXISTS idx_cases_zone_id ON cases(zone_id);
    CREATE INDEX IF NOT EXISTS idx_cases_diagnostic_state ON cases(diagnostic_state);
    CREATE INDEX IF NOT EXISTS idx_cases_priority ON cases(priority);
  `);
}
