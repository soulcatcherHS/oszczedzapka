import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import { BudgetModel } from '@/models';
import { authenticateRequest } from '@/app/lib/auth';
import { budgetSchema } from '@/app/lib/validation';
import { ApiResponse, Budget } from '@/app/types';

// GET /api/budgets
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

    // Build query
    const query: any = { userId: user.userId };
    if (month) query.month = month;

    // Fetch budgets
    const budgets = await BudgetModel
      .find(query)
      .sort({ category: 1 })
      .lean();

    const formattedBudgets: Budget[] = budgets.map(b => ({
      _id: b._id.toString(),
      userId: b.userId.toString(),
      category: b.category,
      amount: b.amount,
      month: b.month,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json<ApiResponse<Budget[]>>({
      success: true,
      data: formattedBudgets,
    });

  } catch (error) {
    console.error('Get budgets error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Wystąpił błąd serwera' },
      { status: 500 }
    );
  }
}

// POST /api/budgets
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
    
    // Handle batch update
    if (Array.isArray(body)) {
      const budgets: Budget[] = [];
      
      for (const budgetData of body) {
        const validatedData = budgetSchema.parse(budgetData);
        
        const budget = await BudgetModel.findOneAndUpdate(
          {
            userId: user.userId,
            category: validatedData.category,
            month: validatedData.month,
          },
          {
            amount: validatedData.amount,
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );

        budgets.push({
          _id: budget._id.toString(),
          userId: budget.userId.toString(),
          category: budget.category,
          amount: budget.amount,
          month: budget.month,
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
        });
      }

      return NextResponse.json<ApiResponse<Budget[]>>({
        success: true,
        data: budgets,
      });
    }
    
    // Handle single budget
    const validatedData = budgetSchema.parse(body);

    const budget = await BudgetModel.findOneAndUpdate(
      {
        userId: user.userId,
        category: validatedData.category,
        month: validatedData.month,
      },
      {
        amount: validatedData.amount,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    const formattedBudget: Budget = {
      _id: budget._id.toString(),
      userId: budget.userId.toString(),
      category: budget.category,
      amount: budget.amount,
      month: budget.month,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };

    return NextResponse.json<ApiResponse<Budget>>({
      success: true,
      data: formattedBudget,
    }, { status: 201 });

  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Create budget error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Wystąpił błąd serwera' },
      { status: 500 }
    );
  }
}