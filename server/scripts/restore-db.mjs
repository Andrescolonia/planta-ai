import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function resolveFromProjectRoot(value) {
  return path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
}

async function assertSqliteFile(filePath) {
  const handle = await fs.open(filePath, 'r');

  try {
    const buffer = Buffer.alloc(16);
    await handle.read(buffer, 0, 16, 0);
    const header = buffer.toString('utf8');

    if (header !== 'SQLite format 3\u0000') {
      throw new Error('El archivo seleccionado no parece ser una base SQLite valida.');
    }
  } finally {
    await handle.close();
  }
}

const sourceArg = process.argv[2];

if (!sourceArg) {
  console.error('Uso: npm run restore:db -- backups/planta-YYYYMMDD-HHMMSS.sqlite');
  process.exit(1);
}

const sourcePath = resolveFromProjectRoot(sourceArg);
const databasePath = resolveFromServerRoot(process.env.DATABASE_PATH, './data/planta.sqlite');
const backupDir = path.resolve(projectRoot, process.env.BACKUP_DIR || './backups');
const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
const preRestorePath = path.join(backupDir, `pre-restore-${timestamp}.sqlite`);

try {
  await fs.access(sourcePath);
  await assertSqliteFile(sourcePath);
  await fs.mkdir(path.dirname(databasePath), { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });

  try {
    await fs.access(databasePath);
    await fs.copyFile(databasePath, preRestorePath);
    console.log(`[restore] Respaldo preventivo creado: ${preRestorePath}`);
  } catch {
    console.log('[restore] No habia base actual para respaldar antes de restaurar.');
  }

  await fs.copyFile(sourcePath, databasePath);
  console.log(`[restore] Base SQLite restaurada desde: ${sourcePath}`);
  console.log('[restore] Reinicia el backend para cargar la base restaurada.');
} catch (error) {
  console.error(`[restore] No fue posible restaurar la base SQLite: ${error.message}`);
  process.exit(1);
}
