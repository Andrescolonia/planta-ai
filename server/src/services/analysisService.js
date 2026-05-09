import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { env } from '../config/env.js';
import { badRequest } from '../utils/httpError.js';
import { publicAiIdentity, publicAnalysisMode } from '../utils/publicAiLabels.js';

const diagnosticOrder = [
  'saludable',
  'atencion preventiva',
  'estres hidrico',
  'revision recomendada'
];

const validRiskLevels = new Set(['bajo', 'medio', 'alto']);
const validPriorities = new Set(['baja', 'media', 'alta']);
const openaiSupportedMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const captureQualityNotes = [
  'Encuadre suficiente para lectura de follaje y coloracion.',
  'Iluminacion aceptable con sombras moderadas.',
  'La imagen permite una lectura general del estado vegetativo.',
  'La imagen permite orientar acciones de cuidado vegetal desde la evidencia visible.'
];

const diagnosisSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isPlant',
    'rejectionReason',
    'isRealPlant',
    'authenticityAssessment',
    'artificialIndicators',
    'visualQuality',
    'diagnosticSummary',
    'diagnosticState',
    'confidence',
    'riskLevel',
    'priority',
    'careRecommendation',
    'irrigationRecommendation',
    'observations',
    'visibleIndicators',
    'suggestedCommonName'
  ],
  properties: {
    isPlant: {
      type: 'boolean',
      description:
        'True only when the image mainly contains a living or organic plant, tree, shrub, leaf, flower, grass or campus vegetation.'
    },
    rejectionReason: {
      type: 'string',
      description:
        'Spanish explanation when isPlant or isRealPlant is false. Empty string only when the image is an evaluable real plant.'
    },
    isRealPlant: {
      type: 'boolean',
      description:
        'True only when the subject appears organic/living. False for plastic, silk, fabric, paper, artificial grass, ornaments, drawings, screens or printed plant images.'
    },
    authenticityAssessment: {
      type: 'string',
      description:
        'Spanish assessment of why the subject appears to be a real plant or why it appears artificial/non-evaluable.'
    },
    artificialIndicators: {
      type: 'array',
      maxItems: 5,
      items: { type: 'string' },
      description:
        'Visible clues of artificial, decorative or non-organic material. Use an empty array when no such clues are visible.'
    },
    visualQuality: {
      type: 'string',
      enum: ['alta', 'media', 'baja'],
      description: 'Image quality for visual diagnosis.'
    },
    diagnosticSummary: {
      type: 'string',
      description: 'Short Spanish executive summary of the diagnosis for the operator.'
    },
    diagnosticState: {
      type: 'string',
      enum: diagnosticOrder,
      description: 'One of the platform diagnostic states.'
    },
    confidence: {
      type: 'number',
      minimum: 0,
      maximum: 100,
      description: 'Confidence percentage for the visual assessment.'
    },
    riskLevel: {
      type: 'string',
      enum: ['bajo', 'medio', 'alto']
    },
    priority: {
      type: 'string',
      enum: ['baja', 'media', 'alta']
    },
    irrigationRecommendation: {
      type: 'string',
      description:
        'Legacy field. Repeat the same integral plant-care recommendation used in careRecommendation.'
    },
    careRecommendation: {
      type: 'string',
      description:
        'Integral plant-care recommendation in Spanish. Include sanitation, pruning/removal of damaged tissue, pest or disease management, ventilation/light, substrate/drainage and watering only when relevant.'
    },
    observations: {
      type: 'string',
      description:
        'Automatic Spanish observations based only on visible image evidence. Include probable cause, severity and affected structures when visible.'
    },
    visibleIndicators: {
      type: 'array',
      minItems: 1,
      maxItems: 5,
      items: { type: 'string' }
    },
    suggestedCommonName: {
      type: 'string',
      description: 'Common plant name if visible. Use "No determinado" when uncertain.'
    }
  }
};

function hashInput(file, zoneId) {
  const source = [
    file?.originalname || 'sin-nombre',
    file?.size || 0,
    file?.mimetype || 'sin-mime',
    zoneId || 'sin-zona'
  ].join(':');

  return crypto.createHash('sha256').update(source).digest('hex');
}

function toNumberFromHash(hash, start, length) {
  return Number.parseInt(hash.slice(start, start + length), 16);
}

function chooseDiagnostic(hash) {
  const score = toNumberFromHash(hash, 0, 8) % 100;

  if (score < 42) {
    return 'saludable';
  }

  if (score < 68) {
    return 'atencion preventiva';
  }

  if (score < 86) {
    return 'estres hidrico';
  }

  return 'revision recomendada';
}

