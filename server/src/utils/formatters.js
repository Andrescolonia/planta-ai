export function formatCase(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    createdAt: row.created_at,
    fecha: row.created_at,
    zoneId: row.zone_id,
    zonaId: row.zone_id,
    zoneName: row.zone_name,
    zona: row.zone_name,
    campusArea: row.campus_area,
    location: row.location,
    ubicacion: row.location,
    imagePath: row.image_path,
    imageUrl: row.image_url || null,
    imageProvider: row.image_provider || null,
    imageFilename: row.image_filename,
    diagnosticState: row.diagnostic_state,
    resultado: row.diagnostic_state,
    confidence: row.confidence,
    confianza: row.confidence,
    riskLevel: row.risk_level,
    nivelRiesgo: row.risk_level,
    careRecommendation: row.irrigation_recommendation,
    recomendacionCuidado: row.irrigation_recommendation,
    irrigationRecommendation: row.irrigation_recommendation,
    recomendacion: row.irrigation_recommendation,
    observations: row.observations,
    observaciones: row.observations,
    priority: row.priority,
    prioridad: row.priority,
    analysisMode: row.analysis_mode,
    createdBy: row.created_by,
    createdByName: row.created_by_name
  };
}

export function formatUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    nombre: row.name,
    username: row.username,
    usuario: row.username,
    email: row.email,
    correo: row.email,
    role: row.role,
    rol: row.role,
    active: Boolean(row.active),
    activo: Boolean(row.active),
    isGuest: Boolean(row.is_guest),
    invitado: Boolean(row.is_guest),
    casesCount: row.cases_count ?? row.casesCount ?? 0,
    casos: row.cases_count ?? row.casesCount ?? 0,
    createdAt: row.created_at,
    lastLogin: row.last_login
  };
}

export function formatRecommendation(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    diagnosticState: row.diagnostic_state,
    estado: row.diagnostic_state,
    riskLevel: row.risk_level,
    nivelRiesgo: row.risk_level,
    priority: row.priority,
    prioridad: row.priority,
    careRecommendation: row.irrigation_recommendation,
    recomendacionCuidado: row.irrigation_recommendation,
    irrigationRecommendation: row.irrigation_recommendation,
    recomendacionRiego: row.irrigation_recommendation,
    automaticObservation: row.automatic_observation,
    observacionAutomatica: row.automatic_observation,
    color: row.color,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at
  };
}
