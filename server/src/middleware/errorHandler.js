import multer from 'multer';
import { env } from '../config/env.js';

export function notFoundHandler(req, _res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? `La imagen supera el limite de ${env.maxUploadMb} MB.`
        : 'No fue posible procesar la imagen enviada.';

    return res.status(400).json({
      error: true,
      message,
      code: error.code
    });
  }

  const statusCode = error.statusCode || 500;
  const payload = {
    error: true,
    message: statusCode >= 500 ? 'Ocurrio un error interno en la API.' : error.message
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (env.nodeEnv !== 'production' && statusCode >= 500) {
    payload.debug = error.message;
  }

  return res.status(statusCode).json(payload);
}