function buildConfidence(hash, diagnosticState) {
  const baseByState = {
    saludable: 86,
    'atencion preventiva': 78,
    'estres hidrico': 82,
    'revision recomendada': 72
  };
  const variation = (toNumberFromHash(hash, 8, 6) % 1200) / 100;

  return Number(Math.min(baseByState[diagnosticState] + variation, 96.8).toFixed(1));
}

function buildObservations(hash, recommendation) {
  const qualityNote = captureQualityNotes[toNumberFromHash(hash, 16, 4) % captureQualityNotes.length];

  return `${recommendation.automatic_observation} ${qualityNote}`;
}

function normalizePercent(value, fallback = 80) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Number(Math.max(0, Math.min(100, number)).toFixed(1));
}

function findRecommendation(recommendations, diagnosticState) {
  return (
    recommendations.find((item) => item.diagnostic_state === diagnosticState) ||
    recommendations.find((item) => item.diagnostic_state === diagnosticOrder[0]) || {
      risk_level: 'bajo',
      priority: 'baja',
      irrigation_recommendation:
        'Mantener cuidado regular: riego programado, limpieza de hojas secas y seguimiento visual semanal.',
      automatic_observation: 'No se encontraron recomendaciones configuradas para el estado detectado.',
      color: '#237a57'
    }
  );
}

function buildResult({
  mode,
  modelName,
  modelVersion,
  diagnosticState,
  confidence,
  riskLevel,
  priority,
  careRecommendation,
  irrigationRecommendation,
  observations,
  color,
  isPlant = true,
  rejectionReason = '',
  isRealPlant = true,
  authenticityAssessment = 'La imagen presenta rasgos compatibles con vegetacion real evaluable.',
  artificialIndicators = [],
  visualQuality = 'media',
  diagnosticSummary = '',
  visibleIndicators = [],
  suggestedCommonName = 'No determinado'
}) {
  const summary =
    diagnosticSummary ||
    `Diagnostico ${diagnosticState} con prioridad ${priority} y riesgo ${riskLevel}.`;
  const operationalRecommendation = careRecommendation || irrigationRecommendation;

  return {
    mode,
    model: {
      name: modelName,
      version: modelVersion,
      replaceable: true
    },
    isPlant,
    esPlanta: isPlant,
    rejectionReason,
    motivoRechazo: rejectionReason,
    isRealPlant,
    esPlantaReal: isRealPlant,
    authenticityAssessment,
    evaluacionAutenticidad: authenticityAssessment,
    artificialIndicators,
    indicadoresArtificiales: artificialIndicators,
    visualQuality,
    calidadVisual: visualQuality,
    diagnosticSummary: summary,
    resumenDiagnostico: summary,
    visibleIndicators,
    indicadoresVisibles: visibleIndicators,
    suggestedCommonName,
    nombreComunSugerido: suggestedCommonName,
    diagnosticState,
    estado: diagnosticState,
    confidence: normalizePercent(confidence),
    riskLevel,
    nivelRiesgo: riskLevel,
    priority,
    prioridad: priority,
    careRecommendation: operationalRecommendation,
    recomendacionCuidado: operationalRecommendation,
    irrigationRecommendation: operationalRecommendation,
    recomendacionRiego: operationalRecommendation,
    observations,
    observaciones: observations,
    color,
    stages: [
      { key: 'captura', label: 'Captura', status: 'completado' },
      { key: 'preproceso', label: 'Preproceso', status: 'completado' },
      { key: 'clasificacion', label: 'Clasificacion', status: 'completado' },
      { key: 'resultado', label: 'Resultado', status: 'completado' }
    ]
  };
}

export function analyzeImageDemo({ file, zoneId, recommendations }) {
  const hash = hashInput(file, zoneId);
  const diagnosticState = chooseDiagnostic(hash);
  const recommendation = findRecommendation(recommendations, diagnosticState);
  const observations = buildObservations(hash, recommendation);

  return buildResult({
    mode: env.analysisMode,
    modelName: 'P.L.A.N.T.A. FitoVision Demo',
    modelVersion: '0.1.0-demo',
    diagnosticState,
    confidence: buildConfidence(hash, diagnosticState),
    riskLevel: recommendation.risk_level,
    priority: recommendation.priority,
    irrigationRecommendation: recommendation.irrigation_recommendation,
    observations,
    color: recommendation.color,
    authenticityAssessment:
      'Validacion visual simulada: el modo demo asume vegetacion real para mantener estable el flujo de exposicion.',
    artificialIndicators: [],
    visualQuality: 'media',
    diagnosticSummary: `Lectura demo: ${diagnosticState} con prioridad ${recommendation.priority}.`,
    visibleIndicators: ['Lectura visual simulada en modo demo'],
    suggestedCommonName: 'No determinado'
  });
}

