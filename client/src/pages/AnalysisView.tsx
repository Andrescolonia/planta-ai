import {
  Camera,
  CheckCircle2,
  FileText,
  History,
  ImageOff,
  Loader2,
  MapPin,
  RotateCcw,
  Save,
  Upload,
  UserRound
} from 'lucide-react';
import { DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { ViewKey } from '../layouts/AppShell';
import { api } from '../services/api';
import type { AnalyzeResponse, DemoUser, ZoneItem } from '../types';
import { diagnosticLabel, priorityLabel, riskLabel } from '../utils/format';

interface AnalysisViewProps {
  user: DemoUser;
  onNavigate: (view: ViewKey) => void;
  onUserUpdate?: (user: DemoUser) => void;
}

const maxImageSizeMb = 8;
const demoAcceptedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
const openAiAcceptedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const demoAcceptedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);
const openAiAcceptedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const defaultStages = [
  { key: 'captura', label: 'Captura' },
  { key: 'preproceso', label: 'Preproceso' },
  { key: 'clasificacion', label: 'Clasificación' },
  { key: 'resultado', label: 'Resultado' }
];

const locationOptionsByZone: Record<string, string[]> = {
  'Bloque A': [
    'Jardineras laterales del Bloque A',
    'Sendero peatonal norte',
    'Jardinera de aula 104',
    'Acceso principal del Bloque A'
  ],
  'Jardin central': [
    'Macizo ornamental costado occidental',
    'Palmas ornamentales centrales',
    'Cama baja oriental',
    'Sendero central'
  ],
  'Entrada principal': [
    'Franja verde junto a porteria',
    'Materas institucionales lado sur',
    'Borde vial de acceso',
    'Jardines de bienvenida'
  ],
  'Zona administrativa': [
    'Materas externas frente a recepcion',
    'Jardinera de acceso a oficinas',
    'Arbustos perimetrales',
    'Patio administrativo'
  ],
  Biblioteca: [
    'Jardin de sombra lateral',
    'Zona verde junto a rampa',
    'Macizos bajos de biblioteca',
    'Punto de descanso exterior'
  ]
};

function getLocationOptions(zone?: ZoneItem) {
  if (!zone) {
    return ['Punto de observacion general'];
  }

  return (
    locationOptionsByZone[zone.name] || [
      `Jardineras de ${zone.name}`,
      `Sendero principal de ${zone.name}`,
      `Punto de observacion en ${zone.name}`
    ]
  );
}

function normalizePersonName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

function validateRequiredPersonName(value: string) {
  const name = normalizePersonName(value);

  if (!name) {
    return 'Ingresa tu nombre para asociar el análisis.';
  }

  if (name.length < 2 || name.length > 50) {
    return 'El nombre debe tener entre 2 y 50 caracteres.';
  }

  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(name)) {
    return 'El nombre solo puede contener letras y espacios.';
  }

  return '';
}

