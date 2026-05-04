import { Router } from 'express';
import { all, get } from '../database/connection.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatCase } from '../utils/formatters.js';
import { notFound } from '../utils/httpError.js';

export const zoneRouter = Router();

function computeZoneStatus(row) {
  if ((row.alert_count || 0) > 0) {
    return 'atencion prioritaria';
  }

  if ((row.preventive_count || 0) > 0) {
    return 'seguimiento preventivo';
  }

  return row.general_status || 'estable';
}

function formatZone(row, recentAlert = null) {
  return {
    id: row.id,
    name: row.name,
    nombre: row.name,
    campusArea: row.campus_area,
    areaCampus: row.campus_area,
    description: row.description,
    descripcion: row.description,
    generalStatus: computeZoneStatus(row),
    estadoGeneral: computeZoneStatus(row),
    casesCount: row.cases_count || 0,
    numeroCasos: row.cases_count || 0,
    recentAlerts: row.alert_count || 0,
    alertasRecientes: row.alert_count || 0,
    lastCaseAt: row.last_case_at,
    ultimaRevision: row.last_case_at,
    recentAlert
  };
}

async function getZoneSummary(id = null) {
  const params = id ? [id] : [];
  const rows = await all(
    `SELECT
      z.*,
      COUNT(c.id) AS cases_count,
      SUM(CASE WHEN c.risk_level = 'alto' OR c.diagnostic_state = 'estres hidrico' THEN 1 ELSE 0 END) AS alert_count,
      SUM(CASE WHEN c.diagnostic_state = 'atencion preventiva' THEN 1 ELSE 0 END) AS preventive_count,
      MAX(c.created_at) AS last_case_at
    FROM zones z
    LEFT JOIN cases c ON c.zone_id = z.id
    ${id ? 'WHERE z.id = ?' : ''}
    GROUP BY z.id
    ORDER BY z.name`,
    params
  );

  const formatted = [];

  for (const row of rows) {
    const alert = await get(
      `SELECT id, created_at, diagnostic_state, priority
       FROM cases
       WHERE zone_id = ?
         AND (risk_level = 'alto' OR diagnostic_state = 'estres hidrico')
       ORDER BY created_at DESC
       LIMIT 1`,
      [row.id]
    );

    formatted.push(formatZone(row, alert));
  }

  return formatted;
}

zoneRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const zones = await getZoneSummary();
    res.json({ zones, zonas: zones });
  })
);

zoneRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const [zone] = await getZoneSummary(Number(req.params.id));

    if (!zone) {
      throw notFound('Zona verde no encontrada.');
    }

    const cases = await all(
      `SELECT
        c.*,
        z.name AS zone_name,
        z.campus_area,
        u.name AS created_by_name
      FROM cases c
      JOIN zones z ON z.id = c.zone_id
      LEFT JOIN users u ON u.id = c.created_by
      WHERE c.zone_id = ?
      ORDER BY c.created_at DESC
      LIMIT 10`,
      [zone.id]
    );

    res.json({
      zone,
      zona: zone,
      cases: cases.map(formatCase),
      casos: cases.map(formatCase)
    });
  })
);