function assertOpenAiConfiguration(file) {
  if (!env.openaiApiKey) {
    throw badRequest('Configura la tecnologia FitoVision antes de iniciar el analisis.');
  }

  if (!openaiSupportedMimeTypes.has(file.mimetype)) {
    throw badRequest(
      'FitoVision acepta JPG, PNG o WEBP. Convierte la imagen y vuelve a intentarlo.'
    );
  }
}

async function imageToDataUrl(file) {
  const imageBuffer = await fs.readFile(file.path);
  return `data:${file.mimetype};base64,${imageBuffer.toString('base64')}`;
}

function buildOpenAiPrompt(recommendations) {
  const catalog = recommendations
    .map(
      (item) =>
        `- ${item.diagnostic_state}: riesgo ${item.risk_level}, prioridad ${item.priority}, cuidado recomendado: ${item.irrigation_recommendation}`
    )
    .join('\n');

  return `
Eres P.L.A.N.T.A. FitoVision, una tecnologia propia de diagnostico visual para mantenimiento de zonas verdes universitarias.
Analiza la imagen de forma estricta, conservadora y responde SIEMPRE en espanol.

REGLA CRITICA: antes de diagnosticar salud vegetal debes validar que la imagen muestre una PLANTA REAL
u organismo vegetal evaluable. No basta con que el objeto sea verde o tenga forma de planta.

Paso 1 - Compuerta de autenticidad vegetal:
- isPlant=true e isRealPlant=true solo si el sujeto principal parece vegetacion organica/living/evaluable:
  hojas con venacion natural, tallos organicos, textura irregular, variacion de color natural, sustrato,
  suelo, maceta real o contexto de zona verde.
- Marca isPlant=false e isRealPlant=false si el sujeto parece planta artificial, plastica, de seda,
  tela, papel, porcelana, decoracion, juguete, cesped sintetico, estampado, dibujo, imagen en pantalla,
  folleto, render, icono, poster, objeto con forma vegetal o si no hay evidencia suficiente de tejido vegetal real.
- Senales fuertes de planta artificial: brillo plastico uniforme, bordes repetidos o demasiado perfectos,
  nervaduras impresas, patrones identicos, uniones/molde, alambres, tela, base decorativa, colores
  artificialmente saturados, hojas con grosor uniforme, ausencia de imperfecciones naturales o textura sintetica.
- Si hay duda razonable entre planta real y artificial, rechaza la imagen: isPlant=false, isRealPlant=false.
- Para imagenes rechazadas, rejectionReason debe explicar de forma clara el motivo y diagnosticState debe ser
  "revision recomendada" con confidence baja o media.

Paso 2 - Diagnostico solo si la compuerta paso:
Clasifica el estado usando exactamente uno de estos estados:
saludable, atencion preventiva, estres hidrico, revision recomendada.

No uses "revision recomendada" como forma de evadir el diagnostico cuando la imagen tiene sintomas visibles.
Si hay perforaciones, manchas, necrosis, bordes secos, polvo/blanqueamiento, mordeduras, tejido colapsado,
presencia probable de plaga, hongo o dano foliar, debes diagnosticar el patron visible y proponer manejo
operativo. "revision recomendada" significa "requiere accion fitosanitaria o de cuidado especifica", no
"que otra persona mire la planta". Solo rechaza o pide nueva imagen si no hay planta real evaluable.

Catalogo institucional de recomendaciones:
${catalog}

La evaluacion debe basarse solo en evidencia visible: coloracion, turgencia, marchitez, manchas,
perforaciones, galerias, necrosis, polvo o micelio, bordes secos, mordeduras, hojas deformadas,
presencia probable de plagas, hongos, dano mecanico, compactacion visible, sustrato, iluminacion,
encuadre y signos compatibles con deficit o exceso hidrico.

La recomendacion NO debe limitarse al riego. Debe ser una accion integral de cuidado vegetal:
- retiro de hojas o tejido severamente afectado cuando aplique;
- limpieza de residuos vegetales y superficie del sustrato;
- revision dirigida del enves de hojas, brotes y tallos para plagas;
- manejo fitosanitario institucional autorizado si hay plaga/hongo probable;
- mejora de ventilacion, luz, drenaje o ubicacion cuando sea visible/relevante;
- ajuste de riego solo cuando la evidencia lo justifique;
- seguimiento de evolucion en 48 a 72 horas con registro fotografico.

Evita frases genericas como "realizar inspeccion visual presencial antes de actuar",
"validar con personal especializado", "no se puede determinar" o "revisar presencialmente" cuando
la imagen muestra sintomas claros. Da un diagnostico visual probable y una recomendacion concreta,
conservadora y accionable para mantenimiento universitario.

Ejemplo de criterio: si ves hojas verdes con perforaciones, manchas grises/marrones, tejido seco o necrotico
y brotes aun presentes, el resumen debe indicar dano foliar compatible con plaga/enfermedad foliar o dano
mecanico; los indicadores deben mencionar perforaciones, necrosis/manchas y extension del dano; la
recomendacion debe proponer poda sanitaria parcial, retiro de hojas muy afectadas, limpieza, revision del
enves, manejo fitosanitario autorizado, ventilacion y seguimiento fotografico. No lo reduzcas a riego.

Completa visibleIndicators con evidencia botanica concreta observada.
Completa artificialIndicators con senales sinteticas si existen; usa [] si no observas senales artificiales.
Completa authenticityAssessment con una frase que justifique la validacion de planta real.
Completa visualQuality como alta, media o baja segun enfoque, iluminacion, distancia y oclusion.
Completa diagnosticSummary como una conclusion breve, clara y operativa para personal de mantenimiento.
Completa careRecommendation con el plan integral de cuidado vegetal.
Completa irrigationRecommendation con el mismo texto de careRecommendation para compatibilidad del sistema.
`;
}

