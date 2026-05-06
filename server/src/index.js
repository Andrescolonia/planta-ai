import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { initializeDatabase } from './database/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { configureStaticClient } from './middleware/staticClient.js';
import { apiRouter } from './routes/index.js';
import { initializeLogger } from './services/logger.js';

initializeLogger();

function isSameRequestHost(origin, host) {
  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin, host) {
  if (!origin) {
    return true;
  }

  if (isSameRequestHost(origin, host)) {
    return true;
  }

  if (env.clientOrigin === '*' || origin === env.clientOrigin) {
    return true;
  }

  return /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(
    origin
  );
}

const app = express();

app.set('trust proxy', env.trustProxy);

app.use(
  (req, res, next) =>
    cors({
      origin(origin, callback) {
        if (isAllowedOrigin(origin, req.headers.host)) {
          callback(null, true);
          return;
        }

        callback(new Error('Origen no permitido por CORS.'));
      },
      credentials: true
    })(req, res, next)
);
app.use(express.json());
app.use('/uploads', express.static(env.uploadDir));
app.use('/api', apiRouter);
const clientServed = configureStaticClient(app);
app.use(notFoundHandler);
app.use(errorHandler);

try {
  await initializeDatabase();

  app.listen(env.port, env.host, () => {
    console.log(`P.L.A.N.T.A. API disponible en http://${env.host}:${env.port}`);
    console.log(`Base de datos local: ${env.databasePath}`);
    console.log(`Imagenes locales: ${env.uploadDir}`);
    console.log(
      clientServed
        ? `Frontend compilado servido desde: ${env.clientDistPath}`
        : `Frontend compilado no encontrado en: ${env.clientDistPath}`
    );
  });
} catch (error) {
  console.error('No fue posible iniciar P.L.A.N.T.A. API.');
  console.error(error);
  process.exit(1);
}
