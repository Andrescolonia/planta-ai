export const demoUsers = [
  {
    name: 'Laura Mendez',
    username: 'operador',
    password: 'planta2026',
    role: 'operador'
  },
  {
    name: 'Carlos Rivas',
    username: 'supervisor',
    password: 'planta2026',
    role: 'supervisor'
  },
  {
    name: 'Andrea Salazar',
    username: 'admin',
    password: 'planta2026',
    role: 'administrador'
  }
];

export const demoZones = [
  {
    name: 'Bloque A',
    campus_area: 'Zona academica norte',
    description: 'Jardineras laterales y senderos peatonales del Bloque A.',
    general_status: 'estable'
  },
  {
    name: 'Jardin central',
    campus_area: 'Corazon del campus',
    description: 'Zona ornamental de alta visibilidad entre edificios principales.',
    general_status: 'seguimiento preventivo'
  },
  {
    name: 'Entrada principal',
    campus_area: 'Acceso institucional',
    description: 'Vegetacion de bienvenida, materas exteriores y borde vial.',
    general_status: 'estable'
  },
  {
    name: 'Zona administrativa',
    campus_area: 'Edificio administrativo',
    description: 'Areas verdes cercanas a oficinas y zonas de atencion.',
    general_status: 'atencion prioritaria'
  },
  {
    name: 'Biblioteca',
    campus_area: 'Zona de estudio',
    description: 'Jardines de sombra, macizos bajos y puntos de descanso.',
    general_status: 'estable'
  }
];

export const demoRecommendations = [
  {
    diagnostic_state: 'saludable',
    risk_level: 'bajo',
    priority: 'baja',
    irrigation_recommendation:
      'Mantener riego programado y verificar humedad del suelo durante la ronda regular.',
    automatic_observation:
      'La planta presenta coloracion uniforme, follaje estable y ausencia de signos visibles de deterioro.',
    color: '#237a57',
    sort_order: 1
  },
  {
    diagnostic_state: 'atencion preventiva',
    risk_level: 'medio',
    priority: 'media',
    irrigation_recommendation:
      'Ajustar riego de forma moderada y programar una nueva revision en 48 horas.',
    automatic_observation:
      'Se observan variaciones leves en tono o densidad foliar que conviene monitorear.',
    color: '#b9975b',
    sort_order: 2
  },
  {
    diagnostic_state: 'estres hidrico',
    risk_level: 'alto',
    priority: 'alta',
    irrigation_recommendation:
      'Aplicar riego correctivo controlado y revisar drenaje, compactacion y exposicion solar.',
    automatic_observation:
      'El follaje sugiere perdida de turgencia, resequedad o senales compatibles con deficit hidrico.',
    color: '#c05621',
    sort_order: 3
  },
  {
    diagnostic_state: 'revision recomendada',
    risk_level: 'medio',
    priority: 'media',
    irrigation_recommendation:
      'Realizar inspeccion visual presencial antes de modificar el esquema de riego.',
    automatic_observation:
      'La imagen presenta indicadores ambiguos o condiciones de captura que requieren validacion humana.',
    color: '#2f6690',
    sort_order: 4
  }
];

export const demoCases = [
  {
    daysAgo: 0,
    zone: 'Zona administrativa',
    user: 'supervisor',
    location: 'Materas externas frente a recepcion',
    diagnostic_state: 'estres hidrico',
    confidence: 91.4
  },
  {
    daysAgo: 1,
    zone: 'Jardin central',
    user: 'operador',
    location: 'Macizo ornamental costado occidental',
    diagnostic_state: 'atencion preventiva',
    confidence: 84.7
  },
  {
    daysAgo: 2,
    zone: 'Bloque A',
    user: 'operador',
    location: 'Sendero peatonal norte',
    diagnostic_state: 'saludable',
    confidence: 93.2
  },
  {
    daysAgo: 3,
    zone: 'Entrada principal',
    user: 'supervisor',
    location: 'Franja verde junto a porteria',
    diagnostic_state: 'revision recomendada',
    confidence: 78.9
  },
  {
    daysAgo: 4,
    zone: 'Biblioteca',
    user: 'operador',
    location: 'Jardin de sombra lateral',
    diagnostic_state: 'saludable',
    confidence: 88.5
  },
  {
    daysAgo: 5,
    zone: 'Zona administrativa',
    user: 'operador',
    location: 'Jardinera de acceso a oficinas',
    diagnostic_state: 'atencion preventiva',
    confidence: 82.1
  },
  {
    daysAgo: 6,
    zone: 'Jardin central',
    user: 'supervisor',
    location: 'Palmas ornamentales centrales',
    diagnostic_state: 'estres hidrico',
    confidence: 89.6
  },
  {
    daysAgo: 8,
    zone: 'Bloque A',
    user: 'operador',
    location: 'Jardinera de aula 104',
    diagnostic_state: 'saludable',
    confidence: 94.8
  },
  {
    daysAgo: 9,
    zone: 'Entrada principal',
    user: 'operador',
    location: 'Matera institucional lado sur',
    diagnostic_state: 'atencion preventiva',
    confidence: 81.3
  },
  {
    daysAgo: 11,
    zone: 'Biblioteca',
    user: 'supervisor',
    location: 'Zona verde junto a rampa',
    diagnostic_state: 'revision recomendada',
    confidence: 76.8
  },
  {
    daysAgo: 13,
    zone: 'Zona administrativa',
    user: 'operador',
    location: 'Arbustos perimetrales',
    diagnostic_state: 'saludable',
    confidence: 90.9
  },
  {
    daysAgo: 14,
    zone: 'Jardin central',
    user: 'operador',
    location: 'Cama baja oriental',
    diagnostic_state: 'saludable',
    confidence: 92.6
  }
];