function buildNonEvaluableImageError(payload) {
  return badRequest(
    payload.rejectionReason ||
      payload.authenticityAssessment ||
      'La imagen no parece contener una planta real evaluable. Sube una fotografia clara de vegetacion natural.',
    { code: 'IMAGE_NOT_EVALUABLE' }
  );
}

function isNonEvaluableImageError(error) {
  return error?.details?.code === 'IMAGE_NOT_EVALUABLE';
}

function looksLikeDeferredRecommendation(value = '') {
  const normalized = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  return [
    'inspeccion visual presencial',
    'revisar presencialmente',
    'validacion humana',
    'validar con personal',
    'antes de modificar el esquema de riego',
    'no se puede determinar'
  ].some((phrase) => normalized.includes(phrase));
}

function fallbackCareRecommendation(diagnosticState, recommendation) {
  if (diagnosticState === 'revision recomendada') {
    return [
      'Ejecutar manejo fitosanitario inicial: retirar hojas muy afectadas, limpiar restos vegetales,',
      'revisar enves de hojas y brotes por plagas, mejorar ventilacion y aplicar el tratamiento',
      'institucional autorizado segun el patron visible. Registrar nueva foto de seguimiento en 48 a 72 horas.'
    ].join(' ');
  }

  return recommendation.irrigation_recommendation;
}

function normalizeCareRecommendation(value, diagnosticState, recommendation) {
  const text = String(value || '').trim();

  if (!text || looksLikeDeferredRecommendation(text)) {
    return fallbackCareRecommendation(diagnosticState, recommendation);
  }

  return text;
}

function normalizeObservations(value, diagnosticState, visibleIndicators) {
  const text = String(value || '').trim();

  if (!looksLikeDeferredRecommendation(text)) {
    return text;
  }

  const evidence = visibleIndicators.length
    ? ` Indicadores visibles: ${visibleIndicators.join('; ')}.`
    : '';

  if (diagnosticState === 'revision recomendada') {
    return `Se observan signos de deterioro foliar que requieren manejo fitosanitario y cuidado correctivo desde la evidencia visible.${evidence}`;
  }

  return `Se identifican senales compatibles con el estado ${diagnosticState} y se recomienda aplicar el manejo operativo indicado.${evidence}`;
}

function parseOpenAiPayload(responsePayload) {
  if (responsePayload.output_parsed) {
    return responsePayload.output_parsed;
  }

  const rawText =
    responsePayload.output_text ||
    responsePayload.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === 'output_text')?.text;

  const refusal = responsePayload.output
    ?.flatMap((item) => item.content || [])
    .find((content) => content.type === 'refusal')?.refusal;

  if (refusal) {
    throw new Error('FitoVision rechazo la solicitud de analisis.');
  }

  if (!rawText) {
    throw new Error('FitoVision no incluyo una respuesta estructurada.');
  }

  return JSON.parse(rawText);
}

