export type Role = 'operador' | 'supervisor' | 'administrador';

export interface DemoUser {
  id: number;
  name: string;
  nombre?: string;
  username: string;
  usuario?: string;
  role: Role;
  rol?: Role;
  active?: boolean;
}

export interface Session {
  token: string;
  type: string;
  expiresIn: string;
}

export interface LoginResponse {
  message: string;
  user: DemoUser;
  session: Session;
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
  diagnosticState: string;
  resultado?: string;
  confidence: number;
  riskLevel: string;
  irrigationRecommendation: string;
  observations: string;
  priority: string;
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
    url: string;
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
