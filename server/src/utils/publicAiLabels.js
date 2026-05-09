export const publicAiIdentity = {
  mode: 'fitovision',
  label: 'Tecnologia FitoVision',
  modelName: 'P.L.A.N.T.A. FitoVision',
  modelVersion: '2.1.0',
  modelType: 'Nucleo fitovisual P.L.A.N.T.A.',
  description:
    'Tecnologia propia de analisis fitovisual para diagnostico asistido de vegetacion universitaria.',
  futureReplacement:
    'Arquitectura preparada para evolucionar FitoVision sin cambiar el flujo operativo.'
};

export function publicAnalysisMode(mode) {
  if (mode === 'openai') {
    return publicAiIdentity.mode;
  }

  if (mode === 'demo-fallback') {
    return 'respaldo fitovisual';
  }

  if (mode === 'demo') {
    return 'demo';
  }

  return mode || publicAiIdentity.mode;
}

export function publicModelName(mode) {
  return mode === 'demo' ? 'P.L.A.N.T.A. FitoVision Demo' : publicAiIdentity.modelName;
}

export function publicModelVersion(mode) {
  return mode === 'demo' ? '0.1.0-demo' : publicAiIdentity.modelVersion;
}
