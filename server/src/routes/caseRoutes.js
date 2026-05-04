import { Router } from 'express';
import { all, get, run } from '../database/connection.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatCase } from '../utils/formatters.js';
import { badRequest, notFound } from '../utils/httpError.js';

export const caseRouter = Router();

function buildCaseFilters(query) {
  const where = [];
  const params = [];
  const diagnosticState = query.state || query.status || query.estado || query.resultado;

  if (diagnosticState) {
    where.push('c.diagnostic_state = ?');
    params.push(String(diagnosticState));
  }

  if (query.zoneId || query.zonaId) {
    where.push('c.zone_id = ?');
    params.push(Number(query.zoneId || query.zonaId));
  }

  if (query.zone || query.zona || query.zoneName) {
    where.push('z.name LIKE ?');
    params.push(`%${query.zone || query.zona || query.zoneName}%`);
  }

  if (query.priority || query.prioridad) {
    where.push('c.priority = ?');
    params.push(String(query.priority || query.prioridad));
  }

  if (query.from || query.desde) {
    where.push('c.created_at >= ?');
    params.push(`${query.from || query.desde}T00:00:00.000Z`);
  }

  if (query.to || query.hasta) {
    where.push('c.created_at <= ?');
    params.push(`${query.to || query.hasta}T23:59:59.999Z`);
  }

  return {
    sql: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params
  };
}

async function getCaseById(id) {
  const row = await get(
    `SELECT
      c.*,
      z.name AS zone_name,
      z.campus_area,
      u.name AS created_by_name
    FROM cases c
    JOIN zones z ON z.id = c.zone_id
    LEFT JOIN users u ON u.id = c.created_by
    WHERE c.id = ?`,
    [id]
  );

  return formatCase(row);
}

caseRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filters = buildCaseFilters(req.query);
    const limit = Math.min(Number(req.query.limit || 50), 100);

    const rows = await all(
      `SELECT
        c.*,
        z.name AS zone_name,
        z.campus_area,
        u.name AS created_by_name
      FROM cases c
      JOIN zones z ON z.id = c.zone_id
      LEFT JOIN users u ON u.id = c.created_by
      ${filters.sql}
      ORDER BY c.created_at DESC
      LIMIT ?`,
      [...filters.params, limit]
    );

    res.json({
      cases: rows.map(formatCase),
      casos: rows.map(formatCase),
      filters: req.query
    });
  })
);

caseRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await getCaseById(Number(req.params.id));

    if (!item) {
      throw notFound('Caso no encontrado.');
    }

    res.json({ case: item, caso: item });
  })
);

caseRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = req.body || {};
    const result = payload.result || payload.analysisResult || payload;
    const zoneId = Number(payload.zoneId || payload.zonaId || result.zoneId || result.zonaId);
    const createdBy = payload.createdBy || payload.userId || result.createdBy || null;
    const diagnosticState = result.diagnosticState || result.estado || result.resultado;

    if (!zoneId) {
      throw badRequest('Selecciona una zona para guardar el caso.');
    }

    if (!diagnosticState) {
      throw badRequest('No se encontro un diagnostico para guardar.');
    }

    const zone = await get('SELECT id FROM zones WHERE id = ?', [zoneId]);
    if (!zone) {
      throw badRequest('La zona seleccionada no existe.');
    }

    const recommendation = await get('SELECT * FROM recommendations WHERE diagnostic_state = ?', [
      diagnosticState
    ]);

    if (!recommendation) {
      throw badRequest('El estado diagnostico no existe en el catalogo demo.');
    }

    const confidence = Number(result.confidence || result.confianza || 80);
    const location =
      payload.location || payload.ubicacion || result.location || result.ubicacion || 'Sin especificar';
    const imagePath =
      payload.imagePath ||
      payload.imageUrl ||
      payload.uploadedImage?.path ||
      payload.uploadedImage?.url ||
      result.imagePath ||
      null;
    const imageFilename =
      payload.imageFilename || payload.uploadedImage?.filename || result.imageFilename || null;

    const insert = await run(
      `INSERT INTO cases (
        zone_id,
        created_by,
        location,
        image_path,
        image_filename,
        diagnostic_state,
        confidence,
        risk_level,
        irrigation_recommendation,
        observations,
        priority,
        analysis_mode
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        zoneId,
        createdBy ? Number(createdBy) : null,
        location,
        imagePath,
        imageFilename,
        diagnosticState,
        confidence,
        result.riskLevel || result.nivelRiesgo || recommendation.risk_level,
        result.irrigationRecommendation ||
          result.recomendacionRiego ||
          result.recomendacion ||
          recommendation.irrigation_recommendation,
        result.observations || result.observaciones || recommendation.automatic_observation,
        result.priority || result.prioridad || recommendation.priority,
        result.analysisMode || result.mode || env.analysisMode
      ]
    );

    const createdCase = await getCaseById(insert.id);

    res.status(201).json({
      message: 'Caso guardado correctamente.',
      case: createdCase,
      caso: createdCase
    });
  })
);
