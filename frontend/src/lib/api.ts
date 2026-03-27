import { useAuthStore } from '@/store/authStore';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Helper function to get token from Zustand store or localStorage
const getToken = (): string | null => {
  const tokenFromStore = useAuthStore.getState().token;
  if (tokenFromStore) return tokenFromStore;

  const authStorage = localStorage.getItem('auth-storage');
  if (!authStorage) return null;

  try {
    const parsed = JSON.parse(authStorage);
    const token = parsed?.state?.token || parsed?.token || null;
    return token || null;
  } catch {
    return null;
  }
};

// Helper function to make authenticated requests
const makeRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  requireAuth: boolean = true
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If body is FormData (file upload), delete content-type to allow browser boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  if (requireAuth) {
    let token = getToken();
    if (!token) {
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated && authState.user?.username === 'Sadhana') {
        token = 'demo-token';
      }
    }
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
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false),

  register: (data: { username: string; password: string; name: string; email?: string; role?: string }) =>
    makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false),

  getCurrentUser: () =>
    makeRequest('/auth/me', { method: 'GET' }),

  createFaculty: async (formData: FormData) => {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/faculty`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  getFaculties: () =>
    makeRequest('/auth/faculties', { method: 'GET' }),
};

// Students API
export const studentsApi = {
  getAll: () =>
    makeRequest('/students', { method: 'GET' }),

  getById: (id: string) =>
    makeRequest(`/students/${id}`, { method: 'GET' }),

  create: (data: {
    name: string;
    class: string;
    section: string;
    rollNumber: string;
    contactNumber: string;
    address: string;
    totalFee: number;
    photo?: string;
  }) =>
    makeRequest('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{
    name: string;
    class: string;
    section: string;
    rollNumber: string;
    contactNumber: string;
    address: string;
    totalFee: number;
    photo?: string;
  }>) =>
    makeRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/students/${id}`, { method: 'DELETE' }),

  getDistribution: () =>
    makeRequest('/students/stats/distribution', { method: 'GET' }),
};

// Payments API
export const paymentsApi = {
  getAll: () =>
    makeRequest('/payments', { method: 'GET' }),

  getByStudent: (studentId: string) =>
    makeRequest(`/payments/student/${studentId}`, { method: 'GET' }),

  getById: (id: string) =>
    makeRequest(`/payments/${id}`, { method: 'GET' }),

  create: (data: {
    studentId: string;
    amount: number;
    mode: 'cash' | 'online';
    date?: string;
  }) =>
    makeRequest('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{
    amount: number;
    mode: 'cash' | 'online';
    date: string;
  }>) =>
    makeRequest(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/payments/${id}`, { method: 'DELETE' }),

  getSummary: () =>
    makeRequest('/payments/stats/summary', { method: 'GET' }),
};

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    makeRequest('/dashboard', { method: 'GET' }),
};

// Report Cards API
export const reportCardsApi = {
  getAll: () =>
    makeRequest('/report-cards', { method: 'GET' }),

  getByStudent: (studentId: string) =>
    makeRequest(`/report-cards/student/${studentId}`, { method: 'GET' }),

  getById: (id: string) =>
    makeRequest(`/report-cards/${id}`, { method: 'GET' }),

  create: (data: {
    studentId: string;
    term: string;
    subjects: Array<{
      name: string;
      maxMarks: number;
      obtainedMarks: number;
    }>;
  }) =>
    makeRequest('/report-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<{
    term: string;
    subjects: Array<{
      name: string;
      maxMarks: number;
      obtainedMarks: number;
    }>;
  }>) =>
    makeRequest(`/report-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    makeRequest(`/report-cards/${id}`, { method: 'DELETE' }),
};
