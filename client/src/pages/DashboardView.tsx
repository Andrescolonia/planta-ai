import { AlertTriangle, Droplet, Leaf, PlusCircle, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { ViewKey } from '../layouts/AppShell';
import { api } from '../services/api';
import type { DashboardData } from '../types';
import { diagnosticLabel, formatDateTime, statusBadgeClass } from '../utils/format';

interface DashboardViewProps {
  onNavigate: (view: ViewKey) => void;
}

const fallbackData: DashboardData = {
  kpis: {
    diagnostics: 0,
    healthyPlants: 0,
    preventiveCases: 0,
    irrigationAlerts: 0
  },
  recentActivity: [],
  charts: {
    diagnosticsByState: [],
    weeklyTrend: []
  }
};

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const [data, setData] = useState<DashboardData>(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : 'No se pudo cargar el dashboard.')
      )
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = [
    {
      label: 'Diagnósticos realizados',
      value: data.kpis.diagnostics,
      icon: TrendingUp,
      tone: 'bg-blue-50 text-blue-700'
    },
    {
      label: 'Plantas saludables',
      value: data.kpis.healthyPlants,
      icon: Leaf,
      tone: 'bg-green-50 text-green-700'
    },
    {
      label: 'Atención preventiva',
      value: data.kpis.preventiveCases,
      icon: AlertTriangle,
      tone: 'bg-yellow-50 text-yellow-700'
    },
    {
      label: 'Alertas de riego',
      value: data.kpis.irrigationAlerts,
      icon: Droplet,
      tone: 'bg-orange-50 text-orange-700'
    }
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Vista general de zonas verdes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen operativo del monitoreo visual y alertas de mantenimiento.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate('reportes')}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-accent/20"
          >
            Generar reporte semanal
          </button>
          <button
            onClick={() => onNavigate('analisis')}
            className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90"
          >
            <PlusCircle className="h-4 w-4" />
            Nuevo análisis
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {loading && <span className="h-2 w-16 animate-pulse rounded bg-muted" />}
              </div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-1 text-3xl font-semibold">{card.value}</p>
            </article>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.85fr]">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-5 flex flex-col justify-between gap-2 md:flex-row md:items-center">
            <div>
              <h3 className="font-semibold">Tendencia semanal</h3>
              <p className="text-sm text-muted-foreground">Diagnósticos y alertas de los últimos días.</p>
            </div>
            <span className="rounded bg-muted px-3 py-1 text-xs text-muted-foreground">Últimos 7 días</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7e6" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#66706a" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#66706a" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="diagnostics"
                  name="Diagnósticos"
                  stroke="#2D5A27"
                  strokeWidth={3}
                  dot={{ fill: '#2D5A27', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="alerts"
                  name="Alertas"
                  stroke="#D6AE37"
                  strokeWidth={3}
                  dot={{ fill: '#D6AE37', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold">Diagnósticos por estado</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.diagnosticsByState}
                  dataKey="total"
                  nameKey="state"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {data.charts.diagnosticsByState.map((entry) => (
                    <Cell key={entry.state} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, _name, item) => [value, diagnosticLabel(item.payload.state)]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {data.charts.diagnosticsByState.map((item) => (
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

      <section className="mt-6 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h3 className="font-semibold">Actividad reciente</h3>
            <p className="text-sm text-muted-foreground">Últimos casos guardados en la plataforma.</p>
          </div>
          <button onClick={() => onNavigate('historial')} className="text-sm font-medium text-secondary">
            Ver historial
          </button>
        </div>
        <div className="divide-y divide-border">
          {data.recentActivity.map((item) => (
            <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_0.8fr_0.55fr_0.55fr] md:items-center">
              <div>
                <p className="font-medium">Caso #{item.id}</p>
                <p className="text-sm text-muted-foreground">{item.location}</p>
              </div>
              <p className="text-sm text-muted-foreground">{item.zoneName}</p>
              <span
                className={`w-fit rounded border px-2 py-1 text-xs font-medium ${statusBadgeClass(
                  item.diagnosticState
                )}`}
              >
                {diagnosticLabel(item.diagnosticState)}
              </span>
              <p className="text-sm text-muted-foreground md:text-right">{formatDateTime(item.createdAt)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
