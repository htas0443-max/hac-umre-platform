import axios from 'axios';
import type { Tour, ComparisonResult, AIProvider } from './types';

const API_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '';
console.log('[API DEBUG] VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
console.log('[API DEBUG] API_URL kullanılan:', API_URL);

// ✅ 2️⃣ JWT TOKEN ONLY (Memory Storage)
// Token'i localStorage yerine bellekte tutuyoruz.
let memoryToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  memoryToken = token;
};

export const getAuthToken = () => {
  return memoryToken;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// API REQUEST SIGNING (HMAC-SHA256)
// ============================================
const API_SIGNING_KEY = import.meta.env.VITE_API_SIGNING_KEY || '';

async function computeSignature(
  method: string, path: string, timestamp: string, nonce: string, bodyHash: string
): Promise<string> {
  const message = `${method}:${path}:${timestamp}:${nonce}:${bodyHash}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(API_SIGNING_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hash(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateNonce(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Request interceptor: JWT token + Request Signing
api.interceptors.request.use(
  async (config) => {
    // JWT token
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Request signing (sadece signing key varsa aktif)
    if (API_SIGNING_KEY) {
      const method = (config.method || 'GET').toUpperCase();
      const path = new URL(config.url || '', config.baseURL || window.location.origin).pathname;
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonce = generateNonce();
      const bodyStr = config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : '';
      const bodyHash = await sha256Hash(bodyStr);

      config.headers['X-Timestamp'] = timestamp;
      config.headers['X-Nonce'] = nonce;
      config.headers['X-Signature'] = await computeSignature(method, path, timestamp, nonce, bodyHash);
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
      // Don't redirect for auth endpoints where 401 is expected
      const url = error.config?.url || '';
      const isAuthEndpoint = url.includes('/api/auth/refresh') ||
        url.includes('/api/auth/login') ||
        url.includes('/api/auth/sync');

      if (!isAuthEndpoint) {
        setAuthToken(null);
        window.location.href = '/login';
      }
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
  login: async (email: string, password: string, turnstile_token?: string) => {
    const response = await api.post('/api/auth/login', { email, password, turnstile_token });
    return response.data;
  },
  me: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  refresh: async () => {
    const response = await api.post('/api/auth/refresh');
    return response.data;
  },
  sync: async (session: { access_token: string; refresh_token?: string; user?: any }) => {
    const response = await api.post('/api/auth/sync', session);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/api/auth/logout');
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
  getAuditLogs: async (params: Record<string, string | number>) => {
    const response = await api.get('/api/admin/audit-logs', { params });
    return response.data;
  },
  getAgencyAnalytics: async () => {
    const response = await api.get('/api/admin/agency-analytics');
    return response.data;
  },
  // User management — Soft Ban + Dry-Run
  suspendUser: async (userId: string, dryRun: boolean = false) => {
    const response = await api.patch(`/api/admin/users/${userId}/suspend`, null, {
      params: { dry_run: dryRun }
    });
    return response.data;
  },
  activateUser: async (userId: string) => {
    const response = await api.patch(`/api/admin/users/${userId}/activate`);
    return response.data;
  },
  // License verification
  verifyLicense: async (operatorId: string) => {
    const response = await api.post(`/api/admin/licenses/verify/${operatorId}`, null, {
      params: { verified: true }
    });
    return response.data;
  },
  rejectLicense: async (operatorId: string) => {
    const response = await api.post(`/api/admin/licenses/verify/${operatorId}`, null, {
      params: { verified: false }
    });
    return response.data;
  },
  // Settings
  getSettings: async () => {
    const response = await api.get('/api/admin/settings');
    return response.data;
  },
  updateSettings: async (settings: Record<string, any>, dryRun: boolean = false) => {
    const response = await api.put('/api/admin/settings', { settings }, {
      params: { dry_run: dryRun }
    });
    return response.data;
  },
  // Notifications
  getNotifications: async () => {
    const response = await api.get('/api/admin/notifications');
    return response.data;
  },
  createNotification: async (data: { title: string; message: string; target_role: string }) => {
    const response = await api.post('/api/admin/notifications', data);
    return response.data;
  },
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/api/admin/notifications/${id}`);
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

// Favorites API - Niyet göstergesi (Sepet/Rezervasyon DEĞİL)
export const favoritesApi = {
  // Kullanıcının favorilerini getir (tur detaylarıyla)
  getAll: async () => {
    const response = await api.get('/api/favorites');
    return response.data;
  },

  // Favorilere ekle
  add: async (tourId: number) => {
    const response = await api.post('/api/favorites', { tour_id: tourId });
    return response.data;
  },

  // Favorilerden çıkar
  remove: async (tourId: number) => {
    const response = await api.delete(`/api/favorites/${tourId}`);
    return response.data;
  },

  // localStorage'dan senkronize et (login sonrası)
  sync: async (tourIds: number[]) => {
    const response = await api.post('/api/favorites/sync', { tour_ids: tourIds });
    return response.data;
  },
};

// Price Alerts API - Fiyat düşüşü bildirimi
export const priceAlertsApi = {
  // Bildirimleri listele
  getAll: async () => {
    const response = await api.get('/api/price-alerts');
    return response.data;
  },

  // Bildirim oluştur
  create: async (tourId: number) => {
    const response = await api.post('/api/price-alerts', { tour_id: tourId });
    return response.data;
  },

  // Bildirimi kaldır
  remove: async (tourId: number) => {
    const response = await api.delete(`/api/price-alerts/${tourId}`);
    return response.data;
  },

  // Bildirimi aç/kapat
  toggle: async (tourId: number) => {
    const response = await api.post(`/api/price-alerts/${tourId}/toggle`);
    return response.data;
  },
};

// Tour Alerts API - Tarih bazlı "bu tarihte tur açılırsa haber ver"
export const tourAlertsApi = {
  // Alarm listele
  getAll: async () => {
    const response = await api.get('/api/tour-alerts');
    return response.data;
  },

  // Alarm oluştur
  create: async (data: {
    start_date: string;
    end_date: string;
    tour_type?: string;
    max_price?: number;
    preferred_operator?: string;
  }) => {
    const response = await api.post('/api/tour-alerts', data);
    return response.data;
  },

  // Alarm güncelle
  update: async (alertId: string, data: {
    start_date?: string;
    end_date?: string;
    tour_type?: string;
    max_price?: number;
    preferred_operator?: string;
    is_active?: boolean;
  }) => {
    const response = await api.put(`/api/tour-alerts/${alertId}`, data);
    return response.data;
  },

  // Alarm sil
  remove: async (alertId: string) => {
    const response = await api.delete(`/api/tour-alerts/${alertId}`);
    return response.data;
  },
};

// Reviews API - Firma değerlendirmeleri
export const reviewsApi = {
  // Yorum oluştur
  create: async (data: {
    operator_name: string;
    rating: number;
    title?: string;
    comment?: string;
    tour_id?: number;
  }) => {
    const response = await api.post('/api/reviews', data);
    return response.data;
  },

  // Operatör yorumlarını getir (public)
  getByOperator: async (operatorName: string) => {
    const response = await api.get(`/api/reviews/operator/${encodeURIComponent(operatorName)}`);
    return response.data;
  },

  // Kendi yorumlarımı getir
  getMy: async () => {
    const response = await api.get('/api/reviews/my');
    return response.data;
  },

  // Yorum sil
  remove: async (reviewId: string) => {
    const response = await api.delete(`/api/reviews/${reviewId}`);
    return response.data;
  },

  // Operatör: Kendi firmasının yorumlarını getir
  getOperatorReviews: async () => {
    const response = await api.get('/api/operator/reviews');
    return response.data;
  },

  // Admin: Bekleyen yorumları getir
  getAdminReviews: async (status: string = 'pending') => {
    const response = await api.get(`/api/admin/reviews?status=${status}`);
    return response.data;
  },

  // Admin: Yorum onayla/reddet
  moderate: async (reviewId: string, action: 'approve' | 'reject', reason?: string) => {
    const response = await api.put(`/api/admin/reviews/${reviewId}/moderate`, {
      action,
      rejection_reason: reason
    });
    return response.data;
  },
};

export default api;
