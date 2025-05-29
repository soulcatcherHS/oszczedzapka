import { z } from 'zod';
import { CATEGORIES } from '@/app/types';

export const loginSchema = z.object({
  username: z.string().min(1, 'Nazwa użytkownika jest wymagana'),
  password: z.string().min(1, 'Hasło jest wymagane'),
});

export const signupSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  username: z.string().min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki'),
  password: z.string().min(6, 'Hasło musi mieć co najmniej 6 znaków'),
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Kwota musi być większa od 0'),
  category: z.enum(CATEGORIES as unknown as readonly [string, ...string[]]),
  description: z.string().min(1, 'Opis jest wymagany'),
  date: z.string().or(z.date()).transform(val => new Date(val)),
});

export const budgetSchema = z.object({
  category: z.enum(CATEGORIES as unknown as readonly [string, ...string[]]),
  amount: z.number().positive('Kwota musi być większa od 0'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format miesiąca musi być YYYY-MM'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;