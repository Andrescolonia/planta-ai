import { exec } from './connection.js';

export async function createSchema() {
  await exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('operador', 'supervisor', 'administrador')),
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

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
