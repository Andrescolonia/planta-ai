import { Router } from 'express';
import { get, run } from '../database/connection.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import {
  createGuestUsername,
  createSession,
  ensurePasswordIsValid,
  hashPassword,
  validatePersonName,
  normalizeEmail,
  normalizeRole,
  normalizeUsername,
  parseSessionToken,
  verifyPassword
} from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError, badRequest } from '../utils/httpError.js';
import { formatUser } from '../utils/formatters.js';

export const authRouter = Router();

function userSelect(extra = '') {
  return `
    SELECT id, name, username, email, role, active, is_guest, created_at, last_login ${extra}
    FROM users
  `;
}

async function findUserByIdentifier(identifier) {
  const value = String(identifier || '').trim().toLowerCase();

  if (!value) {
    return null;
  }

  return get(
    `${userSelect(', password_hash')}
     WHERE active = 1 AND (LOWER(username) = ? OR LOWER(email) = ?)`,
    [value, value]
  );
}

authRouter.post(
  '/login',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const identifier = req.body.identifier ?? req.body.username ?? req.body.email;
    const { password } = req.body;

    if (!identifier || !password) {
      throw badRequest('Ingresa usuario o correo y contrasena.');
    }

    const user = await findUserByIdentifier(identifier);

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new HttpError(401, 'Credenciales no validas.');
    }

    await run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const updated = await get(`${userSelect()} WHERE id = ?`, [user.id]);

    res.json({
      message: 'Sesion iniciada correctamente.',
      user: formatUser(updated),
      session: createSession(updated, 'local')
    });
  })
);

authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!name || !username || !password) {
      throw badRequest('Nombre, usuario y contrasena son obligatorios.');
    }

    if (username.length < 3) {
      throw badRequest('El usuario debe tener al menos 3 caracteres.');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw badRequest('Ingresa un correo valido.');
    }

    if (!ensurePasswordIsValid(password)) {
      throw badRequest('La contrasena debe tener minimo 6 caracteres.');
    }

    try {
      const insert = await run(
        `INSERT INTO users (name, username, email, password_hash, role, active, is_guest)
         VALUES (?, ?, ?, ?, ?, 1, 0)`,
        [name, username, email, await hashPassword(password), normalizeRole('usuario')]
      );

      const user = await get(`${userSelect()} WHERE id = ?`, [insert.id]);

      res.status(201).json({
        message: 'Cuenta creada correctamente.',
        user: formatUser(user),
        session: createSession(user, 'local')
      });
    } catch (error) {
      if (String(error.message || '').includes('UNIQUE')) {
        throw badRequest('Ya existe un usuario o correo registrado con esos datos.');
      }

      throw error;
    }
  })
);

authRouter.post(
  '/guest',
  authRateLimit,
  asyncHandler(async (req, res) => {
    const guestNameValidation = validatePersonName(req.body.name, { required: false });
    const username = createGuestUsername();

    if (!guestNameValidation.valid) {
      throw badRequest(guestNameValidation.message);
    }

    const name =
      guestNameValidation.name ||
      `Invitado ${Math.floor(1000 + Math.random() * 9000).toString()}`;

    const insert = await run(
      `INSERT INTO users (name, username, email, password_hash, role, active, is_guest, last_login)
       VALUES (?, ?, NULL, NULL, 'invitado', 1, 1, CURRENT_TIMESTAMP)`,
      [name, username]
    );

    const user = await get(`${userSelect()} WHERE id = ?`, [insert.id]);

    res.status(201).json({
      message: 'Ingreso invitado habilitado.',
      user: formatUser(user),
      session: createSession(user, 'guest-local')
    });
  })
);

authRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const header = req.get('authorization') || '';
    const token = header.replace(/^Bearer\s+/i, '').trim();
    const session = parseSessionToken(token);

    if (!session) {
      throw new HttpError(401, 'Sesion no valida.');
    }

    const user = await get(`${userSelect()} WHERE id = ? AND active = 1`, [session.id]);

    if (!user) {
      throw new HttpError(401, 'Usuario no disponible.');
    }

    res.json({
      message: 'Sesion local valida.',
      user: formatUser(user),
      session: createSession(user, user.is_guest ? 'guest-local' : 'local')
    });
  })
);
