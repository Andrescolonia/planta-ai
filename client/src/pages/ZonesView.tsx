import { AlertCircle, CheckCircle2, Clock, Inbox, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { api } from '../services/api';
import type { ZoneItem } from '../types';
import { formatDateTime } from '../utils/format';

export function ZonesView() {
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .zones()
      .then((response) => setZones(response.zones))
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar las zonas.')
      );
  }, []);

  const summary = useMemo(
    () => ({
      stable: zones.filter((zone) => zone.generalStatus === 'estable').length,
      attention: zones.filter((zone) => zone.generalStatus !== 'estable').length,
      alerts: zones.reduce((acc, zone) => acc + zone.recentAlerts, 0)
    }),
    [zones]
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Gestión de zonas verdes</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organización por áreas institucionales y prioridades de mantenimiento.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <SummaryCard icon={CheckCircle2} label="Zonas estables" value={summary.stable} tone="green" />
        <SummaryCard icon={AlertCircle} label="Requieren seguimiento" value={summary.attention} tone="yellow" />
        <SummaryCard icon={MapPin} label="Alertas recientes" value={summary.alerts} tone="blue" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {zones.length === 0 && (
          <div className="xl:col-span-2">
            <EmptyState
              icon={Inbox}
              title="Sin zonas registradas"
              description="El sembrado demo crea zonas automáticamente al iniciar el backend."
            />
          </div>
        )}

        {zones.map((zone) => {
          const warning = zone.generalStatus !== 'estable';
          return (
            <article
              key={zone.id}
              className={`rounded-lg border bg-card p-5 ${
                warning ? 'border-yellow-300 bg-yellow-50/30' : 'border-border'
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                      warning ? 'bg-yellow-100 text-yellow-700' : 'bg-secondary/10 text-secondary'
                    }`}
                  >
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{zone.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{zone.campusArea}</p>
                  </div>
                </div>
                <span
                  className={`rounded border px-2 py-1 text-xs font-medium ${
                    warning
                      ? 'border-yellow-200 bg-yellow-100 text-yellow-700'
                      : 'border-green-200 bg-green-100 text-green-700'
                  }`}
                >
                  {zone.generalStatus}
                </span>
              </div>

              <p className="mb-4 text-sm leading-6 text-muted-foreground">{zone.description}</p>

              <div className="grid grid-cols-3 gap-3">
                <Metric label="Casos" value={zone.casesCount} />
                <Metric label="Alertas" value={zone.recentAlerts} />
                <Metric label="Estado" value={warning ? 'Seguimiento' : 'Normal'} />
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Última revisión: {formatDateTime(zone.lastCaseAt)}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: number;
  tone: 'green' | 'yellow' | 'blue';
}) {
  const toneClasses = {
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-700'
  };

  return (
    <article className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg bg-muted/45 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
