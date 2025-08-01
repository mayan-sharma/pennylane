import React from 'react';
import { type Expense } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ExpenseTrendsProps {
  expenses: Expense[];
  period: 'week' | 'month' | 'year';
}

export const ExpenseTrends: React.FC<ExpenseTrendsProps> = ({
  expenses,
  period
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Expense Trends ({period})</h3>
      <div className="text-gray-500">
        Chart visualization would go here
      </div>
      <div className="mt-4">
        <p className="text-sm text-gray-600">
          Total expenses: {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
        </p>
      </div>
    </div>
  );
};