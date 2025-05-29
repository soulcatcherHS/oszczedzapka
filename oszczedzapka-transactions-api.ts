import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import { TransactionModel } from '@/models';
import { authenticateRequest } from '@/app/lib/auth';
import { transactionSchema } from '@/app/lib/validation';
import { ApiResponse, Transaction } from '@/app/types';

// GET /api/transactions
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Nieautoryzowany' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month'); // Format: YYYY-MM
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    const query: any = { userId: user.userId };
    
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (category) query.category = category;
    if (type) query.type = type;

    // Fetch transactions
    const transactions = await TransactionModel
      .find(query)
      .sort({ date: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const formattedTransactions: Transaction[] = transactions.map(t => ({
      _id: t._id.toString(),
      userId: t.userId.toString(),
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json<ApiResponse<Transaction[]>>({
      success: true,
      data: formattedTransactions,
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Wystąpił błąd serwera' },
      { status: 500 }
    );
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Nieautoryzowany' },
        { status: 401 }
      );
    }

    await connectDB();
    const body = await request.json();
    
    // Validate input
    const validatedData = transactionSchema.parse(body);

    // Create transaction
    const transaction = await TransactionModel.create({
      userId: user.userId,
      ...validatedData,
    });

    const formattedTransaction: Transaction = {
      _id: transaction._id.toString(),
      userId: transaction.userId.toString(),
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };

    return NextResponse.json<ApiResponse<Transaction>>({
      success: true,
      data: formattedTransaction,
    }, { status: 201 });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Create transaction error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Wystąpił błąd serwera' },
      { status: 500 }
    );
  }
}