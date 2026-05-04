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
