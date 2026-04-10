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
    makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false),

  register: (data: any) =>
    makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false),

  getCurrentUser: () =>
    makeRequest('/auth/me', { method: 'GET' }),

  createFaculty: async (formData: FormData) => {
    const token = getToken();
    if (!token) throw new Error('No authentication token available');

    const response = await fetch(`${API_BASE_URL}/auth/faculty`, {
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

  deleteFaculty: (id: string) =>
    makeRequest(`/auth/faculties/${id}`, { method: 'DELETE' }),

  getFaculties: () =>
    makeRequest('/auth/faculties', { method: 'GET' }),
};

// ================= STUDENTS =================
export const studentsApi = {
  getAll: () =>
    makeRequest('/students', { method: 'GET' }),

  getById: (id: string) =>
    makeRequest(`/students/${id}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    makeRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/students/${id}`, { method: 'DELETE' }),

  switchClass: (id: string, data: { newClass: string }) =>
    makeRequest(`/students/switch-class/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  undoSwitch: (id: string) =>
    makeRequest(`/students/undo-switch/${id}`, { method: 'PUT' }),

  promoteAll: () =>
    makeRequest('/students/promote-all', { method: 'PUT' }),

  undoPromoteAll: () =>
    makeRequest('/students/undo-promote-all', { method: 'PUT' }),

  getPromotionStatus: () =>
    makeRequest('/students/promotion-status', { method: 'GET' }),

  backfillBalances: () =>
    makeRequest('/students/backfill-balances', { method: 'PUT' }),
};

export const feeCatalogApi = {
  getAll: () =>
    makeRequest('/fee-catalog', { method: 'GET' }),

  getByClass: (className: string) =>
    makeRequest(`/fee-catalog/class/${encodeURIComponent(className)}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/fee-catalog', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    makeRequest(`/fee-catalog/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/fee-catalog/${id}`, { method: 'DELETE' }),
};

// ================= HALL TICKETS =================
export const hallTicketsApi = {
  getAll: () =>
    makeRequest('/hall-tickets', { method: 'GET' }),

  getByClass: (className: string, section: string) =>
    makeRequest(`/hall-tickets/class/${encodeURIComponent(className)}/${encodeURIComponent(section)}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/hall-tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/hall-tickets/${id}`, { method: 'DELETE' }),
};
// ================= PAYMENTS =================
export const paymentsApi = {
  getAll: () =>
    makeRequest('/payments', { method: 'GET' }),

  getByStudent: (studentId: string) =>
    makeRequest(`/payments/student/${studentId}`, { method: 'GET' }),

  getById: (id: string) =>
    makeRequest(`/payments/${id}`, { method: 'GET' }),

  create: (data: any) =>
    makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: any) =>
    makeRequest(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/payments/${id}`, { method: 'DELETE' }),

  getSummary: () =>
    makeRequest('/payments/stats/summary', { method: 'GET' }),
};

// ================= DASHBOARD =================
export const dashboardApi = {
  getStats: () =>
    makeRequest('/dashboard', { method: 'GET' }),
};

// ================= REPORT CARDS =================
export const reportCardsApi = {
  getAll: () =>
    makeRequest('/report-cards', { method: 'GET' }),

  getByStudent: (studentId: string) =>
    makeRequest(`/report-cards/student/${studentId}`, { method: 'GET' }),

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