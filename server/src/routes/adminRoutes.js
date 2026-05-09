import { Router } from 'express';
import { all, get, run } from '../database/connection.js';
import { env } from '../config/env.js';
import { getAnalysisQuotaStats } from '../middleware/analysisQuota.js';
import {
  ADMIN_ASSIGNABLE_ROLES,
  ensurePasswordIsValid,
  hashPassword,
  normalizeEmail,
  normalizeRole,
  normalizeUsername
} from '../services/authService.js';
import { eventAccessRequired } from '../services/eventAccessService.js';
import { getOperationalStatus } from '../services/operationalStatus.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatRecommendation, formatUser } from '../utils/formatters.js';
import { badRequest, notFound } from '../utils/httpError.js';
import {
  publicAiIdentity,
  publicAnalysisMode,
  publicModelName,
  publicModelVersion
} from '../utils/publicAiLabels.js';

export const adminRouter = Router();

const assignableRoles = new Set(ADMIN_ASSIGNABLE_ROLES);

adminRouter.get(
  '/status',
  asyncHandler(async (_req, res) => {
    const databaseProbe = await get('SELECT 1 AS ok');
    const casesToday = await get(
      "SELECT COUNT(*) AS total FROM cases WHERE date(created_at) = date('now', 'localtime')"
    );
    const totalCases = await get('SELECT COUNT(*) AS total FROM cases');
    const quota = getAnalysisQuotaStats();
    const runtime = getOperationalStatus();

    res.json({
      checkedAt: new Date().toISOString(),
      backend: {
        status: 'activo',
        database: databaseProbe?.ok === 1 ? 'activa' : 'revision requerida',
        startedAt: runtime.startedAt,
        uptimeSeconds: runtime.uptimeSeconds
      },
      analysis: {
        mode: publicAnalysisMode(env.analysisMode),
        model: publicModelVersion(env.analysisMode),
        engineConfigured: env.analysisMode === 'openai' ? Boolean(env.openaiApiKey) : true,
        fallbackToDemo: env.openaiFallbackToDemo
      },
      storage: {
        driver: env.storageDriver,
        r2Configured: Boolean(env.r2Bucket && env.r2AccessKeyId && env.r2SecretAccessKey),
        fallbackToLocal: env.r2FallbackToLocal
      },
      exposure: {
        publicUrl: env.publicAppUrl || env.clientOrigin || '',
        clientOrigin: env.clientOrigin,
        eventAccessRequired: eventAccessRequired(),
        trustProxy: env.trustProxy
      },
      metrics: {
        casesToday: Number(casesToday?.total || 0),
        totalCases: Number(totalCases?.total || 0),
        analysesThisHour: quota.hourCount,
        analysesToday: quota.dayCount,
        maxAnalysesPerHour: env.maxAnalysesPerHour,
        maxAnalysesPerDay: env.maxAnalysesPerDay
      },
      limits: {
        maxUploadMb: env.maxUploadMb,
        globalRequests: env.rateLimitMax,
        authRequests: env.authRateLimitMax,
        analysisRequests: env.analysisRateLimitMax
      },
      lastError: runtime.lastError
    });
  })
);

adminRouter.get(
  '/users',
  asyncHandler(async (_req, res) => {
    const users = await all(
      `SELECT
        u.id,
        u.name,
        u.username,
        u.email,
        u.role,
        u.active,
        u.is_guest,
        u.created_at,
        u.last_login,
        COUNT(c.id) AS cases_count
       FROM users u
       LEFT JOIN cases c ON c.created_by = u.id
       GROUP BY u.id
       ORDER BY u.is_guest ASC, u.created_at DESC`
    );

    res.json({ users: users.map(formatUser), usuarios: users.map(formatUser) });
  })
);

adminRouter.post(
  '/users',
  asyncHandler(async (req, res) => {
    const name = String(req.body.name || '').trim();
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    const role = normalizeRole(req.body.role, 'usuario');

    if (!name || !username || !password) {
      throw badRequest('Nombre, usuario y contrasena son obligatorios.');
    }

    if (!assignableRoles.has(role)) {
      throw badRequest('Rol no valido para usuarios registrados.');
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

    let insert;

    try {
      insert = await run(
        `INSERT INTO users (name, username, email, password_hash, role, active, is_guest)
         VALUES (?, ?, ?, ?, ?, 1, 0)`,
        [name, username, email, await hashPassword(password), role]
      );
    } catch (error) {
      if (String(error.message || '').includes('UNIQUE')) {
        throw badRequest('Ya existe un usuario o correo registrado con esos datos.');
      }

      throw error;
    }

    const user = await get(
      `SELECT id, name, username, email, role, active, is_guest, created_at, last_login
       FROM users
       WHERE id = ?`,
      [insert.id]
    );

    res.status(201).json({
      message: 'Usuario creado correctamente.',
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
      throw notFound('Usuario no encontrado.');
    }

    const name = String(req.body.name ?? existing.name).trim();
    const role = normalizeRole(req.body.role ?? existing.role, existing.role);
    const active = req.body.active ?? existing.active;
    const email = req.body.email !== undefined ? normalizeEmail(req.body.email) : existing.email;
    const password = req.body.password ? String(req.body.password) : '';

    if (!assignableRoles.has(role) && role !== 'invitado') {
      throw badRequest('Rol no valido para usuarios registrados.');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw badRequest('Ingresa un correo valido.');
    }

    if (password && !ensurePasswordIsValid(password)) {
      throw badRequest('La contrasena debe tener minimo 6 caracteres.');
    }

    const updates = ['name = ?', 'role = ?', 'active = ?', 'email = ?'];
    const params = [name, role, active ? 1 : 0, email];

    if (password) {
      updates.push('password_hash = ?');
      params.push(await hashPassword(password));
    }

    params.push(existing.id);

    try {
      await run(
        `UPDATE users
         SET ${updates.join(', ')}
         WHERE id = ?`,
        params
      );
    } catch (error) {
      if (String(error.message || '').includes('UNIQUE')) {
        throw badRequest('Ya existe un usuario o correo registrado con esos datos.');
      }

      throw error;
    }

    const updated = await get(
      `SELECT id, name, username, email, role, active, is_guest, created_at, last_login
       FROM users
       WHERE id = ?`,
      [existing.id]
    );

    res.json({
      message: 'Usuario actualizado correctamente.',
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
  const demoMode = env.analysisMode === 'demo';

  res.json({
    mode: publicAnalysisMode(env.analysisMode),
    modo: publicAnalysisMode(env.analysisMode),
    model: {
      name: publicModelName(env.analysisMode),
      version: publicModelVersion(env.analysisMode),
      type: demoMode ? 'Motor simulado del sistema' : publicAiIdentity.modelType,
      description:
        demoMode
          ? 'Servicio demo deterministico para sustentar el flujo del MVP con datos controlados.'
          : publicAiIdentity.description,
      futureReplacement:
        demoMode
          ? 'Arquitectura preparada para activar FitoVision sin cambiar el flujo operativo.'
          : publicAiIdentity.futureReplacement,
      configured: env.analysisMode === 'openai' ? Boolean(env.openaiApiKey) : true,
      fallbackToDemo: env.openaiFallbackToDemo
    }
  });
});
