import { Router } from 'express';
import { all, get } from '../database/connection.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reportRouter = Router();

function buildLastSevenDays(rows) {
  const byDay = new Map(rows.map((row) => [row.day, row]));
  const days = [];

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const row = byDay.get(key);

    days.push({
      date: key,
      fecha: key,
      diagnostics: row?.diagnostics || 0,
      diagnosticos: row?.diagnostics || 0,
      highRisk: row?.high_risk || 0,
      altoRiesgo: row?.high_risk || 0
    });
  }

  return days;
}

reportRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const summary = await get(`
      SELECT
        COUNT(*) AS total_cases,
        SUM(CASE WHEN diagnostic_state = 'saludable' THEN 1 ELSE 0 END) AS healthy,
        SUM(CASE WHEN diagnostic_state = 'atencion preventiva' THEN 1 ELSE 0 END) AS preventive,
        SUM(CASE WHEN risk_level = 'alto' OR diagnostic_state = 'estres hidrico' THEN 1 ELSE 0 END) AS alerts
      FROM cases
    `);

    const diagnosticsByState = await all(`
      SELECT
        r.diagnostic_state,
        r.risk_level,
        r.priority,
        r.color,
        COUNT(c.id) AS total
      FROM recommendations r
      LEFT JOIN cases c ON c.diagnostic_state = r.diagnostic_state
      GROUP BY r.id
      ORDER BY r.sort_order
    `);

    const alertsByZone = await all(`
      SELECT
        z.id AS zone_id,
        z.name AS zone_name,
        COUNT(c.id) AS total_alerts
      FROM zones z
      LEFT JOIN cases c
        ON c.zone_id = z.id
        AND (c.risk_level = 'alto' OR c.diagnostic_state = 'estres hidrico')
      GROUP BY z.id
      ORDER BY total_alerts DESC, z.name
    `);

    const weeklyRows = await all(`
      SELECT
        date(created_at) AS day,
        COUNT(*) AS diagnostics,
        SUM(CASE WHEN risk_level = 'alto' OR diagnostic_state = 'estres hidrico' THEN 1 ELSE 0 END) AS high_risk
      FROM cases
      WHERE date(created_at) >= date('now', '-6 days')
      GROUP BY date(created_at)
      ORDER BY day
    `);

    res.json({
      generatedAt: new Date().toISOString(),
      titulo: 'Reporte operativo P.L.A.N.T.A.',
      summary: {
        totalCases: summary.total_cases || 0,
        totalCasos: summary.total_cases || 0,
        healthy: summary.healthy || 0,
        saludables: summary.healthy || 0,
        preventive: summary.preventive || 0,
        preventivos: summary.preventive || 0,
        alerts: summary.alerts || 0,
        alertas: summary.alerts || 0
      },
      diagnosticsByState: diagnosticsByState.map((row) => ({
        state: row.diagnostic_state,
        estado: row.diagnostic_state,
        riskLevel: row.risk_level,
        nivelRiesgo: row.risk_level,
        priority: row.priority,
        prioridad: row.priority,
        total: row.total,
        color: row.color
      })),
      diagnosticosPorEstado: diagnosticsByState.map((row) => ({
        estado: row.diagnostic_state,
        total: row.total,
        color: row.color
      })),
      alertsByZone: alertsByZone.map((row) => ({
        zoneId: row.zone_id,
        zonaId: row.zone_id,
        zoneName: row.zone_name,
        zona: row.zone_name,
        totalAlerts: row.total_alerts,
        totalAlertas: row.total_alerts
      })),
      alertasPorZona: alertsByZone.map((row) => ({
        zona: row.zone_name,
        total: row.total_alerts
      })),
      weeklyTrend: buildLastSevenDays(weeklyRows),
      tendenciaSemanal: buildLastSevenDays(weeklyRows),
      print: {
        enabled: true,
        label: 'Usar impresion del navegador para exportar PDF'
      }
    });
  })
);
