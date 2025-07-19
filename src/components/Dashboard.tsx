import React from 'react';
import { ExpenseCategory, type ExpenseStats, type Expense, type BudgetStatus } from "../types/expense"
import { BudgetAlerts } from './BudgetAlerts';

interface DashboardProps {
  stats: ExpenseStats;
  recentExpenses: Expense[];
  budgetStatuses?: BudgetStatus[];
  onAddExpense: () => void;
  onDismissAlert?: (alertId: string) => void;
  onSnoozeAlert?: (alertId: string, hours: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentExpenses,
  budgetStatuses = [],
  onAddExpense,
  onDismissAlert,
  onSnoozeAlert
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getCategoryColor = (category: ExpenseCategory) => {
    const colors = {
      [ExpenseCategory.FOOD]: 'bg-orange-100 text-orange-800',
      [ExpenseCategory.TRANSPORT]: 'bg-blue-100 text-blue-800',
      [ExpenseCategory.BILLS]: 'bg-red-100 text-red-800',
      [ExpenseCategory.ENTERTAINMENT]: 'bg-purple-100 text-purple-800',
      [ExpenseCategory.SHOPPING]: 'bg-pink-100 text-pink-800',
      [ExpenseCategory.HEALTHCARE]: 'bg-green-100 text-green-800',
      [ExpenseCategory.EDUCATION]: 'bg-indigo-100 text-indigo-800',
      [ExpenseCategory.TRAVEL]: 'bg-teal-100 text-teal-800',
      [ExpenseCategory.HOUSING]: 'bg-yellow-100 text-yellow-800',
      [ExpenseCategory.OTHER]: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors[ExpenseCategory.OTHER];
  };

  const topCategories = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={onAddExpense}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Add new expense"
        >
          + Add Expense
        </button>
      </div>

      <BudgetAlerts 
        budgetStatuses={budgetStatuses}
        onDismiss={onDismissAlert}
        onSnooze={onSnoozeAlert}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">This Month</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.thisMonth)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">This Week</h3>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.thisWeek)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Count</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.count}</p>
            </div>
          </div>
        </div>
      </div>

      {budgetStatuses.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Budget Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetStatuses.slice(0, 6).map((status) => (
              <div key={status.budget.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {status.budget.category === 'total' ? 'Total' : status.budget.category}
                  </span>
                  <span className="text-gray-500 capitalize">{status.budget.period}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      status.isOverBudget ? 'bg-red-500' :
                      status.percentUsed >= 90 ? 'bg-orange-500' :
                      status.percentUsed >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, status.percentUsed)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>{formatCurrency(status.spent)} spent</span>
                  <span>{formatCurrency(status.budget.amount)} budget</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Top Categories</h3>
          <div className="space-y-3">
            {topCategories.length === 0 ? (
              <p className="text-gray-500">No expenses yet</p>
            ) : (
              topCategories.map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(category as ExpenseCategory)}`}>
                      {category}
                    </span>
                  </div>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentExpenses.length === 0 ? (
              <p className="text-gray-500">No recent expenses</p>
            ) : (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {expense.description || 'No description'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(expense.date)} • {expense.category}
                    </p>
                  </div>
                  <span className="font-medium">{formatCurrency(expense.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};