function guestNeedsName(user: DemoUser) {
  return Boolean(user.isGuest && /^Invitado \d{4}$/.test(user.name));
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function fileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

function validateImageFile(file: File, openAiMode: boolean) {
  const acceptedExtensions = openAiMode ? openAiAcceptedExtensions : demoAcceptedExtensions;
  const acceptedMimeTypes = openAiMode ? openAiAcceptedMimeTypes : demoAcceptedMimeTypes;
  const extension = fileExtension(file.name);
  const hasAcceptedType = acceptedMimeTypes.has(file.type);
  const hasGenericType = !file.type || file.type === 'application/octet-stream';
  const hasAcceptedExtension = acceptedExtensions.includes(extension);
  const sizeMb = file.size / 1024 / 1024;

  if (!hasAcceptedType && !(hasGenericType && hasAcceptedExtension)) {
    return openAiMode
      ? 'Formato no soportado para OpenAI. Usa JPG, PNG o WEBP.'
      : 'Formato no soportado. Usa JPG, PNG, WEBP, HEIC o HEIF.';
  }

  if (sizeMb > maxImageSizeMb) {
    return `La imagen supera el límite de ${maxImageSizeMb} MB.`;
  }

  return '';
}

export function AnalysisView({ user, onNavigate, onUserUpdate }: AnalysisViewProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [zones, setZones] = useState<ZoneItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisMode, setAnalysisMode] = useState('demo');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [resultImageFailed, setResultImageFailed] = useState(false);
  const [zoneId, setZoneId] = useState('');
  const [location, setLocation] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [activeStage, setActiveStage] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [savedCaseId, setSavedCaseId] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.zones(), api.health()])
      .then(([zonesResponse, healthResponse]) => {
        setZones(zonesResponse.zones);
        setAnalysisMode(healthResponse.mode || 'demo');
        if (zonesResponse.zones[0]) {
          setZoneId(String(zonesResponse.zones[0].id));
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
      window.setTimeout(() => setActiveStage(index), index * 650)
    );

    return () => timers.forEach(window.clearTimeout);
  }, [analyzing]);

  const selectedZone = useMemo(
    () => zones.find((zone) => String(zone.id) === zoneId),
    [zoneId, zones]
  );
  const locationOptions = useMemo(() => getLocationOptions(selectedZone), [selectedZone]);
  const shouldAskVisitorName = guestNeedsName(user);
  const openAiMode = analysisMode === 'openai';
  const acceptedInput = openAiMode
    ? '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp'
    : '.jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif';
  const analyzedImageUrl = useMemo(
    () => api.imageUrl(analysis?.uploadedImage.url || analysis?.uploadedImage.path),
    [analysis]
  );

  useEffect(() => {
    if (locationOptions.length > 0 && !locationOptions.includes(location)) {
      setLocation(locationOptions[0]);
    }
  }, [location, locationOptions]);

  function setFile(file: File) {
    const validationError = validateImageFile(file, openAiMode);

    if (validationError) {
      setSelectedFile(null);
      setAnalysis(null);
      setSavedCaseId(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    setPreviewFailed(false);
    setResultImageFailed(false);
    setAnalysis(null);
    setSavedCaseId(null);
    setError('');
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];

    if (file) {
      setFile(file);
    }
  }

  function clearResultState() {
    setAnalysis(null);
    setSavedCaseId(null);
    setError('');
  }

  function handleZoneSelect(nextZoneId: string) {
    if (analyzing || saving) {
      return;
    }

    setZoneId(nextZoneId);
    clearResultState();
  }

  function handleLocationSelect(nextLocation: string) {
    if (analyzing || saving) {
      return;
    }

    setLocation(nextLocation);
    clearResultState();
  }

  async function handleAnalyze() {
    if (!selectedFile) {
      setError('Selecciona una imagen antes de analizar.');
      return;
    }

    const validationError = validateImageFile(selectedFile, openAiMode);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!zoneId) {
      setError('Selecciona una zona verde para asociar el análisis.');
      return;
    }

    if (shouldAskVisitorName) {
      const nameError = validateRequiredPersonName(visitorName);
      if (nameError) {
        setError(nameError);
        return;
      }
    }

    setAnalyzing(true);
    setError('');
    setAnalysis(null);
    setSavedCaseId(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('zoneId', zoneId);
    formData.append('location', location || selectedZone?.name || 'Ubicación sin especificar');

    try {
      const [response] = await Promise.all([api.analyze(formData), wait(2300)]);
      setAnalysis(response);
      setActiveStage(defaultStages.length - 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible analizar la imagen.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveCase() {
    if (!analysis || saving || savedCaseId) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await api.saveCase({
        ...analysis.suggestedCase,
        zoneId: Number(zoneId),
        location: location || selectedZone?.name || 'Ubicación sin especificar',
        uploadedImage: analysis.uploadedImage,
        createdBy: user.id,
        visitorName: shouldAskVisitorName ? normalizePersonName(visitorName) : undefined
      });
      setSavedCaseId(response.case.id);

      if (shouldAskVisitorName && response.case.createdByName) {
        onUserUpdate?.({ ...user, name: response.case.createdByName });
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar el caso.');
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setSelectedFile(null);
    setPreviewFailed(false);
    setResultImageFailed(false);
    setAnalysis(null);
    setSavedCaseId(null);
    setError('');
    setActiveStage(0);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-foreground">Nuevo análisis de imagen</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sube una fotografía real de una planta y obtén un diagnóstico visual en modo local.
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
                onDragEnter={() => setDragging(true)}
                onDragLeave={() => setDragging(false)}
                onDragOver={(event) => event.preventDefault()}
                className={`flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition ${
                  dragging ? 'border-secondary bg-secondary/5' : 'border-border hover:border-secondary hover:bg-secondary/5'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={acceptedInput}
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
                  conectado a la red local.
                </p>
                <span className="mt-5 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
                  Seleccionar archivo
                </span>
              </label>
            ) : (
              <div className="overflow-hidden rounded-lg">
                {previewFailed ? (
                  <div className="flex h-[420px] flex-col items-center justify-center bg-muted/35 p-8 text-center">
                    <ImageOff className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Vista previa no disponible</h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Algunos formatos de celular pueden no mostrarse en el navegador, pero el archivo
                      se puede enviar al motor demo para diagnóstico.
                    </p>
                  </div>
                ) : (
                  <img
                    src={previewUrl}
                    alt="Planta seleccionada"
                    onError={() => setPreviewFailed(true)}
                    className="h-[420px] w-full object-cover"
                  />
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4">
                  <div>
                    <p className="font-medium">{selectedFile?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={reset}
                      disabled={analyzing || saving}
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm transition hover:bg-accent/20 disabled:opacity-60"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Cambiar imagen
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing || saving}
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
                          completed
                            ? 'bg-green-600 text-white'
                            : active
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted'
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

              <div className="mb-5 grid gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-lg border border-border">
                  {analyzedImageUrl && !resultImageFailed ? (
                    <img
                      src={analyzedImageUrl}
                      alt="Imagen analizada"
                      onError={() => setResultImageFailed(true)}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 flex-col items-center justify-center bg-muted/35 p-4 text-center">
                      <ImageOff className="mb-3 h-10 w-10 text-muted-foreground" />
                      <p className="text-sm font-medium">Imagen subida correctamente</p>
                      <p className="mt-1 text-xs text-muted-foreground">{analysis.uploadedImage.originalName}</p>
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Archivo analizado
                  </p>
                  <p className="mt-2 text-sm font-medium">{analysis.uploadedImage.originalName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {(analysis.uploadedImage.size / 1024 / 1024).toFixed(2)} MB · {analysis.uploadedImage.mimeType}
                  </p>
                  <div className="mt-4 rounded-lg bg-muted/35 p-3">
                    <p className="text-xs text-muted-foreground">Zona asociada</p>
                    <p className="mt-1 text-sm font-semibold">{selectedZone?.name || 'Sin zona'}</p>
                  </div>
                  <div className="mt-3 rounded-lg bg-muted/35 p-3">
                    <p className="text-xs text-muted-foreground">Punto de revisión</p>
                    <p className="mt-1 text-sm font-semibold">{location}</p>
                  </div>
                  {analysis.result.suggestedCommonName && (
                    <div className="mt-3 rounded-lg bg-muted/35 p-3">
                      <p className="text-xs text-muted-foreground">Nombre común sugerido</p>
                      <p className="mt-1 text-sm font-semibold">{analysis.result.suggestedCommonName}</p>
                    </div>
                  )}
                </div>
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

              {analysis.result.visibleIndicators && analysis.result.visibleIndicators.length > 0 && (
                <div className="mt-4 rounded-lg border border-border p-4">
                  <h4 className="mb-3 text-sm font-semibold">Indicadores visibles</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.result.visibleIndicators.map((indicator) => (
                      <span key={indicator} className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleSaveCase}
                  disabled={Boolean(savedCaseId) || saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {savedCaseId ? 'Caso guardado' : saving ? 'Guardando...' : 'Guardar caso'}
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

            {shouldAskVisitorName && (
              <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Nombre del visitante
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={visitorName}
                    onChange={(event) => setVisitorName(event.target.value)}
                    disabled={analyzing || saving}
                    maxLength={50}
                    placeholder="Ej. Carlos Rivas"
                    className="w-full rounded-lg border border-blue-200 bg-white py-3 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                  />
                </div>
                <p className="mt-2 text-xs text-blue-700">Solo letras y espacios, máximo 50 caracteres.</p>
              </div>
            )}

            <div className="mb-5">
              <p className="mb-2 text-sm font-medium">Zona verde</p>
              <div className="space-y-2">
                {zones.map((zone) => {
                  const selected = String(zone.id) === zoneId;

                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => handleZoneSelect(String(zone.id))}
                      disabled={analyzing || saving}
                      className={`w-full rounded-lg border p-3 text-left transition disabled:opacity-60 ${
                        selected
                          ? 'border-secondary bg-secondary/10'
                          : 'border-border bg-card hover:bg-accent/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-secondary" />
                        <span className="text-sm font-semibold text-foreground">{zone.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{zone.campusArea}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Punto de revisión</p>
              <div className="space-y-2">
                {locationOptions.map((option) => {
                  const selected = option === location;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleLocationSelect(option)}
                      disabled={analyzing || saving}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition disabled:opacity-60 ${
                        selected
                          ? 'border-secondary bg-secondary/10 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:bg-accent/10'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-4 font-semibold">Requisitos de imagen</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                'Imagen clara y enfocada de la planta.',
                'Buena iluminación natural o artificial.',
                'Distancia aproximada de 30 a 100 cm.',
                openAiMode
                  ? 'Formatos compatibles con OpenAI: JPG, PNG o WEBP.'
                  : 'Formatos JPG, PNG, WEBP, HEIC o HEIF.',
                `Tamaño máximo configurado: ${maxImageSizeMb} MB.`
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
