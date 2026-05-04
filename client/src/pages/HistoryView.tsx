import { ChevronDown, Filter, Inbox, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { api } from '../services/api';
import type { CaseItem, ZoneItem } from '../types';
import {
  diagnosticLabel,
  formatDate,
  priorityDotClass,
  priorityLabel,
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
  const [error, setError] = useState('');

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
                  <tr key={item.id} className="transition hover:bg-accent/10">
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
