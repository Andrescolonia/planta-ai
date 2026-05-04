import { Router } from 'express';
import { all, get } from '../database/connection.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatCase } from '../utils/formatters.js';

export const dashboardRouter = Router();

function buildLastSevenDays(rows) {
  const countByDay = new Map(rows.map((row) => [row.day, row]));
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const row = countByDay.get(key);

    days.push({
      date: key,
      fecha: key,
      diagnostics: row?.diagnostics || 0,
      diagnosticos: row?.diagnostics || 0,
      alerts: row?.alerts || 0,
      alertas: row?.alerts || 0
    });
  }

  return days;
}

dashboardRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const kpis = await get(`
      SELECT
        COUNT(*) AS diagnostics,
        SUM(CASE WHEN diagnostic_state = 'saludable' THEN 1 ELSE 0 END) AS healthy,
        SUM(CASE WHEN diagnostic_state = 'atencion preventiva' THEN 1 ELSE 0 END) AS preventive,
        SUM(CASE WHEN risk_level = 'alto' OR diagnostic_state = 'estres hidrico' THEN 1 ELSE 0 END) AS irrigation_alerts
      FROM cases
    `);

    const recentRows = await all(`
      SELECT
        c.*,
        z.name AS zone_name,
        z.campus_area,
        u.name AS created_by_name
      FROM cases c
      JOIN zones z ON z.id = c.zone_id
      LEFT JOIN users u ON u.id = c.created_by
      ORDER BY c.created_at DESC
      LIMIT 6
    `);

    const stateRows = await all(`
      SELECT
        r.diagnostic_state,
        r.color,
        r.sort_order,
        COUNT(c.id) AS total
      FROM recommendations r
      LEFT JOIN cases c ON c.diagnostic_state = r.diagnostic_state
      GROUP BY r.id
      ORDER BY r.sort_order
    `);

    const weeklyRows = await all(`
      SELECT
        date(created_at) AS day,
        COUNT(*) AS diagnostics,
        SUM(CASE WHEN risk_level = 'alto' OR diagnostic_state = 'estres hidrico' THEN 1 ELSE 0 END) AS alerts
      FROM cases
      WHERE date(created_at) >= date('now', '-6 days')
      GROUP BY date(created_at)
      ORDER BY day
    `);

    res.json({
      kpis: {
        diagnostics: kpis.diagnostics || 0,
        diagnosticosRealizados: kpis.diagnostics || 0,
        healthyPlants: kpis.healthy || 0,
        plantasSaludables: kpis.healthy || 0,
        preventiveCases: kpis.preventive || 0,
        casosAtencionPreventiva: kpis.preventive || 0,
        irrigationAlerts: kpis.irrigation_alerts || 0,
        alertasRiego: kpis.irrigation_alerts || 0
      },
      recentActivity: recentRows.map(formatCase),
      actividadReciente: recentRows.map(formatCase),
      quickActions: [
        { label: 'Nuevo analisis', path: '/analisis' },
        { label: 'Historial', path: '/historial' },
        { label: 'Reportes', path: '/reportes' }
      ],
      charts: {
        diagnosticsByState: stateRows.map((row) => ({
          state: row.diagnostic_state,
          estado: row.diagnostic_state,
          total: row.total,
          color: row.color
        })),
        weeklyTrend: buildLastSevenDays(weeklyRows)
      }
    });
  })
);
