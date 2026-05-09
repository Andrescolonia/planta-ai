import type {
  AnalyzeResponse,
  CaseItem,
  DashboardData,
  DemoUser,
  EventAccessStatus,
  LoginResponse,
  ModelInfo,
  Recommendation,
  ReportData,
  SystemStatus,
  ZoneItem
} from '../types';

function getDefaultApiUrl() {
  const protocol = window.location.protocol || 'http:';
  const hostname = window.location.hostname || 'localhost';
  const port = window.location.port;
  const frontendOnlyPorts = new Set(['5173', '5174', '4173']);

  if (frontendOnlyPorts.has(port)) {
    return `${protocol}//${hostname}:4000/api`;
  }

  return `${window.location.origin}/api`;
}

function normalizeApiUrl(value: string) {
  return value.replace(/\/$/, '');
}

function resolveApiUrl() {
  const configuredUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const defaultUrl = getDefaultApiUrl();
  const openedFromLan =
    window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  if (!configuredUrl || configuredUrl === 'auto') {
    return normalizeApiUrl(defaultUrl);
  }

  if (openedFromLan && configuredUrl.includes('localhost')) {
    return normalizeApiUrl(defaultUrl);
  }

  return normalizeApiUrl(configuredUrl);
}

const API_URL = resolveApiUrl();
const API_ROOT = API_URL.replace(/\/api\/?$/, '');
const EVENT_ACCESS_TOKEN_KEY = 'planta-event-access-token';

function getEventAccessToken() {
  return localStorage.getItem(EVENT_ACCESS_TOKEN_KEY);
}

function setEventAccessToken(token?: string | null) {
  if (token) {
    localStorage.setItem(EVENT_ACCESS_TOKEN_KEY, token);
    return;
  }

  localStorage.removeItem(EVENT_ACCESS_TOKEN_KEY);
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const eventAccessToken = getEventAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(eventAccessToken ? { 'X-Event-Access-Token': eventAccessToken } : {}),
      ...init?.headers
    }
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : 'No fue posible completar la solicitud.';
    if (response.status === 403) {
      setEventAccessToken(null);
    }
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  apiUrl: API_URL,
  getEventAccessToken,
  setEventAccessToken,

  imageUrl(path?: string | null) {
    if (!path) {
      return null;
    }

    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }

    if (path.startsWith('r2://')) {
      return null;
    }

    return `${API_ROOT}${path}`;
  },

  health() {
    return request<{ status: string; service: string; mode: string; eventAccessRequired?: boolean }>('/health');
  },

  accessStatus() {
    return request<EventAccessStatus>('/access/status');
  },

  async verifyEventAccess(code: string) {
    const response = await request<EventAccessStatus>('/access/verify', {
      method: 'POST',
      body: JSON.stringify({ code })
    });

    setEventAccessToken(response.token);
    return response;
  },

  login(identifier: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
  },

  register(payload: { name: string; username: string; email?: string; password: string }) {
    return request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  guestLogin(name?: string) {
    return request<LoginResponse>('/auth/guest', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  },

  me(token: string) {
    return request<LoginResponse>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  dashboard() {
    return request<DashboardData>('/dashboard');
  },

  zones() {
    return request<{ zones: ZoneItem[] }>('/zones');
  },

  zoneDetail(id: number) {
    return request<{ zone: ZoneItem; cases: CaseItem[] }>(`/zones/${id}`);
  },

  cases(query = '') {
    return request<{ cases: CaseItem[] }>(`/cases${query}`);
  },

  caseDetail(id: number) {
    return request<{ case: CaseItem }>(`/cases/${id}`);
  },

  analyze(formData: FormData) {
    return request<AnalyzeResponse>('/analysis/analyze', {
      method: 'POST',
      body: formData
    });
  },

  saveCase(payload: Record<string, unknown>) {
    return request<{ message: string; case: CaseItem }>('/cases', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  reports() {
    return request<ReportData>('/reports');
  },

  adminUsers() {
    return request<{ users: DemoUser[] }>('/admin/users');
  },

  adminStatus() {
    return request<SystemStatus>('/admin/status');
  },

  createUser(payload: {
    name: string;
    username: string;
    email?: string;
    role: string;
    password: string;
  }) {
    return request<{ user: DemoUser }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  recommendations() {
    return request<{ recommendations: Recommendation[] }>('/admin/recommendations');
  },

  modelInfo() {
    return request<ModelInfo>('/admin/model');
  }
};
