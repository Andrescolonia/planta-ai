import { env } from '../config/env.js';
import { getClientIp } from '../utils/clientIp.js';
import { HttpError } from '../utils/httpError.js';

function cleanup(bucket, now) {
  for (const [key, value] of bucket.entries()) {
    if (value.resetAt <= now) {
      bucket.delete(key);
    }
  }
}

export function createRateLimiter({
  name,
  windowMs,
  max,
  message = 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.'
}) {
  const bucket = new Map();

  return (req, res, next) => {
    if (!max || max <= 0) {
      next();
      return;
    }

    const now = Date.now();
    const key = `${name}:${getClientIp(req)}`;
    cleanup(bucket, now);

    const current = bucket.get(key) || {
      count: 0,
      resetAt: now + windowMs
    };

    current.count += 1;
    bucket.set(key, current);

    const remaining = Math.max(max - current.count, 0);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      const retryAfter = Math.max(Math.ceil((current.resetAt - now) / 1000), 1);
      res.setHeader('Retry-After', String(retryAfter));
      next(new HttpError(429, message));
      return;
    }

    next();
  };
}

export const globalApiRateLimit = createRateLimiter({
  name: 'global-api',
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax
});

export const authRateLimit = createRateLimiter({
  name: 'auth',
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  message: 'Demasiados intentos de acceso. Espera unos minutos antes de continuar.'
});

export const analysisRateLimit = createRateLimiter({
  name: 'analysis',
  windowMs: env.analysisRateLimitWindowMs,
  max: env.analysisRateLimitMax,
  message: 'Se alcanzo el limite de analisis por dispositivo. Intenta mas tarde.'
});
