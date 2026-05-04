import {
  Camera,
  CheckCircle2,
  FileText,
  History,
  Loader2,
  RotateCcw,
  Save,
  Upload
} from 'lucide-react';
import { DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ViewKey } from '../layouts/AppShell';
import { api } from '../services/api';
import type { AnalyzeResponse, DemoUser, ZoneItem } from '../types';
import { diagnosticLabel, priorityLabel, riskLabel } from '../utils/format';

interface AnalysisViewProps {
  user: DemoUser;
  onNavigate: (view: ViewKey) => void;
}

const defaultStages = [
  { key: 'captura', label: 'Captura' },
  { key: 'preproceso', label: 'Preproceso' },
  { key: 'clasificacion', label: 'Clasificación' },
  { key: 'resultado', label: 'Resultado' }
];

export function AnalysisView({ user, onNavigate }: AnalysisViewProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState('');
  const [location, setLocation] = useState('');
  const [activeStage, setActiveStage] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [savedCaseId, setSavedCaseId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .zones()
      .then((response) => {
        setZones(response.zones);
        if (response.zones[0]) {
          setZoneId(String(response.zones[0].id));
        }
      })
      .catch(() => setZones([]));
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const nextPreview = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreview);

    return () => URL.revokeObjectURL(nextPreview);
  }, [selectedFile]);

  useEffect(() => {
    if (!analyzing) {
      return;
    }

    setActiveStage(0);
    const timers = defaultStages.map((_, index) =>
      window.setTimeout(() => setActiveStage(index), index * 520)
    );

    return () => timers.forEach(window.clearTimeout);
  }, [analyzing]);

  const selectedZone = useMemo(
    () => zones.find((zone) => String(zone.id) === zoneId),
    [zoneId, zones]
  );

  function setFile(file: File) {
    setSelectedFile(file);
    setAnalysis(null);
    setSavedCaseId(null);
    setError('');
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];

    if (file) {
      setFile(file);
    }
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setError('Selecciona una imagen antes de analizar.');
      return;
    }

    if (!zoneId) {
      setError('Selecciona una zona verde para asociar el análisis.');
      return;
    }

    setAnalyzing(true);
    setError('');
    setAnalysis(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('zoneId', zoneId);
    formData.append('location', location || selectedZone?.name || 'Ubicación sin especificar');

    try {
      const response = await api.analyze(formData);
      setAnalysis(response);
      setActiveStage(defaultStages.length - 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible analizar la imagen.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveCase() {
    if (!analysis) {
      return;
    }

    setError('');

    try {
      const response = await api.saveCase({
        ...analysis.suggestedCase,
        zoneId: Number(zoneId),
        location: location || selectedZone?.name || 'Ubicación sin especificar',
        uploadedImage: analysis.uploadedImage,
        createdBy: user.id
      });
      setSavedCaseId(response.case.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar el caso.');
    }
  }

  function reset() {
    setSelectedFile(null);
    setAnalysis(null);
    setSavedCaseId(null);
    setError('');
    setLocation('');
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Nuevo análisis de imagen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Carga una fotografía tomada en campo para obtener un diagnóstico demo estable.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.7fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border bg-card">
            {!previewUrl ? (
              <label
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                className="flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-10 text-center transition hover:border-secondary hover:bg-secondary/5"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setFile(file);
                    }
                  }}
                />
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                  <Upload className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold">Arrastra una imagen aquí</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  También puedes hacer clic para seleccionar una foto desde el equipo o un celular
                  conectado.
                </p>
                <span className="mt-5 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
                  Seleccionar archivo
                </span>
              </label>
            ) : (
              <div className="overflow-hidden rounded-lg">
                <img src={previewUrl} alt="Planta seleccionada" className="h-[420px] w-full object-cover" />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
                  <div>
                    <p className="font-medium">{selectedFile?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={reset}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-accent/20"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Cambiar imagen
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/90 disabled:opacity-60"
                    >
                      {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      {analyzing ? 'Analizando...' : 'Analizar imagen'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {(analyzing || analysis) && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h3 className="mb-4 font-semibold">Flujo de procesamiento</h3>
              <div className="grid gap-3 md:grid-cols-4">
                {defaultStages.map((stage, index) => {
                  const completed = analysis || index < activeStage;
                  const active = !analysis && index === activeStage;
                  return (
                    <div key={stage.key} className="rounded-lg border border-border p-4">
                      <div
                        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-full ${
                          completed ? 'bg-green-600 text-white' : active ? 'bg-accent text-accent-foreground' : 'bg-muted'
                        }`}
                      >
                        {active && analyzing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : completed ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{stage.label}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {analysis && (
            <section className="rounded-lg border border-border bg-card p-5">
              <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
                <div>
                  <h3 className="text-lg font-semibold">Resultado del diagnóstico</h3>
                  <p className="text-sm text-muted-foreground">
                    Motor: {analysis.result.model.name} ({analysis.result.mode})
                  </p>
                </div>
                {savedCaseId && (
                  <span className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                    Caso #{savedCaseId} guardado
                  </span>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <ResultMetric label="Estado" value={diagnosticLabel(analysis.result.diagnosticState)} tone="green" />
                <ResultMetric label="Confianza" value={`${analysis.result.confidence.toFixed(1)}%`} tone="blue" />
                <ResultMetric label="Riesgo" value={riskLabel(analysis.result.riskLevel)} tone="yellow" />
                <ResultMetric label="Prioridad" value={priorityLabel(analysis.result.priority)} tone="orange" />
              </div>

              <div className="mt-5 rounded-lg bg-muted/55 p-4">
                <h4 className="mb-2 text-sm font-semibold">Recomendación de riego</h4>
                <p className="text-sm leading-6 text-muted-foreground">
                  {analysis.result.irrigationRecommendation}
                </p>
              </div>

              <div className="mt-4 rounded-lg border border-border p-4">
                <h4 className="mb-2 text-sm font-semibold">Observaciones automáticas</h4>
                <p className="text-sm leading-6 text-muted-foreground">{analysis.result.observations}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleSaveCase}
                  disabled={Boolean(savedCaseId)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {savedCaseId ? 'Caso guardado' : 'Guardar caso'}
                </button>
                <button
                  onClick={() => onNavigate('historial')}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-accent/20"
                >
                  <History className="h-4 w-4" />
                  Ver historial
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-accent/20"
                >
                  <FileText className="h-4 w-4" />
                  Generar reporte simple
                </button>
              </div>

              {savedCaseId && (
                <div className="mt-4 grid gap-3 rounded-lg border border-green-200 bg-green-50 p-4 md:grid-cols-3">
                  <button
                    onClick={() => onNavigate('historial')}
                    className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-800 transition hover:bg-green-100"
                  >
                    Consultar en historial
                  </button>
                  <button
                    onClick={() => onNavigate('zonas')}
                    className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-800 transition hover:bg-green-100"
                  >
                    Revisar zona asociada
                  </button>
                  <button
                    onClick={() => onNavigate('reportes')}
                    className="rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-medium text-green-800 transition hover:bg-green-100"
                  >
                    Ver reportes actualizados
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-4 font-semibold">Datos del caso</h3>
            <label className="mb-2 block text-sm font-medium">Zona verde</label>
            <select
              value={zoneId}
              onChange={(event) => setZoneId(event.target.value)}
              className="mb-4 w-full rounded-lg border border-border bg-input-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            >
              {zones.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.name}
                </option>
              ))}
            </select>

            <label className="mb-2 block text-sm font-medium">Ubicación específica</label>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Ej. Jardinera costado norte"
              className="w-full rounded-lg border border-border bg-input-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-4 font-semibold">Requisitos de imagen</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                'Imagen clara y enfocada de la planta.',
                'Buena iluminación natural o artificial.',
                'Distancia aproximada de 30 a 100 cm.',
                'Formatos JPG, PNG, WEBP, HEIC o HEIF.',
                'Tamaño máximo configurado: 8 MB.'
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function ResultMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  const toneClasses: Record<string, string> = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700'
  };

  return (
    <div className={`rounded-lg border p-4 ${toneClasses[tone]}`}>
      <p className="mb-1 text-xs font-medium opacity-75">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
