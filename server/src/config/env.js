import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverRoot = path.resolve(__dirname, '..', '..');
const projectRoot = path.resolve(serverRoot, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });
dotenv.config({ path: path.join(serverRoot, '.env'), override: false });

function resolveFromServerRoot(value, fallback) {
  const rawPath = value || fallback;
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(serverRoot, rawPath);
}

const uploadDir = resolveFromServerRoot(process.env.UPLOAD_DIR, './uploads');
const databasePath = resolveFromServerRoot(process.env.DATABASE_PATH, './data/planta.sqlite');

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  host: process.env.HOST || '0.0.0.0',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databasePath,
  uploadDir,
  uploadUrlPrefix: '/uploads',
  analysisMode: process.env.ANALYSIS_MODE || 'demo',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
  openaiTimeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 30000),
  openaiFallbackToDemo: process.env.OPENAI_FALLBACK_TO_DEMO === 'true',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 8),
  projectRoot,
  serverRoot
};
