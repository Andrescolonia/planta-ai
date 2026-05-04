import crypto from 'node:crypto';
import { env } from '../config/env.js';

const diagnosticOrder = [
  'saludable',
  'atencion preventiva',
  'estres hidrico',
  'revision recomendada'
];

const captureQualityNotes = [
  'Encuadre suficiente para lectura de follaje y coloracion.',
  'Iluminacion aceptable con sombras moderadas.',
  'La imagen permite una lectura general del estado vegetativo.',
  'Se recomienda complementar con inspeccion presencial si hay sintomas localizados.'
];

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

export function analyzeImageDemo({ file, zoneId, recommendations }) {
  const hash = hashInput(file, zoneId);
  const diagnosticState = chooseDiagnostic(hash);
  const recommendation =
    recommendations.find((item) => item.diagnostic_state === diagnosticState) ||
    recommendations.find((item) => item.diagnostic_state === diagnosticOrder[0]) || {
      risk_level: 'bajo',
      priority: 'baja',
      irrigation_recommendation: 'Mantener riego programado y realizar seguimiento regular.',
      automatic_observation: 'No se encontraron recomendaciones configuradas para el estado detectado.',
      color: '#237a57'
    };
  const observations = buildObservations(hash, recommendation);

  return {
    mode: env.analysisMode,
    model: {
      name: 'P.L.A.N.T.A. Vision Demo',
      version: '0.1.0-demo',
      replaceable: true
    },
    diagnosticState,
    estado: diagnosticState,
    confidence: buildConfidence(hash, diagnosticState),
    riskLevel: recommendation.risk_level,
    nivelRiesgo: recommendation.risk_level,
    priority: recommendation.priority,
    prioridad: recommendation.priority,
    irrigationRecommendation: recommendation.irrigation_recommendation,
    recomendacionRiego: recommendation.irrigation_recommendation,
    observations,
    observaciones: observations,
    color: recommendation.color,
    stages: [
      { key: 'captura', label: 'Captura', status: 'completado' },
      { key: 'preproceso', label: 'Preproceso', status: 'completado' },
      { key: 'clasificacion', label: 'Clasificacion', status: 'completado' },
      { key: 'resultado', label: 'Resultado', status: 'completado' }
    ]
  };
}

export const analysisService = {
  async analyze({ file, zoneId, recommendations }) {
    if (env.analysisMode !== 'demo') {
      throw new Error('El motor de IA real aun no esta configurado. Usa ANALYSIS_MODE=demo.');
    }

    return analyzeImageDemo({ file, zoneId, recommendations });
  }
};
