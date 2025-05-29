import { loginSchema, signupSchema, transactionSchema, budgetSchema } from '../validation';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        username: 'testuser',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty username', () => {
      const invalidData = {
        username: '',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Nazwa użytkownika jest wymagana');
      }
    });
  });

  describe('signupSchema', () => {
    it('should validate correct signup data', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };
      
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        username: 'testuser',
        password: 'password123',
      };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Nieprawidłowy adres email');
      }
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'testuser',
        password: '12345',
      };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Hasło musi mieć co najmniej 6 znaków');
      }
    });
  });

  describe('transactionSchema', () => {
    it('should validate correct transaction data', () => {
      const validData = {
        type: 'expense',
        amount: 100.50,
        category: 'Jedzenie i napoje',
        description: 'Zakupy spożywcze',
        date: '2024-01-15',
      };
      
      const result = transactionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const invalidData = {
        type: 'expense',
        amount: -50,
        category: 'Jedzenie i napoje',
        description: 'Test',
        date: '2024-01-15',
      };
      
      const result = transactionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Kwota musi być większa od 0');
      }
    });
  });

  describe('budgetSchema', () => {
    it('should validate correct budget data', () => {
      const validData = {
        category: 'Transport',
        amount: 500,
        month: '2024-01',
      };
      
      const result = budgetSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid month format', () => {
      const invalidData = {
        category: 'Transport',
        amount: 500,
        month: '2024-1',
      };
      
      const result = budgetSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Format miesiąca musi być YYYY-MM');
      }
    });
  });
});