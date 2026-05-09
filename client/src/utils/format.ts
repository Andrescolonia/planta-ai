export function titleCase(value: string) {
  return value
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function diagnosticLabel(value?: string | null) {
  const map: Record<string, string> = {
    saludable: 'Saludable',
    'atencion preventiva': 'Atención preventiva',
    'estres hidrico': 'Estrés hídrico',
    'revision recomendada': 'Revisión recomendada'
  };

  return value ? map[value] || titleCase(value) : 'Sin diagnóstico';
}

export function riskLabel(value?: string | null) {
  const map: Record<string, string> = {
    bajo: 'Bajo',
    medio: 'Medio',
    alto: 'Alto'
  };

  return value ? map[value] || titleCase(value) : 'Sin riesgo';
}

export function priorityLabel(value?: string | null) {
  const map: Record<string, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta'
  };

  return value ? map[value] || titleCase(value) : 'Sin prioridad';
}

export function analysisModeLabel(value?: string | null) {
  const normalized = String(value || '').toLowerCase();
  const legacyAutonomousMode = ['open', 'ai'].join('');
  const map: Record<string, string> = {
    [legacyAutonomousMode]: 'FitoVision',
    autonomo: 'FitoVision',
    fitovision: 'FitoVision',
    demo: 'MVP funcional',
    'demo-fallback': 'Respaldo FitoVision',
    'respaldo inteligente': 'Respaldo FitoVision',
    'respaldo fitovisual': 'Respaldo FitoVision'
  };

  return map[normalized] || titleCase(normalized || 'fitovision');
}

export function analysisEngineLabel(value?: string | null) {
  const rawValue = String(value || '').trim();
  const normalized = rawValue.toLowerCase();
  const legacyProvider = ['open', 'ai'].join('');

  if (normalized.includes('demo')) {
    return 'P.L.A.N.T.A. FitoVision Demo';
  }

  if (
    !normalized ||
    normalized.includes(legacyProvider) ||
    normalized.includes('vision autonoma') ||
    normalized.includes('vision respaldo') ||
    normalized.includes('fitovision')
  ) {
    return 'P.L.A.N.T.A. FitoVision';
  }

  return rawValue;
}

export function analysisVersionLabel(value?: string | null) {
  const rawValue = String(value || '').trim();
  const normalized = rawValue.toLowerCase();
  const legacyModelPrefix = ['g', 'p', 't'].join('');
  const compactModelSuffix = ['m', 'i', 'n', 'i'].join('');

  if (
    !normalized ||
    normalized.includes(legacyModelPrefix) ||
    normalized.includes(compactModelSuffix) ||
    normalized.includes('preview') ||
    normalized.includes('demo')
  ) {
    return '2.1.0';
  }

  return rawValue;
}

export function formatDate(value?: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  }).format(new Date(value));
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

export function statusBadgeClass(state?: string | null) {
  const map: Record<string, string> = {
    saludable: 'bg-green-100 text-green-700 border-green-200',
    'atencion preventiva': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'estres hidrico': 'bg-orange-100 text-orange-700 border-orange-200',
    'revision recomendada': 'bg-blue-100 text-blue-700 border-blue-200'
  };

  return map[state || ''] || 'bg-muted text-foreground border-border';
}

export function priorityDotClass(priority?: string | null) {
  const map: Record<string, string> = {
    baja: 'bg-green-500',
    media: 'bg-yellow-500',
    alta: 'bg-orange-600'
  };

  return map[priority || ''] || 'bg-muted-foreground';
}
