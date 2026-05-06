import {
  eventAccessRequired,
  isValidEventAccessToken
} from '../services/eventAccessService.js';
import { HttpError } from '../utils/httpError.js';

export function requireEventAccess(req, _res, next) {
  if (!eventAccessRequired()) {
    next();
    return;
  }

  const token = req.get('x-event-access-token');

  if (!isValidEventAccessToken(token)) {
    next(new HttpError(403, 'Ingresa el codigo de acceso del evento para continuar.'));
    return;
  }

  next();
}
