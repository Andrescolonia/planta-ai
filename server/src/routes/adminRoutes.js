import { Router } from 'express';
import { all, get, run } from '../database/connection.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatRecommendation, formatUser } from '../utils/formatters.js';
import { badRequest, notFound } from '../utils/httpError.js';

export const adminRouter = Router();

const validRoles = new Set(['operador', 'supervisor', 'administrador']);

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await all(
      `SELECT id, name, username, role, active, created_at
       FROM users
       ORDER BY id`
    );

    res.json({ users: users.map(formatUser), usuarios: users.map(formatUser) });
  })
);

adminRouter.post(
  '/users',
  asyncHandler(async (req, res) => {
    const { name, username, password = 'planta2026', role = 'operador' } = req.body;

    if (!name || !username) {
      throw badRequest('Nombre y usuario son obligatorios.');
    }

    if (!validRoles.has(role)) {
      throw badRequest('Rol no valido para usuarios demo.');
    }

    const insert = await run(
      `INSERT INTO users (name, username, password, role)
       VALUES (?, ?, ?, ?)`,
      [String(name).trim(), String(username).trim(), String(password), role]
    );

    const user = await get(
      `SELECT id, name, username, role, active, created_at
       FROM users
       WHERE id = ?`,
      [insert.id]
    );

    res.status(201).json({
      message: 'Usuario demo creado.',
      user: formatUser(user),
      usuario: formatUser(user)
    });
  })
);

adminRouter.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const existing = await get('SELECT * FROM users WHERE id = ?', [Number(req.params.id)]);
    if (!existing) {
      throw notFound('Usuario demo no encontrado.');
    }

    const name = req.body.name ?? existing.name;
    const role = req.body.role ?? existing.role;
    const active = req.body.active ?? existing.active;

    if (!validRoles.has(role)) {
      throw badRequest('Rol no valido para usuarios demo.');
    }

    await run(
      `UPDATE users
       SET name = ?, role = ?, active = ?
       WHERE id = ?`,
      [String(name).trim(), role, active ? 1 : 0, existing.id]
    );

    const updated = await get(
      `SELECT id, name, username, role, active, created_at
       FROM users
       WHERE id = ?`,
      [existing.id]
    );

    res.json({
      message: 'Usuario demo actualizado.',
      user: formatUser(updated),
      usuario: formatUser(updated)
    });
  })
);

adminRouter.get(
  '/recommendations',
  asyncHandler(async (_req, res) => {
    const rows = await all('SELECT * FROM recommendations ORDER BY sort_order');
    res.json({
      recommendations: rows.map(formatRecommendation),
      recomendaciones: rows.map(formatRecommendation)
    });
  })
);

adminRouter.put(
  '/recommendations/:id',
  asyncHandler(async (req, res) => {
    const existing = await get('SELECT * FROM recommendations WHERE id = ?', [Number(req.params.id)]);
    if (!existing) {
      throw notFound('Recomendacion no encontrada.');
    }

    await run(
      `UPDATE recommendations
       SET risk_level = ?,
           priority = ?,
           irrigation_recommendation = ?,
           automatic_observation = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        req.body.riskLevel || req.body.nivelRiesgo || existing.risk_level,
        req.body.priority || req.body.prioridad || existing.priority,
        req.body.irrigationRecommendation ||
          req.body.recomendacionRiego ||
          existing.irrigation_recommendation,
        req.body.automaticObservation || req.body.observacionAutomatica || existing.automatic_observation,
        existing.id
      ]
    );

    const updated = await get('SELECT * FROM recommendations WHERE id = ?', [existing.id]);

    res.json({
      message: 'Recomendacion actualizada.',
      recommendation: formatRecommendation(updated),
      recomendacion: formatRecommendation(updated)
    });
  })
);

adminRouter.get(
  '/diagnostic-states',
  asyncHandler(async (_req, res) => {
    const rows = await all('SELECT * FROM recommendations ORDER BY sort_order');
    res.json({
      states: rows.map((row) => ({
        id: row.id,
        value: row.diagnostic_state,
        label: row.diagnostic_state,
        riskLevel: row.risk_level,
        priority: row.priority,
        color: row.color
      })),
      estados: rows.map((row) => row.diagnostic_state)
    });
  })
);

adminRouter.get('/model', (_req, res) => {
  res.json({
    mode: env.analysisMode,
    modo: env.analysisMode,
    model: {
      name: 'P.L.A.N.T.A. Vision Demo',
      version: '0.1.0-demo',
      type: 'Motor simulado local',
      description:
        'Servicio demo deterministico para sustentar el flujo del MVP sin depender de APIs externas.',
      futureReplacement:
        'El archivo server/src/services/analysisService.js concentra la logica reemplazable por un modelo real.'
    }
  });
});
