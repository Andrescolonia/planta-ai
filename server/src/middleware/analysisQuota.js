import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const hourWindow = [];
const dayWindow = [];

function removeExpired(items, now, windowMs) {
  while (items.length > 0 && now - items[0] >= windowMs) {
    items.shift();
  }
}

export function analysisQuota(req, _res, next) {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  removeExpired(hourWindow, now, hourMs);
  removeExpired(dayWindow, now, dayMs);

  if (env.maxAnalysesPerHour > 0 && hourWindow.length >= env.maxAnalysesPerHour) {
    next(
      new HttpError(
        429,
        'Se alcanzo el limite horario de analisis para la exposicion. El modo demo puede reactivarse si es necesario.'
      )
    );
    return;
  }

  if (env.maxAnalysesPerDay > 0 && dayWindow.length >= env.maxAnalysesPerDay) {
    next(
      new HttpError(
        429,
        'Se alcanzo el limite diario de analisis para la exposicion. Vuelve a intentarlo manana.'
      )
    );
    return;
  }

  hourWindow.push(now);
  dayWindow.push(now);
  next();
}

export function getAnalysisQuotaStats() {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;

  removeExpired(hourWindow, now, hourMs);
  removeExpired(dayWindow, now, dayMs);

  return {
    hourCount: hourWindow.length,
    dayCount: dayWindow.length
  };
}
