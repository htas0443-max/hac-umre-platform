import axios from 'axios';
import type { Tour, ComparisonResult, AIProvider } from './types';

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (email: string, password: string, role: string = 'user', company_name?: string) => {
    const response = await api.post('/api/auth/register', { email, password, role, company_name });
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Tours API
export const toursApi = {
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    min_price?: number;
    max_price?: number;
    operator?: string;
    sort_by?: string;
    sort_order?: string;
  }) => {
    const response = await api.get('/api/tours', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/tours/${id}`);
    return response.data;
  },
  create: async (tour: Omit<Tour, '_id'>) => {
    const response = await api.post('/api/tours', tour);
    return response.data;
  },
  update: async (id: string, tour: Partial<Tour>) => {
    const response = await api.put(`/api/tours/${id}`, tour);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/tours/${id}`);
    return response.data;
  },
};

// AI API
export const aiApi = {
  compare: async (tour_ids: string[], criteria: string[], ai_provider: string = 'openai') => {
    const response = await api.post<ComparisonResult>('/api/compare', {
      tour_ids,
      criteria,
      ai_provider,
    });
    return response.data;
  },
  chat: async (message: string, context_tour_ids?: string[], ai_provider: string = 'openai') => {
    const response = await api.post('/api/chat', {
      message,
      context_tour_ids,
      ai_provider,
    });
    return response.data;
  },
  getProviders: async () => {
    const response = await api.get<{ providers: AIProvider[] }>('/api/providers/models');
    return response.data;
  },
};

// Import API
export const importApi = {
  uploadCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Operator API
export const operatorApi = {
  getMyTours: async (skip?: number, limit?: number, status?: string) => {
    const response = await api.get('/api/operator/tours', { params: { skip, limit, status } });
    return response.data;
  },
  createTour: async (tour: Omit<Tour, '_id'>) => {
    const response = await api.post('/api/operator/tours', tour);
    return response.data;
  },
  updateTour: async (id: string, tour: Partial<Tour>) => {
    const response = await api.put(`/api/operator/tours/${id}`, tour);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/api/operator/stats');
    return response.data;
  },
};

// Admin API
export const adminApi = {
  approveTour: async (id: string) => {
    const response = await api.put(`/api/admin/tours/${id}/approve`);
    return response.data;
  },
  rejectTour: async (id: string, reason: string) => {
    const response = await api.put(`/api/admin/tours/${id}/reject`, null, {
      params: { reason }
    });
    return response.data;
  },
};

// Tickets API
export const ticketsApi = {
  // User: Get my tickets
  getMyTickets: async (status?: string) => {
    const response = await api.get('/api/tickets', { params: { status } });
    return response.data;
  },

  // User: Create ticket
  createTicket: async (ticket: { category: string; subject: string; description: string }) => {
    const response = await api.post('/api/tickets', ticket);
    return response.data;
  },

  // Get ticket by ID
  getById: async (id: number) => {
    const response = await api.get(`/api/tickets/${id}`);
    return response.data;
  },

  // Add message to ticket
  addMessage: async (ticketId: number, message: string) => {
    const response = await api.post(`/api/tickets/${ticketId}/messages`, { message });
    return response.data;
  },

  // Admin: Get all tickets
  getAllTickets: async (params?: { status?: string; category?: string; priority?: string }) => {
    const response = await api.get('/api/admin/tickets', { params });
    return response.data;
  },

  // Admin: Update ticket status
  updateStatus: async (id: number, status: string) => {
    const response = await api.put(`/api/admin/tickets/${id}/status`, { status });
    return response.data;
  },

  // Admin: Reply to ticket
  adminReply: async (ticketId: number, message: string) => {
    const response = await api.post(`/api/admin/tickets/${ticketId}/reply`, { message });
    return response.data;
  },
};

export default api;
