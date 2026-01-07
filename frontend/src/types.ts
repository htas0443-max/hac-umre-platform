// Type definitions

export interface User {
  email: string;
  role: string;
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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, company_name?: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  loading: boolean;
}
