import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Transaction, Budget, Category, CATEGORIES } from '@/app/types';

// User Model
interface IUser extends Omit<User, '_id'>, Document {
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Transaction Model
interface ITransaction extends Omit<Transaction, '_id' | 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
}

const transactionSchema = new Schema<ITransaction>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Budget Model
interface IBudget extends Omit<Budget, '_id' | 'userId'>, Document {
  userId: mongoose.Types.ObjectId;
}

const budgetSchema = new Schema<IBudget>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: CATEGORIES,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/,
  },
}, {
  timestamps: true,
});

// Create compound index for unique budget per category per month per user
budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

// Export models
export const UserModel: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export const TransactionModel: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);
export const BudgetModel: Model<IBudget> = mongoose.models.Budget || mongoose.model<IBudget>('Budget', budgetSchema);