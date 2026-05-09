import { AlertCircle, BarChart3, CheckCircle2, Clock, FileText, Inbox, MapPin, ShieldCheck, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { api } from '../services/api';
import type { CaseItem, ZoneItem } from '../types';
import { diagnosticLabel, formatDateTime, priorityDotClass, priorityLabel, statusBadgeClass } from '../utils/format';

interface ZoneDetail {
  zone: ZoneItem;
  cases: CaseItem[];
}

export function ZonesView() {
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<ZoneDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    api
      .zones()
      .then((response) => setZones(response.zones))
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar las zonas.')
      );
  }, []);

  async function openZoneDetail(zone: ZoneItem) {
    setSelectedDetail({ zone, cases: [] });
    setDetailError('');
    setDetailLoading(true);

    try {
      const response = await api.zoneDetail(zone.id);
      setSelectedDetail({ zone: response.zone, cases: response.cases || [] });
    } catch (requestError) {
      setDetailError(
        requestError instanceof Error ? requestError.message : 'No fue posible cargar el detalle de la zona.'
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeZoneDetail() {
    setSelectedDetail(null);
    setDetailError('');
  }

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
              description="Los datos iniciales crean zonas automáticamente al iniciar el backend."
            />
          </div>
        )}

        {zones.map((zone) => {
          const warning = zone.generalStatus !== 'estable';
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => openZoneDetail(zone)}
              className={`zone-green-card rounded-lg border bg-card p-5 text-left ${
                warning ? 'zone-green-card--warning border-yellow-300 bg-yellow-50/30' : 'border-border'
              }`}
              aria-label={`Abrir detalle de ${zone.name}`}
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
                  className={`zone-card-status rounded border px-2 py-1 text-xs font-medium ${
                    warning
                      ? 'border-yellow-200 bg-yellow-100 text-yellow-700'
                      : 'border-green-200 bg-green-100 text-green-700'
                  }`}
                >
                  {zoneStatusLabel(zone.generalStatus)}
                </span>
              </div>

              <p className="mb-4 text-sm leading-6 text-muted-foreground">{zone.description}</p>

              <div className="zone-card-metrics grid grid-cols-3 gap-3">
                <Metric label="Casos" value={zone.casesCount} />
                <Metric label="Alertas" value={zone.recentAlerts} />
                <Metric label="Estado" value={warning ? 'Seguimiento' : 'Normal'} />
              </div>

              <div className="zone-card-review mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Última revisión: {formatDateTime(zone.lastCaseAt)}
              </div>
            </button>
          );
        })}
      </div>

      {selectedDetail && (
        <ZoneDetailPanel
          detail={selectedDetail}
          loading={detailLoading}
          error={detailError}
          onClose={closeZoneDetail}
        />
      )}
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
    <div className="zone-card-metric rounded-lg bg-muted/45 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="zone-card-metric__value mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function zoneStatusLabel(value?: string | null) {
  const map: Record<string, string> = {
    estable: 'Estable',
    'seguimiento preventivo': 'Seguimiento preventivo',
    'atencion prioritaria': 'Atención prioritaria'
  };

  return value ? map[value] || value : 'Sin estado';
}

