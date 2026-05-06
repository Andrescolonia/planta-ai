export type Role = 'invitado' | 'usuario' | 'supervisor' | 'administrador';

export interface AppUser {
  id: number;
  name: string;
  nombre?: string;
  username: string;
  usuario?: string;
  email?: string | null;
  correo?: string | null;
  role: Role;
  rol?: Role;
  active?: boolean;
  isGuest?: boolean;
  invitado?: boolean;
  casesCount?: number;
  casos?: number;
  lastLogin?: string | null;
}

export type DemoUser = AppUser;

export interface Session {
  token: string;
  type: string;
  expiresIn: string;
}

export interface LoginResponse {
  message: string;
  user: AppUser;
  session: Session;
}

export interface EventAccessStatus {
  required: boolean;
  verified: boolean;
  token?: string | null;
  expiresIn?: string;
}

export interface CaseItem {
  id: number;
  createdAt: string;
  fecha?: string;
  zoneId: number;
  zoneName: string;
  zona?: string;
  campusArea?: string;
  location: string;
  ubicacion?: string;
  imagePath?: string | null;
  imageUrl?: string | null;
  imageProvider?: string | null;
  diagnosticState: string;
  resultado?: string;
  confidence: number;
  riskLevel: string;
  irrigationRecommendation: string;
  observations: string;
  priority: string;
  analysisMode?: string;
  createdByName?: string | null;
}

export interface DashboardData {
  kpis: {
    diagnostics: number;
    healthyPlants: number;
    preventiveCases: number;
    irrigationAlerts: number;
  };
  recentActivity: CaseItem[];
  charts: {
    diagnosticsByState: Array<{ state: string; estado?: string; total: number; color: string }>;
    weeklyTrend: Array<{ date: string; diagnostics: number; alerts: number }>;
  };
}

export interface ZoneItem {
  id: number;
  name: string;
  campusArea: string;
  description: string;
  generalStatus: string;
  casesCount: number;
  recentAlerts: number;
  lastCaseAt?: string | null;
}

export interface AnalysisStage {
  key: string;
  label: string;
  status: string;
}

export interface AnalysisResult {
  mode: string;
  isPlant?: boolean;
  rejectionReason?: string;
  visibleIndicators?: string[];
  suggestedCommonName?: string;
  diagnosticState: string;
  confidence: number;
  riskLevel: string;
  priority: string;
  irrigationRecommendation: string;
  observations: string;
  color: string;
  stages: AnalysisStage[];
  model: {
    name: string;
    version: string;
    replaceable: boolean;
  };
}

export interface AnalyzeResponse {
  message: string;
  uploadedImage: {
    path: string;
    url?: string | null;
    provider?: string;
    key?: string | null;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
  result: AnalysisResult;
  suggestedCase: Record<string, unknown>;
}

export interface ReportData {
  generatedAt: string;
  summary: {
    totalCases: number;
    healthy: number;
    preventive: number;
    alerts: number;
  };
  diagnosticsByState: Array<{
    state: string;
    riskLevel: string;
    priority: string;
    total: number;
    color: string;
  }>;
  alertsByZone: Array<{
    zoneId: number;
    zoneName: string;
    totalAlerts: number;
  }>;
  weeklyTrend: Array<{
    date: string;
    diagnostics: number;
    highRisk: number;
  }>;
}

export interface Recommendation {
  id: number;
  diagnosticState: string;
  riskLevel: string;
  priority: string;
  irrigationRecommendation: string;
  automaticObservation: string;
  color: string;
}

export interface ModelInfo {
  mode: string;
  model: {
    name: string;
    version: string;
    type: string;
    description: string;
    futureReplacement: string;
  };
}

export interface SystemStatus {
  checkedAt: string;
  backend: {
    status: string;
    database: string;
    startedAt: string;
    uptimeSeconds: number;
  };
  analysis: {
    mode: string;
    model: string;
    openaiConfigured: boolean;
    fallbackToDemo: boolean;
  };
  storage: {
    driver: string;
    r2Configured: boolean;
    fallbackToLocal: boolean;
  };
  exposure: {
    publicUrl: string;
    clientOrigin: string;
    eventAccessRequired: boolean;
    trustProxy: boolean | number;
  };
  metrics: {
    casesToday: number;
    totalCases: number;
    analysesThisHour: number;
    analysesToday: number;
    maxAnalysesPerHour: number;
    maxAnalysesPerDay: number;
  };
  limits: {
    maxUploadMb: number;
    globalRequests: number;
    authRequests: number;
    analysisRequests: number;
  };
  lastError: {
    message: string;
    statusCode: number;
    occurredAt: string;
  } | null;
}
