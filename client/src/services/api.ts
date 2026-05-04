import type {
  AnalyzeResponse,
  CaseItem,
  DashboardData,
  DemoUser,
  LoginResponse,
  ModelInfo,
  Recommendation,
  ReportData,
  ZoneItem
} from '../types';

function getDefaultApiUrl() {
  const protocol = window.location.protocol || 'http:';
  const hostname = window.location.hostname || 'localhost';

  return `${protocol}//${hostname}:4000/api`;
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

async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers
    }
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : 'No fue posible completar la solicitud.';
    throw new Error(message);
  }

  return payload as T;
}

export const api = {
  apiUrl: API_URL,

  imageUrl(path?: string | null) {
    if (!path) {
      return null;
    }

    if (path.startsWith('http')) {
      return path;
    }

    return `${API_ROOT}${path}`;
  },

  health() {
    return request<{ status: string; service: string; mode: string }>('/health');
  },

  login(username: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  demoUsers() {
    return request<{ users: DemoUser[]; passwordHint: string }>('/auth/demo-users');
  },

  dashboard() {
    return request<DashboardData>('/dashboard');
  },

  zones() {
    return request<{ zones: ZoneItem[] }>('/zones');
  },

  cases(query = '') {
    return request<{ cases: CaseItem[] }>(`/cases${query}`);
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

  createUser(payload: { name: string; username: string; role: string; password?: string }) {
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
