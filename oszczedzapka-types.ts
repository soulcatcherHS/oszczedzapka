export interface User {
  _id: string;
  email: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  _id: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: Category;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  _id: string;
  userId: string;
  category: Category;
  amount: number;
  month: string; // Format: "YYYY-MM"
  createdAt: Date;
  updatedAt: Date;
}

export type Category = 
  | 'Jedzenie i napoje'
  | 'Rozrywka'
  | 'Transport'
  | 'Materiały naukowe'
  | 'Rachunki'
  | 'Inne';

export const CATEGORIES: Category[] = [
  'Jedzenie i napoje',
  'Rozrywka',
  'Transport',
  'Materiały naukowe',
  'Rachunki',
  'Inne'
];

export const CATEGORY_COLORS: Record<Category, string> = {
  'Jedzenie i napoje': '#ef4444',
  'Rozrywka': '#f59e0b',
  'Transport': '#3b82f6',
  'Materiały naukowe': '#8b5cf6',
  'Rachunki': '#10b981',
  'Inne': '#6b7280'
};

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  currentBalance: number;
}

export interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
}

export interface CategorySpending {
  category: Category;
  amount: number;
  percentage: number;
  color: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}