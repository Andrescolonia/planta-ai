import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { badRequest } from '../utils/httpError.js';

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);

const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

function sanitizeFileName(fileName) {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, env.uploadDir);
  },
  filename: (_req, file, callback) => {
    const safeName = sanitizeFileName(file.originalname || 'imagen-planta.jpg');
    callback(null, `${Date.now()}-${randomUUID()}-${safeName}`);
  }
});

export const imageUpload = multer({
  storage,
  limits: {
    fileSize: env.maxUploadMb * 1024 * 1024
  },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const hasImageMimeType = allowedMimeTypes.has(file.mimetype);
    const hasGenericMimeType = !file.mimetype || file.mimetype === 'application/octet-stream';
    const hasImageExtension = allowedExtensions.has(extension);

    if (!hasImageMimeType && !(hasGenericMimeType && hasImageExtension)) {
      return callback(
        badRequest('Formato de imagen no soportado. Usa JPG, PNG, WEBP, HEIC o HEIF.')
      );
    }

    return callback(null, true);
  }
});

export function buildPublicImagePath(fileName) {
  return path.posix.join(env.uploadUrlPrefix, fileName);
}
