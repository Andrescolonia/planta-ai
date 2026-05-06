import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

export function configureStaticClient(app) {
  const indexPath = path.join(env.clientDistPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    return false;
  }

  app.use(
    express.static(env.clientDistPath, {
      index: false,
      maxAge: env.nodeEnv === 'production' ? '1h' : 0
    })
  );

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || path.extname(req.path)) {
      next();
      return;
    }

    res.sendFile(indexPath);
  });

  return true;
}
