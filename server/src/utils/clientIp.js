export function getClientIp(req) {
  const cfIp = req.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = req.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}