function ZoneDetailPanel({
  detail,
  loading,
  error,
  onClose
}: {
  detail: ZoneDetail;
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  const { zone, cases } = detail;
  const alerts = cases.filter((item) => item.riskLevel === 'alto' || item.diagnosticState === 'estres hidrico');
  const diagnosticReport = buildDiagnosticReport(cases);
  const priorityReport = buildPriorityReport(cases);
  const latestCase = cases[0];
  const warning = zone.generalStatus !== 'estable';

  return (
    <div className="no-print case-detail-overlay">
      <section className="case-detail-panel zone-detail-panel w-full rounded-lg border border-border bg-card shadow-lg">
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detalle de zona verde
            </p>
            <h3 className="mt-1 text-2xl font-semibold">{zone.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{zone.campusArea} · {zone.description}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border p-2 transition hover:bg-accent/20"
            title="Cerrar detalle"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-5 p-5">
          <section className={`zone-detail-hero ${warning ? 'zone-detail-hero--warning' : ''}`}>
            <div className="flex items-start gap-4">
              <div className="zone-detail-hero__icon">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide">
                  Estado operativo de la zona
                </p>
                <h4 className="mt-1 text-xl font-semibold">{zoneStatusLabel(zone.generalStatus)}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Última revisión: {formatDateTime(zone.lastCaseAt)}
                </p>
              </div>
            </div>
            <div className="zone-detail-hero__badge">
              {warning ? 'Seguimiento activo' : 'Zona estable'}
            </div>
          </section>

          <div className="grid gap-3 md:grid-cols-4">
            <DetailMetric icon={FileText} label="Casos registrados" value={zone.casesCount} />
            <DetailMetric icon={AlertCircle} label="Alertas recientes" value={zone.recentAlerts} />
            <DetailMetric icon={BarChart3} label="Reportes cargados" value={cases.length} />
            <DetailMetric icon={ShieldCheck} label="Prioridad actual" value={warning ? 'Seguimiento' : 'Normal'} />
          </div>

          {loading && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
              Cargando reportes asociados...
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="zone-detail-report-grid">
            <ReportCard
              title="Diagnósticos por estado"
              description="Distribución de los últimos casos registrados en esta zona."
              emptyMessage="Sin diagnósticos para graficar."
              hasData={diagnosticReport.length > 0}
            >
              <ZoneReportBars items={diagnosticReport} />
            </ReportCard>

            <ReportCard
              title="Prioridad de atención"
              description="Lectura rápida de criticidad operativa por caso."
              emptyMessage="Sin prioridades para graficar."
              hasData={priorityReport.length > 0}
            >
              <ZoneReportBars items={priorityReport} />
            </ReportCard>
          </div>

          <section className="rounded-lg border border-border p-4">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold">Reportes asociados a la zona</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Últimos diagnósticos guardados para esta zona verde.
                </p>
              </div>
              <span className="rounded border border-border bg-muted/45 px-2 py-1 text-xs font-medium">
                {alerts.length} alertas en la muestra
              </span>
            </div>

            {cases.length > 0 ? (
              <div className="space-y-3">
                {cases.map((item) => (
                  <article key={item.id} className="zone-detail-case">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">Caso #{item.id}</span>
                        <span
                          className={`rounded border px-2 py-1 text-xs font-medium ${statusBadgeClass(
                            item.diagnosticState
                          )}`}
                        >
                          {diagnosticLabel(item.diagnosticState)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(item.createdAt)} · {item.location}
                      </p>
                      <p className="zone-detail-case__recommendation mt-2 text-sm text-muted-foreground">
                        {item.careRecommendation || item.irrigationRecommendation}
                      </p>
                    </div>
                    <div className="zone-detail-case__priority">
                      <span className={`h-2.5 w-2.5 rounded-full ${priorityDotClass(item.priority)}`} />
                      {priorityLabel(item.priority)}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title={loading ? 'Cargando reportes' : 'Sin reportes asociados'}
                description={
                  latestCase
                    ? 'Estamos preparando la información de esta zona.'
                    : 'Cuando se guarden análisis en esta zona aparecerán en este panel.'
                }
              />
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function DetailMetric({
  icon: Icon,
  label,
  value
}: {
  icon: typeof FileText;
  label: string;
  value: number | string;
}) {
  return (
    <div className="zone-detail-metric rounded-lg border border-border bg-muted/35 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="zone-detail-metric__label text-xs text-muted-foreground">{label}</p>
      <p className="zone-detail-metric__value text-lg font-semibold">{value}</p>
    </div>
  );
}

function ReportCard({
  title,
  description,
  emptyMessage,
  hasData,
  children
}: {
  title: string;
  description: string;
  emptyMessage: string;
  hasData: boolean;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border p-4">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">
        {hasData ? (
          children
        ) : (
          <div className="rounded-lg bg-muted/35 p-4 text-sm text-muted-foreground">{emptyMessage}</div>
        )}
      </div>
    </section>
  );
}

function ZoneReportBars({ items }: { items: Array<{ label: string; value: number; color: string }> }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="zone-report-bar">
          <div className="mb-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium">{item.label}</span>
            <span className="text-muted-foreground">{item.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(8, (item.value / max) * 100)}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function buildDiagnosticReport(cases: CaseItem[]) {
  const colors: Record<string, string> = {
    saludable: '#2d5a27',
    'atencion preventiva': '#d6ae37',
    'estres hidrico': '#c05621',
    'revision recomendada': '#2f6f9f'
  };
  const counts = new Map<string, number>();

  cases.forEach((item) => {
    counts.set(item.diagnosticState, (counts.get(item.diagnosticState) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([state, value]) => ({
    label: diagnosticLabel(state),
    value,
    color: colors[state] || '#66706a'
  }));
}

function buildPriorityReport(cases: CaseItem[]) {
  const colors: Record<string, string> = {
    alta: '#c05621',
    media: '#d6ae37',
    baja: '#2d5a27'
  };
  const counts = new Map<string, number>();

  cases.forEach((item) => {
    counts.set(item.priority, (counts.get(item.priority) || 0) + 1);
  });

  return Array.from(counts.entries()).map(([priority, value]) => ({
    label: priorityLabel(priority),
    value,
    color: colors[priority] || '#66706a'
  }));
}
