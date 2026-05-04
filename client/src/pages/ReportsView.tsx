import { Calendar, Download, Printer, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api } from '../services/api';
import type { ReportData } from '../types';
import { diagnosticLabel, formatDateTime } from '../utils/format';

const emptyReport: ReportData = {
  generatedAt: new Date().toISOString(),
  summary: {
    totalCases: 0,
    healthy: 0,
    preventive: 0,
    alerts: 0
  },
  diagnosticsByState: [],
  alertsByZone: [],
  weeklyTrend: []
};

export function ReportsView() {
  const [report, setReport] = useState<ReportData>(emptyReport);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .reports()
      .then(setReport)
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar reportes.')
      );
  }, []);

  return (
    <div className="printable-report p-4 md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Reportes imprimibles</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen de diagnósticos, alertas por zona y tendencia semanal.
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-accent/20">
            <Calendar className="h-4 w-4" />
            Últimos registros
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90"
          >
            <Printer className="h-4 w-4" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="print-card mb-6 rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-secondary">
              Reporte operativo
            </p>
            <h3 className="mt-1 text-xl font-semibold">P.L.A.N.T.A. - Zonas verdes USC</h3>
          </div>
          <p className="text-right text-sm text-muted-foreground">
            Generado
            <br />
            {formatDateTime(report.generatedAt)}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <ReportMetric label="Diagnósticos totales" value={report.summary.totalCases} />
          <ReportMetric label="Saludables" value={report.summary.healthy} />
          <ReportMetric label="Atención preventiva" value={report.summary.preventive} />
          <ReportMetric label="Alertas de riego" value={report.summary.alerts} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="print-card rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold">Tendencia semanal</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7e6" />
                <XAxis dataKey="date" stroke="#66706a" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#66706a" tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="diagnostics" name="Diagnósticos" fill="#2D5A27" radius={[6, 6, 0, 0]} />
                <Bar dataKey="highRisk" name="Alto riesgo" fill="#D6AE37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="print-card rounded-lg border border-border bg-card p-5">
          <h3 className="mb-4 font-semibold">Diagnósticos por estado</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.diagnosticsByState}
                  dataKey="total"
                  nameKey="state"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {report.diagnosticsByState.map((entry) => (
                    <Cell key={entry.state} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {report.diagnosticsByState.map((item) => (
              <div key={item.state} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  {diagnosticLabel(item.state)}
                </span>
                <span className="font-medium">{item.total}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="print-card mt-6 rounded-lg border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold">Alertas por zona</h3>
          <Download className="no-print h-5 w-5 text-muted-foreground" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {report.alertsByZone.map((zone) => (
            <div key={zone.zoneId} className="rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{zone.zoneName}</p>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min(zone.totalAlerts * 28, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold">{zone.totalAlerts}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReportMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-lg border border-border bg-muted/35 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-3xl font-semibold">{value}</p>
        <TrendingUp className="mb-1 h-4 w-4 text-secondary" />
      </div>
    </article>
  );
}
