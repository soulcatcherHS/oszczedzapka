'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Budget, CATEGORIES, CATEGORY_COLORS, Transaction } from '@/app/types';
import { budgetsApi, transactionsApi } from '@/app/lib/api';
import toast from 'react-hot-toast';

interface CategoryBudget extends Budget {
  spent: number;
  percentage: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(value);
};

export default function BudgetsManagement() {
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, number>>({});

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      
      // Load budgets
      const budgetsRes = await budgetsApi.getAll(selectedMonth);
      const budgetsData = budgetsRes.data || [];
      
      // Load transactions for the month to calculate spending
      const transactionsRes = await transactionsApi.getAll({
        month: selectedMonth,
        type: 'expense'
      });
      const transactions = transactionsRes.data || [];
      
      // Calculate spending by category
      const spendingByCategory = transactions.reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Combine budgets with spending
      const categoryBudgets: CategoryBudget[] = CATEGORIES.map(category => {
        const budget = budgetsData.find(b => b.category === category);
        const spent = spendingByCategory[category] || 0;
        const budgetAmount = budget?.amount || 0;
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        
        return {
          _id: budget?._id || '',
          userId: budget?.userId || '',
          category,
          amount: budgetAmount,
          month: selectedMonth,
          spent,
          percentage,
          createdAt: budget?.createdAt || new Date(),
          updatedAt: budget?.updatedAt || new Date(),
        };
      });
      
      setBudgets(categoryBudgets);
      
      // Initialize edit values
      const values: Record<string, number> = {};
      categoryBudgets.forEach(b => {
        values[b.category] = b.amount;
      });
      setEditValues(values);
      
    } catch (error) {
      toast.error('Błąd podczas ładowania budżetów');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const budgetsToSave = CATEGORIES.map(category => ({
        category,
        amount: editValues[category] || 0,
        month: selectedMonth,
      }));
      
      const response = await budgetsApi.createBatch(budgetsToSave);
      if (response.success) {
        toast.success('Budżety zostały zapisane');
        setIsEditing(false);
        loadBudgets();
      }
    } catch (error) {
      toast.error('Błąd podczas zapisywania budżetów');
    }
  };

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-danger-600';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-success-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Zarządzanie budżetem</h1>
        <div className="flex items-center space-x-4">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
          />
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Edytuj budżety
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-success-600 hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success-500 transition-colors"
              >
                Zapisz
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadBudgets();
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Anuluj
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget, index) => (
          <motion.div
            key={budget.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {budget.category}
              </h3>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${CATEGORY_COLORS[budget.category]}20` }}
              >
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[budget.category] }}
                />
              </div>
            </div>

            {isEditing ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budżet (PLN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editValues[budget.category] || 0}
                  onChange={(e) => setEditValues({
                    ...editValues,
                    [budget.category]: parseFloat(e.target.value) || 0
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Wydano</span>
                    <span>{budget.percentage.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`h-2 rounded-full ${getProgressBarColor(budget.percentage)}`}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-baseline">
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(budget.spent)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      z {formatCurrency(budget.amount)}
                    </p>
                  </div>
                  {budget.percentage >= 100 && (
                    <span className="text-sm font-medium text-danger-600">
                      Przekroczono!
                    </span>
                  )}
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}