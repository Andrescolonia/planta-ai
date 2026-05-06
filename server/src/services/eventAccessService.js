import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

const tokens = new Map();

export function eventAccessRequired() {
  return Boolean(env.eventAccessCode);
}

function cleanupExpiredTokens(now = Date.now()) {
  for (const [token, record] of tokens.entries()) {
    if (record.expiresAt <= now) {
      tokens.delete(token);
    }
  }
}

export function createEventAccessToken() {
  cleanupExpiredTokens();

  const token = randomUUID();
  const ttlMs = Math.max(env.eventAccessTtlHours, 1) * 60 * 60 * 1000;

  tokens.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs
  });

  return {
    token,
    expiresIn: `${env.eventAccessTtlHours}h`
  };
}

export function isValidEventAccessCode(code) {
  if (!eventAccessRequired()) {
    return true;
  }

  return String(code || '').trim() === env.eventAccessCode;
}

export function isValidEventAccessToken(token) {
  if (!eventAccessRequired()) {
    return true;
  }

  cleanupExpiredTokens();

  const value = String(token || '').trim();
  if (!value) {
    return false;
  }

  return tokens.has(value);
}
