import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import { TransactionModel } from '@/models';
import { authenticateRequest } from '@/app/lib/auth';
import { transactionSchema } from '@/app/lib/validation';
import { ApiResponse, Transaction } from '@/app/types';
import mongoose from 'mongoose';

// PUT /api/transactions/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Nieautoryzowany' },
        { status: 401 }
      );
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Nieprawidłowe ID transakcji' },
        { status: 400 }
      );
    }

    await connectDB();
    const body = await request.json();
    
    // Validate input
    const validatedData = transactionSchema.parse(body);

    // Update transaction
    const transaction = await TransactionModel.findOneAndUpdate(
      { _id: params.id, userId: user.userId },
      validatedData,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Transakcja nie została znaleziona' },
        { status: 404 }
      );
    }

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
    });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Update transaction error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Wystąpił błąd serwera' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Nieautoryzowany' },
        { status: 401 }
      );
    }

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Nieprawidłowe ID transakcji' },
        { status: 400 }
      );
    }

    await connectDB();

    // Delete transaction
    const transaction = await TransactionModel.findOneAndDelete({
      _id: params.id,
      userId: user.userId,
    });

    if (!transaction) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Transakcja nie została znaleziona' },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ message: string }>>({
      success: true,
      data: { message: 'Transakcja została usunięta' },
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Wystąpił błąd serwera' },
      { status: 500 }
    );
  }
}