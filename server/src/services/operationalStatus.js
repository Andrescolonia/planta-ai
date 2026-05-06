const startedAt = new Date();
let lastError = null;

export function recordLastError(error, statusCode) {
  if (!statusCode || statusCode < 400) {
    return;
  }

  lastError = {
    message: statusCode >= 500 ? 'Ocurrio un error interno en la API.' : error.message,
    statusCode,
    occurredAt: new Date().toISOString()
  };
}

export function getOperationalStatus() {
  return {
    startedAt: startedAt.toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt.getTime()) / 1000),
    lastError
  };
}