async function callOpenAiVision({ file, recommendations }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.openaiTimeoutMs);
  const imageUrl = await imageToDataUrl(file);

  try {
    const response = await fetch(`${env.openaiBaseUrl.replace(/\/$/, '')}/responses`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: env.openaiModel,
        input: [
          {
            role: 'user',
            content: [
              { type: 'input_text', text: buildOpenAiPrompt(recommendations) },
              { type: 'input_image', image_url: imageUrl }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'planta_visual_diagnosis',
            strict: true,
            schema: diagnosisSchema
          }
        }
      })
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error('FitoVision no pudo completar el analisis.');
    }

    return parseOpenAiPayload(payload);
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeImageOpenAi({ file, zoneId, recommendations }) {
  assertOpenAiConfiguration(file);

  const payload = await callOpenAiVision({ file, zoneId, recommendations });

  if (!payload.isPlant || !payload.isRealPlant) {
    throw buildNonEvaluableImageError(payload);
  }

  const diagnosticState = diagnosticOrder.includes(payload.diagnosticState)
    ? payload.diagnosticState
    : 'revision recomendada';
  const recommendation = findRecommendation(recommendations, diagnosticState);
  const riskLevel = validRiskLevels.has(payload.riskLevel) ? payload.riskLevel : recommendation.risk_level;
  const priority = validPriorities.has(payload.priority) ? payload.priority : recommendation.priority;
  const visibleIndicators = Array.isArray(payload.visibleIndicators)
    ? payload.visibleIndicators.slice(0, 5).map((item) => String(item))
    : [];
  const artificialIndicators = Array.isArray(payload.artificialIndicators)
    ? payload.artificialIndicators.slice(0, 5).map((item) => String(item))
    : [];
  const careRecommendation = normalizeCareRecommendation(
    payload.careRecommendation || payload.irrigationRecommendation,
    diagnosticState,
    recommendation
  );
  const baseObservation = normalizeObservations(
    payload.observations || recommendation.automatic_observation,
    diagnosticState,
    visibleIndicators
  );
  const observations = [
    baseObservation,
    visibleIndicators.length && !baseObservation.includes('Indicadores visibles:')
      ? `Indicadores visibles: ${visibleIndicators.join('; ')}.`
      : ''
  ]
    .filter(Boolean)
    .join(' ');

  return buildResult({
    mode: publicAiIdentity.mode,
    modelName: publicAiIdentity.modelName,
    modelVersion: publicAiIdentity.modelVersion,
    diagnosticState,
    confidence: payload.confidence,
    riskLevel,
    priority,
    careRecommendation,
    irrigationRecommendation: careRecommendation,
    observations,
    color: recommendation.color,
    isPlant: true,
    isRealPlant: true,
    authenticityAssessment:
      payload.authenticityAssessment ||
      'La imagen presenta rasgos compatibles con vegetacion real evaluable.',
    artificialIndicators,
    visualQuality: ['alta', 'media', 'baja'].includes(payload.visualQuality)
      ? payload.visualQuality
      : 'media',
    diagnosticSummary: payload.diagnosticSummary,
    visibleIndicators,
    suggestedCommonName: payload.suggestedCommonName || 'No determinado'
  });
}

export const analysisService = {
  async analyze({ file, zoneId, recommendations }) {
    if (env.analysisMode === 'demo') {
      return analyzeImageDemo({ file, zoneId, recommendations });
    }

    if (env.analysisMode !== 'openai') {
      throw badRequest('El modo de analisis configurado no es valido.');
    }

    try {
      return await analyzeImageOpenAi({ file, zoneId, recommendations });
    } catch (error) {
      if (isNonEvaluableImageError(error)) {
        throw error;
      }

      if (!env.openaiFallbackToDemo) {
        throw error;
      }

      const fallback = analyzeImageDemo({ file, zoneId, recommendations });
      return {
        ...fallback,
        mode: publicAnalysisMode('demo-fallback'),
        model: {
          ...fallback.model,
          name: 'P.L.A.N.T.A. FitoVision Respaldo',
          version: publicAiIdentity.modelVersion
        },
        observations: `${fallback.observations} Nota: se activo el respaldo FitoVision para mantener la continuidad del analisis.`,
        observaciones: `${fallback.observations} Nota: se activo el respaldo FitoVision para mantener la continuidad del analisis.`
      };
    }
  }
};
