import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import { env } from '../config/env.js';
import { badRequest } from '../utils/httpError.js';

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
  'Se recomienda complementar con inspeccion presencial si hay sintomas localizados.'
];

const diagnosisSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'isPlant',
    'rejectionReason',
    'diagnosticState',
    'confidence',
    'riskLevel',
    'priority',
    'irrigationRecommendation',
    'observations',
    'visibleIndicators',
    'suggestedCommonName'
  ],
  properties: {
    isPlant: {
      type: 'boolean',
      description: 'True only when the image mainly contains a real plant, tree, shrub, leaf, flower, grass or campus vegetation.'
    },
    rejectionReason: {
      type: 'string',
      description: 'Spanish explanation when isPlant is false. Empty string when isPlant is true.'
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
      description: 'Concise irrigation recommendation in Spanish for campus maintenance staff.'
    },
    observations: {
      type: 'string',
      description: 'Automatic Spanish observations based only on visible image evidence.'
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
      irrigation_recommendation: 'Mantener riego programado y realizar seguimiento regular.',
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
  irrigationRecommendation,
  observations,
  color,
  isPlant = true,
  rejectionReason = '',
  visibleIndicators = [],
  suggestedCommonName = 'No determinado'
}) {
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
    irrigationRecommendation,
    recomendacionRiego: irrigationRecommendation,
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
    modelName: 'P.L.A.N.T.A. Vision Demo',
    modelVersion: '0.1.0-demo',
    diagnosticState,
    confidence: buildConfidence(hash, diagnosticState),
    riskLevel: recommendation.risk_level,
    priority: recommendation.priority,
    irrigationRecommendation: recommendation.irrigation_recommendation,
    observations,
    color: recommendation.color,
    visibleIndicators: ['Lectura visual simulada en modo demo'],
    suggestedCommonName: 'No determinado'
  });
}

function assertOpenAiConfiguration(file) {
  if (!env.openaiApiKey) {
    throw badRequest('Configura OPENAI_API_KEY en .env para usar ANALYSIS_MODE=openai.');
  }

  if (!openaiSupportedMimeTypes.has(file.mimetype)) {
    throw badRequest(
      'OpenAI Vision acepta JPG, PNG o WEBP en esta integracion. Convierte la imagen y vuelve a intentarlo.'
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
        `- ${item.diagnostic_state}: riesgo ${item.risk_level}, prioridad ${item.priority}, riego: ${item.irrigation_recommendation}`
    )
    .join('\n');

  return `
Eres un asistente de diagnostico visual para mantenimiento de zonas verdes universitarias.
Analiza la imagen de forma conservadora y responde SIEMPRE en espanol.

Primero determina si la imagen contiene principalmente una planta real, arbol, arbusto, hoja,
flor, cesped o vegetacion. Si no contiene una planta o la imagen no permite evaluar vegetacion,
marca isPlant=false y explica el motivo en rejectionReason. No inventes diagnosticos para objetos,
personas, mascotas, pantallas, documentos ni imagenes ambiguas sin vegetacion.

Si contiene vegetacion, clasifica el estado usando exactamente uno de estos estados:
saludable, atencion preventiva, estres hidrico, revision recomendada.

Catalogo institucional de recomendaciones:
${catalog}

La evaluacion es orientativa y debe basarse solo en evidencia visible: coloracion, turgencia,
marchitez, manchas, hojas secas, iluminacion, encuadre y signos compatibles con deficit hidrico.
`;
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
    throw new Error(refusal);
  }

  if (!rawText) {
    throw new Error('La respuesta de OpenAI no incluyo texto estructurado.');
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
      const message =
        payload?.error?.message || payload?.message || 'OpenAI no pudo procesar la imagen.';
      throw new Error(message);
    }

    return parseOpenAiPayload(payload);
  } finally {
    clearTimeout(timeout);
  }
}

async function analyzeImageOpenAi({ file, zoneId, recommendations }) {
  assertOpenAiConfiguration(file);

  const payload = await callOpenAiVision({ file, zoneId, recommendations });

  if (!payload.isPlant) {
    throw badRequest(
      payload.rejectionReason ||
        'La imagen no parece contener una planta evaluable. Sube una foto clara de vegetacion.'
    );
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
  const observations = [
    payload.observations || recommendation.automatic_observation,
    visibleIndicators.length ? `Indicadores visibles: ${visibleIndicators.join('; ')}.` : ''
  ]
    .filter(Boolean)
    .join(' ');

  return buildResult({
    mode: 'openai',
    modelName: 'OpenAI Vision',
    modelVersion: env.openaiModel,
    diagnosticState,
    confidence: payload.confidence,
    riskLevel,
    priority,
    irrigationRecommendation:
      payload.irrigationRecommendation || recommendation.irrigation_recommendation,
    observations,
    color: recommendation.color,
    isPlant: true,
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
      throw badRequest('ANALYSIS_MODE debe ser demo u openai.');
    }

    try {
      return await analyzeImageOpenAi({ file, zoneId, recommendations });
    } catch (error) {
      if (!env.openaiFallbackToDemo) {
        throw error;
      }

      const fallback = analyzeImageDemo({ file, zoneId, recommendations });
      return {
        ...fallback,
        mode: 'demo-fallback',
        model: {
          ...fallback.model,
          name: 'P.L.A.N.T.A. Vision Demo (fallback)'
        },
        observations: `${fallback.observations} Nota: se uso fallback demo porque OpenAI no respondio: ${error.message}`,
        observaciones: `${fallback.observations} Nota: se uso fallback demo porque OpenAI no respondio: ${error.message}`
      };
    }
  }
};
