// Type definitions

// Role-Based Access Control (RBAC) Types
export type UserRole = 'super_admin' | 'admin' | 'support' | 'operator' | 'user';

export interface User {
  email: string;
  role: UserRole;
  company_name?: string;
  created_at?: string;
}

export interface Tour {
  id?: number;  // Supabase uses 'id' 
  _id: string;
  title: string;
  operator: string;
  price: number;
  currency: string;
  start_date: string;
  end_date: string;
  duration: string;
  hotel: string;
  services: string[];
  visa: string;
  transport: string;
  guide: string;
  itinerary: string[];
  rating?: number;
  source: string;
  status: string;  // draft, pending, approved, rejected
  created_by?: string;
  created_at?: string;
  rejection_reason?: string;
  // Kalkış bilgileri
  departure_location?: string;  // Kalkış yeri
  departure_time?: string;      // Kalkış saati
  arrival_location?: string;    // İniş/varış yeri (örn: Mekke, Medine)
  detailed_description?: string; // Detaylı açıklama (gezilecek yerler, aktiviteler vb.)
  // Firma doğrulama bilgileri
  is_verified?: boolean;         // TURSAB belgeli, doğrulanmış firma
  operator_phone?: string;       // Firma iletişim telefonu
}

export interface ComparisonResult {
  summary: string;
  comparison: {
    price?: any;
    duration?: any;
    comfort?: any;
    services?: any;
    location?: any;
  };
  recommendations: Array<{
    type: string;
    suggestion: string;
  }>;
  scores: {
    [key: string]: {
      overall: number;
      value_for_money: number;
      comfort: number;
    };
  };
  provider: string;
  raw_response?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIProvider {
  name: string;
  model: string;
  status: 'active' | 'inactive';
  description: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ requiresOTP: boolean; email?: string }>;
  register: (email: string, password: string, company_name?: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  sendEmailOTP: (email: string) => Promise<void>;
  verifyEmailOTP: (email: string, token: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  loading: boolean;
}

// Support Ticket Types
export interface Ticket {
  id: number;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
  messages?: TicketMessage[];
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  sender_email?: string;
}

export interface TicketAttachment {
  id: number;
  ticket_id: number;
  file_url: string;
  file_name: string;
  file_size?: number;
  created_at: string;
}

