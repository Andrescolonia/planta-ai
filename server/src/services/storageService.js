import fs from 'node:fs/promises';
import path from 'node:path';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

const R2_SCHEME = 'r2://';

let r2Client;

function localImagePath(fileName) {
  return path.posix.join(env.uploadUrlPrefix, fileName);
}

function normalizePrefix(prefix) {
  return String(prefix || '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');
}

function buildR2Key(fileName) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return [normalizePrefix(env.r2Prefix), year, month, fileName].filter(Boolean).join('/');
}

function encodeObjectKey(key) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function missingR2Config() {
  return [
    ['R2_ENDPOINT o R2_ACCOUNT_ID', env.r2Endpoint || env.r2AccountId],
    ['R2_ACCESS_KEY_ID', env.r2AccessKeyId],
    ['R2_SECRET_ACCESS_KEY', env.r2SecretAccessKey],
    ['R2_BUCKET', env.r2Bucket]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name);
}

function assertR2Config() {
  const missing = missingR2Config();

  if (missing.length > 0) {
    throw new Error(`Configura ${missing.join(', ')} para usar Cloudflare R2.`);
  }
}

function getR2Client() {
  assertR2Config();

  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: env.r2Endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey
      }
    });
  }

  return r2Client;
}

function isR2Path(value) {
  return typeof value === 'string' && value.startsWith(R2_SCHEME);
}

function r2KeyFromPath(value) {
  return isR2Path(value) ? value.slice(R2_SCHEME.length) : '';
}

function localStorageResult(file) {
  const publicPath = localImagePath(file.filename);

  return {
    provider: 'local',
    path: publicPath,
    url: publicPath,
    key: file.filename
  };
}

export async function resolveImageUrl(imagePath) {
  if (!imagePath) {
    return null;
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  if (!isR2Path(imagePath)) {
    return imagePath;
  }

  const key = r2KeyFromPath(imagePath);

  if (!key) {
    return null;
  }

  if (env.r2PublicUrl) {
    return `${env.r2PublicUrl.replace(/\/$/, '')}/${encodeObjectKey(key)}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: env.r2Bucket,
      Key: key
    });

    return getSignedUrl(getR2Client(), command, {
      expiresIn: env.r2SignedUrlTtlSeconds
    });
  } catch (error) {
    console.warn(`[storage] No fue posible generar URL para R2: ${error.message}`);
    return null;
  }
}

export async function storeUploadedImage(file) {
  if (!file?.filename) {
    throw new Error('No se encontro el archivo subido para almacenarlo.');
  }

  if (env.storageDriver !== 'r2') {
    return localStorageResult(file);
  }

  try {
    const key = buildR2Key(file.filename);
    const body = await fs.readFile(file.path);

    await getR2Client().send(
      new PutObjectCommand({
        Bucket: env.r2Bucket,
        Key: key,
        Body: body,
        ContentType: file.mimetype || 'application/octet-stream',
        Metadata: {
          'original-name': encodeURIComponent(file.originalname || file.filename)
        }
      })
    );

    const storagePath = `${R2_SCHEME}${key}`;

    return {
      provider: 'r2',
      path: storagePath,
      url: await resolveImageUrl(storagePath),
      key
    };
  } catch (error) {
    if (!env.r2FallbackToLocal) {
      throw error;
    }

    console.warn(`[storage] R2 no disponible, usando almacenamiento local: ${error.message}`);
    return {
      ...localStorageResult(file),
      provider: 'local-fallback'
    };
  }
}

export async function attachImageUrl(caseItem) {
  if (!caseItem) {
    return null;
  }

  const imageUrl = await resolveImageUrl(caseItem.imagePath);
  const imageProvider = isR2Path(caseItem.imagePath) ? 'r2' : 'local';

  return {
    ...caseItem,
    imageUrl,
    imageProvider
  };
}
