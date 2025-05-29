import axios from 'axios';
import Cookies from 'js-cookie';
import { 
  ApiResponse, 
  AuthResponse, 
  LoginCredentials, 
  SignupCredentials,
  Transaction,
  Budget,
  DashboardStats,
  CashFlowData,
  CategorySpending
} from '@/app/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/api/auth/login', credentials);
    if (data.success && data.data) {
      Cookies.set('token', data.data.token, { expires: 7 });
    }
    return data;
  },

  signup: async (credentials: SignupCredentials) => {
    const { data } = await api.post<ApiResponse<AuthResponse>>('/api/auth/signup', credentials);
    if (data.success && data.data) {
      Cookies.set('token', data.data.token, { expires: 7 });
    }
    return data;
  },

  logout: () => {
    Cookies.remove('token');
    window.location.href = '/login';
  },
};

export const transactionsApi = {
  getAll: async (params?: {
    month?: string;
    category?: string;
    type?: 'income' | 'expense';
    limit?: number;
    skip?: number;
  }) => {
    const { data } = await api.get<ApiResponse<Transaction[]>>('/api/transactions', { params });
    return data;
  },

  create: async (transaction: Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.post<ApiResponse<Transaction>>('/api/transactions', transaction);
    return data;
  },

  update: async (id: string, transaction: Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.put<ApiResponse<Transaction>>(`/api/transactions/${id}`, transaction);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<ApiResponse<{ message: string }>>(`/api/transactions/${id}`);
    return data;
  },
};

export const budgetsApi = {
  getAll: async (month?: string) => {
    const params = month ? { month } : undefined;
    const { data } = await api.get<ApiResponse<Budget[]>>('/api/budgets', { params });
    return data;
  },

  create: async (budget: Omit<Budget, '_id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.post<ApiResponse<Budget>>('/api/budgets', budget);
    return data;
  },

  createBatch: async (budgets: Array<Omit<Budget, '_id' | 'userId' | 'createdAt' | 'updatedAt'>>) => {
    const { data } = await api.post<ApiResponse<Budget[]>>('/api/budgets', budgets);
    return data;
  },
};

export const dashboardApi = {
  getStats: async () => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/api/dashboard/stats');
    return data;
  },

  getCashFlow: async () => {
    const { data } = await api.get<ApiResponse<CashFlowData[]>>('/api/dashboard/cashflow');
    return data;
  },

  getCategorySpending: async () => {
    const { data } = await api.get<ApiResponse<CategorySpending[]>>('/api/dashboard/categories');
    return data;
  },
};