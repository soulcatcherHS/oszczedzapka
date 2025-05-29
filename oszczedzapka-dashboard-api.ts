import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db';
import { TransactionModel } from '@/models';
import { authenticateRequest } from '@/app/lib/auth';
import { ApiResponse, DashboardStats, CashFlowData, CategorySpending, CATEGORY_COLORS } from '@/app/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Nieautoryzowany' },
        { status: 401 }
      );
    }

    await connectDB();

    if (params.type === 'stats') {
      // Calculate total income, expenses, and balance
      const incomeAgg = await TransactionModel.aggregate([
        { $match: { userId: user.userId, type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const expenseAgg = await TransactionModel.aggregate([
        { $match: { userId: user.userId, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const totalIncome = incomeAgg[0]?.total || 0;
      const totalExpenses = expenseAgg[0]?.total || 0;
      const currentBalance = totalIncome - totalExpenses;

      const stats: DashboardStats = {
        totalIncome,
        totalExpenses,
        currentBalance,
      };

      return NextResponse.json<ApiResponse<DashboardStats>>({
        success: true,
        data: stats,
      });
    }

    else if (params.type === 'cashflow') {
      // Get last 6 months of cash flow data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const transactions = await TransactionModel.find({
        userId: user.userId,
        date: { $gte: sixMonthsAgo }
      }).sort({ date: 1 });

      // Group by month
      const monthlyData = new Map<string, CashFlowData>();

      transactions.forEach(transaction => {
        const monthKey = format(transaction.date, 'yyyy-MM');
        const monthName = format(transaction.date, 'MMM yyyy');
        
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, {
            month: monthName,
            income: 0,
            expenses: 0,
          });
        }

        const data = monthlyData.get(monthKey)!;
        if (transaction.type === 'income') {
          data.income += transaction.amount;
        } else {
          data.expenses += transaction.amount;
        }
      });

      // Fill in missing months with zero values
      const result: CashFlowData[] = [];
      const currentDate = new Date(sixMonthsAgo);
      const now = new Date();

      while (currentDate <= now) {
        const monthKey = format(currentDate, 'yyyy-MM');
        const monthName = format(currentDate, 'MMM yyyy');
        
        result.push(
          monthlyData.get(monthKey) || {
            month: monthName,
            income: 0,
            expenses: 0,
          }
        );

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return NextResponse.json<ApiResponse<CashFlowData[]>>({
        success: true,
        data: result,
      });
    }

    else if (params.type === 'categories') {
      // Get current month spending by category
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const categoryAgg = await TransactionModel.aggregate([
        {
          $match: {
            userId: user.userId,
            type: 'expense',
            date: { $gte: monthStart, $lte: monthEnd }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        }
      ]);

      const totalExpenses = categoryAgg.reduce((sum, cat) => sum + cat.total, 0);

      const categorySpending: CategorySpending[] = categoryAgg.map(cat => ({
        category: cat._id,
        amount: cat.total,
        percentage: totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0,
        color: CATEGORY_COLORS[cat._id as keyof typeof CATEGORY_COLORS],
      }));

      // Sort by amount descending
      categorySpending.sort((a, b) => b.amount - a.amount);

      return NextResponse.json<ApiResponse<CategorySpending[]>>({
        success: true,
        data: categorySpending,
      });
    }

    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Nieprawidłowy typ danych' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Wystąpił błąd serwera' },
      { status: 500 }
    );
  }
}