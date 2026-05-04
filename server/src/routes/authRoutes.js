import { Router } from 'express';
import { all, get } from '../database/connection.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { HttpError, badRequest } from '../utils/httpError.js';
import { formatUser } from '../utils/formatters.js';

export const authRouter = Router();

authRouter.get(
  '/demo-users',
  asyncHandler(async (_req, res) => {
    const users = await all(
      `SELECT id, name, username, role, active, created_at
       FROM users
       WHERE active = 1
       ORDER BY id`
    );

    res.json({
      users: users.map(formatUser),
      passwordHint: 'Todos los usuarios demo usan la clave planta2026.'
    });
  })
);

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      throw badRequest('Ingresa usuario y contrasena.');
    }

    const user = await get(
      `SELECT id, name, username, role, active, created_at
       FROM users
       WHERE username = ? AND password = ? AND active = 1`,
      [String(username).trim(), String(password)]
    );

    if (!user) {
      throw new HttpError(401, 'Credenciales demo no validas.');
    }

    const token = Buffer.from(`${user.id}:${user.username}:${user.role}:demo`).toString('base64url');

    res.json({
      message: 'Sesion demo iniciada correctamente.',
      user: formatUser(user),
      session: {
        token,
        type: 'demo-local',
        expiresIn: '8h'
      }
    });
  })
);
