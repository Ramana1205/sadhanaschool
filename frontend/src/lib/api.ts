import { useAuthStore } from '@/store/authStore';

// ================= CONFIG =================
// Use a fixed production API host by default so route-based client navigation
// does not change the request origin or path.
const DEFAULT_API_BASE_URL = 'https://sadhanaschool.onrender.com';

const getApiBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_URL;
  if (rawUrl) {
    return rawUrl.replace(/\/+$/, '');
  }

  return DEFAULT_API_BASE_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// ================= TOKEN =================
const getToken = (): string | null => {
  const tokenFromStore = useAuthStore.getState().token;
  if (tokenFromStore) return tokenFromStore;

  const authStorage = localStorage.getItem('auth-storage');
  if (!authStorage) return null;

  try {
    const parsed = JSON.parse(authStorage);
    return parsed?.state?.token || parsed?.token || null;
  } catch {
    return null;
  }
};

// ================= GENERIC REQUEST =================
const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    ...(!(options.body instanceof FormData) && {
      'Content-Type': 'application/json',
    }),
    ...options.headers,
  };

  if (requireAuth) {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `HTTP error! ${response.status}`);
  }

  return response.json();
};

export const apiFetch = async <T>(endpoint: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...(!(options.body instanceof FormData) && {
        'Content-Type': 'application/json',
      }),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
};

// ================= AUTH =================
export const authApi = {
  login: (username: string, password: string) =>
    makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false),

  register: (data: any) =>
    makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false),

  getCurrentUser: () =>
    makeRequest('/api/auth/me', { method: 'GET' }),

  createFaculty: async (formData: FormData) => {
    const token = getToken();
    if (!token) throw new Error('No authentication token available');

    const response = await fetch(`${API_BASE_URL}/api/auth/faculty`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create faculty');
    }

    return response.json();
  },

  getFaculties: () =>
    makeRequest('/api/auth/faculties', { method: 'GET' }),
};

// ================= STUDENTS =================
export const studentsApi = {
  getAll: () =>
    makeRequest('/api/students', { method: 'GET' }),

  getById: (id: string) =>
    makeRequest(`/api/students/${id}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/api/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    makeRequest(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/api/students/${id}`, { method: 'DELETE' }),

  switchClass: (id: string, data: { newClass: string }) =>
    makeRequest(`/api/students/switch-class/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  undoSwitch: (id: string) =>
    makeRequest(`/api/students/undo-switch/${id}`, { method: 'PUT' }),

  promoteAll: () =>
    makeRequest('/api/students/promote-all', { method: 'PUT' }),

  undoPromoteAll: () =>
    makeRequest('/api/students/undo-promote-all', { method: 'PUT' }),

  getPromotionStatus: () =>
    makeRequest('/api/students/promotion-status', { method: 'GET' }),

  backfillBalances: () =>
    makeRequest('/api/students/backfill-balances', { method: 'PUT' }),
};

export const feeCatalogApi = {
  getAll: () =>
    makeRequest('/api/fee-catalog', { method: 'GET' }),

  getByClass: (className: string) =>
    makeRequest(`/api/fee-catalog/class/${encodeURIComponent(className)}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/api/fee-catalog', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    makeRequest(`/api/fee-catalog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/api/fee-catalog/${id}`, { method: 'DELETE' }),
};

// ================= HALL TICKETS =================
export const hallTicketsApi = {
  getAll: () =>
    makeRequest('/api/hall-tickets', { method: 'GET' }),

  getByClass: (className: string, section: string) =>
    makeRequest(`/api/hall-tickets/class/${encodeURIComponent(className)}/${encodeURIComponent(section)}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/api/hall-tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/api/hall-tickets/${id}`, { method: 'DELETE' }),
};
// ================= PAYMENTS =================
export const paymentsApi = {
  getAll: () =>
    makeRequest('/api/payments', { method: 'GET' }),

  getByStudent: (studentId: string) =>
    makeRequest(`/api/payments/student/${studentId}`, { method: 'GET' }),

  getById: (id: string) =>
    makeRequest(`/api/payments/${id}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    makeRequest(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/api/payments/${id}`, { method: 'DELETE' }),

  getSummary: () =>
    makeRequest('/api/payments/stats/summary', { method: 'GET' }),
};

// ================= DASHBOARD =================
export const dashboardApi = {
  getStats: () =>
    makeRequest('/api/dashboard', { method: 'GET' }),
};

// ================= REPORT CARDS =================
export const reportCardsApi = {
  getAll: () =>
    makeRequest('/api/report-cards', { method: 'GET' }),

  getByStudent: (studentId: string) =>
    makeRequest(`/api/report-cards/student/${studentId}`, { method: 'GET' }),

  getById: (id: string) =>
    makeRequest(`/report-cards/${id}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/report-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    makeRequest(`/report-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/report-cards/${id}`, { method: 'DELETE' }),
};