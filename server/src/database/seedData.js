export const initialUsers = [
  {
    name: 'Laura Mendez',
    username: 'operador',
    email: 'operador@planta.edu.co',
    password: 'planta2026',
    role: 'usuario'
  },
  {
    name: 'Carlos Rivas',
    username: 'supervisor',
    email: 'supervisor@planta.edu.co',
    password: 'planta2026',
    role: 'supervisor'
  },
  {
    name: 'Andrea Salazar',
    username: 'admin',
    email: 'admin@planta.edu.co',
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
      'Mantener el plan de cuidado actual: riego programado, limpieza ligera de hojas secas, control visual semanal y verificacion de sustrato sin aplicar tratamientos correctivos.',
    automatic_observation:
      'La planta presenta coloracion uniforme, follaje estable y ausencia de signos visibles de deterioro relevante.',
    color: '#237a57',
    sort_order: 1
  },
  {
    diagnostic_state: 'atencion preventiva',
    risk_level: 'medio',
    priority: 'media',
    irrigation_recommendation:
      'Aplicar mantenimiento preventivo: retirar hojas con dano leve, limpiar residuos del sustrato, revisar envés de hojas y tallos, mejorar ventilacion y ajustar riego solo si el sustrato esta seco.',
    automatic_observation:
      'Se observan variaciones leves en tono, densidad foliar o textura que requieren manejo preventivo antes de que el dano avance.',
    color: '#b9975b',
    sort_order: 2
  },
  {
    diagnostic_state: 'estres hidrico',
    risk_level: 'alto',
    priority: 'alta',
    irrigation_recommendation:
      'Corregir manejo hidrico y de sitio: hidratar de forma gradual, revisar drenaje y compactacion, proteger de sol fuerte temporalmente, retirar tejido seco y confirmar que el agua no quede empozada.',
    automatic_observation:
      'El follaje sugiere perdida de turgencia, resequedad, amarillamiento o senales compatibles con deficit o manejo irregular de agua.',
    color: '#c05621',
    sort_order: 3
  },
  {
    diagnostic_state: 'revision recomendada',
    risk_level: 'medio',
    priority: 'media',
    irrigation_recommendation:
      'Ejecutar manejo fitosanitario inicial: retirar hojas muy afectadas, limpiar restos vegetales, aislar la planta si esta en matera, revisar envés por plagas y aplicar el tratamiento institucional autorizado segun hallazgos visibles.',
    automatic_observation:
      'La imagen presenta dano foliar, manchas, necrosis, perforaciones o deterioro visible que requiere accion de cuidado vegetal mas alla del riego.',
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
