import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Droplets,
  Filter,
  ImageOff,
  Inbox,
  MapPin,
  Search,
  UserRound,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { api } from '../services/api';
import type { CaseItem, ZoneItem } from '../types';
import {
  diagnosticLabel,
  formatDate,
  formatDateTime,
  priorityDotClass,
  priorityLabel,
  riskLabel,
  statusBadgeClass
} from '../utils/format';

const diagnosticOptions = [
  { value: '', label: 'Todos los estados' },
  { value: 'saludable', label: 'Saludable' },
  { value: 'atencion preventiva', label: 'Atención preventiva' },
  { value: 'estres hidrico', label: 'Estrés hídrico' },
  { value: 'revision recomendada', label: 'Revisión recomendada' }
];

const priorityOptions = [
  { value: '', label: 'Todas las prioridades' },
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' }
];

export function HistoryView() {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [priority, setPriority] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [detailImageFailed, setDetailImageFailed] = useState(false);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (state) params.set('estado', state);
    if (priority) params.set('prioridad', priority);
    if (zoneId) params.set('zoneId', zoneId);
    if (from) params.set('desde', from);
    if (to) params.set('hasta', to);
    const value = params.toString();
    return value ? `?${value}` : '';
  }, [from, priority, state, to, zoneId]);

  useEffect(() => {
    api.zones().then((response) => setZones(response.zones)).catch(() => setZones([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .cases(query)
      .then((response) => setCases(response.cases))
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar el historial.')
      )
      .finally(() => setLoading(false));
  }, [query]);

  const visibleCases = cases.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return [item.id, item.zoneName, item.location, item.diagnosticState, item.irrigationRecommendation]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  function clearFilters() {
    setSearch('');
    setState('');
    setPriority('');
    setZoneId('');
    setFrom('');
    setTo('');
  }

  async function openCaseDetail(item: CaseItem) {
    setSelectedCase(item);
    setDetailImageFailed(false);
    setDetailError('');
    setDetailLoading(true);

    try {
      const response = await api.caseDetail(item.id);
      setSelectedCase(response.case);
    } catch (requestError) {
      setDetailError(
        requestError instanceof Error ? requestError.message : 'No fue posible cargar el detalle del caso.'
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function closeCaseDetail() {
    setSelectedCase(null);
    setDetailError('');
    setDetailImageFailed(false);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Historial de casos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Registro completo de diagnósticos guardados y recomendaciones emitidas.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-border bg-card">
        <div className="grid gap-3 border-b border-border p-4 xl:grid-cols-[1fr_0.7fr_0.7fr_0.7fr_0.55fr_0.55fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por zona, ubicación o ID..."
              className="w-full rounded-lg border border-border bg-input-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <SelectWithIcon value={state} onChange={setState} options={diagnosticOptions} />
          <SelectWithIcon value={priority} onChange={setPriority} options={priorityOptions} />
          <SelectWithIcon
            value={zoneId}
            onChange={setZoneId}
            options={[
              { value: '', label: 'Todas las zonas' },
              ...zones.map((zone) => ({ value: String(zone.id), label: zone.name }))
            ]}
          />

          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="rounded-lg border border-border bg-input-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-accent/20"
          >
            <Filter className="h-4 w-4" />
            Limpiar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-muted/50">
              <tr>
                {['ID', 'Fecha', 'Zona / ubicación', 'Resultado', 'Recomendación', 'Prioridad'].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {visibleCases.length > 0 ? (
                visibleCases.map((item) => (
                  <tr
                    key={item.id}
                    tabIndex={0}
                    onClick={() => openCaseDetail(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openCaseDetail(item);
                      }
                    }}
                    className={`cursor-pointer outline-none transition hover:bg-accent/10 focus:bg-accent/10 ${
                      selectedCase?.id === item.id ? 'bg-secondary/10' : ''
                    }`}
                  >
                    <td className="px-4 py-4 text-sm font-medium">#{item.id}</td>
                    <td className="px-4 py-4 text-sm text-muted-foreground">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium">{item.zoneName}</p>
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded border px-2 py-1 text-xs font-medium ${statusBadgeClass(
                          item.diagnosticState
                        )}`}
                      >
                        {diagnosticLabel(item.diagnosticState)}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-4 text-sm text-muted-foreground">
                      {item.irrigationRecommendation}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${priorityDotClass(item.priority)}`} />
                        <span className="text-sm">{priorityLabel(item.priority)}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6">
                    <EmptyState
                      icon={Inbox}
                      title="Sin casos para mostrar"
                      description="Ajusta los filtros o guarda un nuevo análisis para alimentar el historial."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border p-4 text-sm text-muted-foreground">
          <span>
            {loading ? 'Cargando historial...' : `Mostrando ${visibleCases.length} de ${cases.length} casos`}
          </span>
          <span>Fuente: base SQLite local</span>
        </div>
      </section>

      {selectedCase && (
        <CaseDetailPanel
          item={selectedCase}
          loading={detailLoading}
          error={detailError}
          imageFailed={detailImageFailed}
          onImageError={() => setDetailImageFailed(true)}
          onClose={closeCaseDetail}
        />
      )}
    </div>
  );
}

function SelectWithIcon({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full appearance-none rounded-lg border border-border bg-input-background px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((option) => (
          <option key={`${option.value}-${option.label}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function CaseDetailPanel({
  item,
  loading,
  error,
  imageFailed,
  onImageError,
  onClose
}: {
  item: CaseItem;
  loading: boolean;
  error: string;
  imageFailed: boolean;
  onImageError: () => void;
  onClose: () => void;
}) {
  const imageUrl = api.imageUrl(item.imageUrl || item.imagePath);

  return (
    <div className="no-print case-detail-overlay">
      <section className="case-detail-panel w-full max-w-3xl rounded-lg border border-border bg-card shadow-lg">
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Detalle del caso #{item.id}
            </p>
            <h3 className="mt-1 text-xl font-semibold">{diagnosticLabel(item.diagnosticState)}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{item.zoneName} · {item.location}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-border p-2 transition hover:bg-accent/20"
            title="Cerrar detalle"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-border">
              {imageUrl && !imageFailed ? (
                <img
                  src={imageUrl}
                  alt={`Imagen del caso ${item.id}`}
                  onError={onImageError}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 flex-col items-center justify-center bg-muted/35 p-6 text-center">
                  <ImageOff className="mb-3 h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">Imagen no disponible</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Este caso puede venir de datos sembrados o de una imagen no accesible.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-lg bg-muted/35 p-3">
              <p className="text-xs text-muted-foreground">Almacenamiento de imagen</p>
              <p className="mt-1 text-sm font-semibold">{imageStorageLabel(item)}</p>
            </div>

            {loading && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Cargando detalle completo...
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <DetailMetric label="Confianza" value={`${item.confidence.toFixed(1)}%`} />
              <DetailMetric label="Riesgo" value={riskLabel(item.riskLevel)} />
              <DetailMetric label="Prioridad" value={priorityLabel(item.priority)} />
              <DetailMetric label="Modo" value={item.analysisMode || 'demo'} />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <IconDetail icon={CalendarDays} label="Fecha" value={formatDateTime(item.createdAt)} />
              <IconDetail icon={UserRound} label="Registrado por" value={item.createdByName || 'Sin usuario'} />
              <IconDetail icon={MapPin} label="Zona" value={item.zoneName} />
              <IconDetail icon={AlertCircle} label="Estado" value={diagnosticLabel(item.diagnosticState)} />
            </div>

            <div className="rounded-lg bg-muted/55 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Droplets className="h-4 w-4 text-secondary" />
                <h4 className="text-sm font-semibold">Recomendación de riego</h4>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">{item.irrigationRecommendation}</p>
            </div>

            <div className="rounded-lg border border-border p-4">
              <h4 className="mb-2 text-sm font-semibold">Observaciones automáticas</h4>
              <p className="text-sm leading-6 text-muted-foreground">{item.observations}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function imageStorageLabel(item: CaseItem) {
  if (item.imageProvider === 'r2' || item.imagePath?.startsWith('r2://')) {
    return 'Cloudflare R2';
  }

  return item.imagePath ? 'Servidor local' : 'No disponible';
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/35 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function IconDetail({
  icon: Icon,
  label,
  value
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
