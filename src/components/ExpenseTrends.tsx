import React, { useMemo } from 'react';
import type { Expense } from '../types';
import { formatCurrency } from '../utils/formatters';

interface ExpenseTrendsProps {
  expenses: Expense[];
  period?: 'week' | 'month' | 'year';
}

export const ExpenseTrends: React.FC<ExpenseTrendsProps> = ({ 
  expenses, 
  period = 'month' 
}) => {

  const trendData = useMemo(() => {
    const now = new Date();
    const periods: { label: string; amount: number; date: Date }[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const periodDate = new Date(now);
      let label: string;
      
      if (period === 'week') {
        periodDate.setDate(now.getDate() - (i * 7));
        label = periodDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      } else if (period === 'month') {
        periodDate.setMonth(now.getMonth() - i);
        label = periodDate.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      } else {
        periodDate.setFullYear(now.getFullYear() - i);
        label = periodDate.getFullYear().toString();
      }
      
      const periodStart = new Date(periodDate);
      const periodEnd = new Date(periodDate);
      
      if (period === 'week') {
        periodEnd.setDate(periodStart.getDate() + 6);
      } else if (period === 'month') {
        periodEnd.setMonth(periodStart.getMonth() + 1);
        periodEnd.setDate(0);
      } else {
        periodEnd.setFullYear(periodStart.getFullYear() + 1);
        periodEnd.setDate(0);
      }
      
      const periodExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= periodStart && expenseDate <= periodEnd;
      });
      
      const totalAmount = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      periods.push({ label, amount: totalAmount, date: periodDate });
    }
    
    return periods;
  }, [expenses, period]);

  const maxAmount = Math.max(...trendData.map(d => d.amount));
  const avgAmount = trendData.reduce((sum, d) => sum + d.amount, 0) / trendData.length;

  const getBarHeight = (amount: number) => {
    if (maxAmount === 0) return 0;
    return Math.max((amount / maxAmount) * 100, 2);
  };

  const getBarColor = (amount: number) => {
    if (amount > avgAmount * 1.2) return 'bg-red-500';
    if (amount > avgAmount) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const currentPeriod = trendData[trendData.length - 1];
  const previousPeriod = trendData[trendData.length - 2];
  const percentageChange = previousPeriod?.amount 
    ? ((currentPeriod?.amount - previousPeriod.amount) / previousPeriod.amount) * 100
    : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Expense Trends</h3>
        <div className="flex items-center space-x-2 text-sm">
          {percentageChange !== 0 && (
            <span className={`flex items-center ${
              percentageChange > 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {percentageChange > 0 ? (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {Math.abs(percentageChange).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {/* Chart */}
        <div className="flex items-end justify-between h-32 space-x-2">
          {trendData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${getBarColor(data.amount)}`}
                  style={{ height: `${getBarHeight(data.amount)}%` }}
                  title={`${data.label}: ${formatCurrency(data.amount)}`}
                  role="img"
                  aria-label={`${data.label}: ${formatCurrency(data.amount)}`}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-gray-500">
          {trendData.map((data, index) => (
            <span key={index} className="text-center flex-1">
              {data.label}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-500">Current {period}</p>
            <p className="font-semibold">{formatCurrency(currentPeriod?.amount || 0)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Average</p>
            <p className="font-semibold">{formatCurrency(avgAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Peak</p>
            <p className="font-semibold">{formatCurrency(maxAmount)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};