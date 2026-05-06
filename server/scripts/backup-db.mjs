import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(serverRoot, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env'), override: false });

function resolveFromServerRoot(value, fallback) {
  const rawPath = value || fallback;
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(serverRoot, rawPath);
}

function resolveFromProjectRoot(value, fallback) {
  const rawPath = value || fallback;
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(projectRoot, rawPath);
}

function quoteSqliteString(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function openDatabase(databasePath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(databasePath, sqlite3.OPEN_READONLY, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(db);
    });
  });
}

function run(db, sql) {
  return new Promise((resolve, reject) => {
    db.run(sql, (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function pruneBackups(backupDir, retentionCount) {
  if (!Number.isFinite(retentionCount) || retentionCount <= 0) {
    return;
  }

  const entries = await fs.readdir(backupDir, { withFileTypes: true });
  const backups = entries
    .filter((entry) => entry.isFile() && /^planta-\d{8}-\d{6}\.sqlite$/.test(entry.name))
    .map((entry) => entry.name)
    .sort()
    .reverse();

  const staleBackups = backups.slice(retentionCount);
  await Promise.all(staleBackups.map((name) => fs.rm(path.join(backupDir, name), { force: true })));
}

const databasePath = resolveFromServerRoot(process.env.DATABASE_PATH, './data/planta.sqlite');
const backupDir = resolveFromProjectRoot(process.env.BACKUP_DIR, './backups');
const retentionCount = Number(process.env.BACKUP_RETENTION_COUNT || 25);
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const backupPath = path.join(backupDir, `planta-${timestamp}.sqlite`);

await fs.mkdir(backupDir, { recursive: true });

try {
  await fs.access(databasePath);
} catch {
  console.log(`[backup] Base SQLite no encontrada en ${databasePath}. Se omite el respaldo inicial.`);
  process.exit(0);
}

let db;

try {
  db = await openDatabase(databasePath);
  await run(db, 'PRAGMA busy_timeout = 5000');
  await run(db, `VACUUM INTO ${quoteSqliteString(backupPath)}`);
  await closeDatabase(db);
  db = null;

  await pruneBackups(backupDir, retentionCount);

  const stats = await fs.stat(backupPath);
  const sizeMb = (stats.size / 1024 / 1024).toFixed(2);
  console.log(`[backup] Respaldo SQLite creado: ${backupPath} (${sizeMb} MB)`);
} catch (error) {
  if (db) {
    await closeDatabase(db).catch(() => {});
  }

  console.error(`[backup] No fue posible crear el respaldo SQLite: ${error.message}`);
  process.exit(1);
}
