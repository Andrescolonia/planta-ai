export class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function badRequest(message, details = null) {
  return new HttpError(400, message, details);
}

export function notFound(message = 'Recurso no encontrado') {
  return new HttpError(404, message);
}
