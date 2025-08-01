import React, { useState } from 'react';
import type { Budget, BudgetStatus } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BudgetOverviewProps {
  budgetStatuses: BudgetStatus[];
  selectedBudgets: Set<string>;
  onBudgetSelect: (budgetId: string) => void;
  onEditBudget: (budget: Budget) => void;
  onDeleteBudget: (id: string) => void;
  onBulkDelete: () => void;
  onBulkAdjust: (percentage: number) => void;
  showBulkActions: boolean;
  setShowBulkActions: (show: boolean) => void;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  budgetStatuses,
  selectedBudgets,
  onBudgetSelect,
  onEditBudget,
  onDeleteBudget,
  onBulkDelete,
  onBulkAdjust,
  showBulkActions,
  setShowBulkActions
}) => {

  const getProgressBarColor = (percentUsed: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    if (percentUsed >= 90) return 'bg-orange-500';
    if (percentUsed >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (percentUsed: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'text-red-600 bg-red-50';
    if (percentUsed >= 90) return 'text-orange-600 bg-orange-50';
    if (percentUsed >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Budget Overview</h2>
        <div className="flex gap-2">
          {selectedBudgets.size > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
            >
              Bulk Actions ({selectedBudgets.size})
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && selectedBudgets.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedBudgets.size} budgets selected
            </span>
            <button
              onClick={onBulkDelete}
              className="px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
            >
              Delete All
            </button>
            <button
              onClick={() => onBulkAdjust(10)}
              className="px-3 py-1 text-sm text-green-600 bg-green-50 border border-green-200 rounded hover:bg-green-100"
            >
              +10%
            </button>
            <button
              onClick={() => onBulkAdjust(-10)}
              className="px-3 py-1 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100"
            >
              -10%
            </button>
          </div>
        </div>
      )}

      {/* Budget Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgetStatuses.map((status) => (
          <div
            key={status.budget.id}
            className={`p-6 bg-white rounded-lg border-2 transition-all duration-200 ${
              selectedBudgets.has(status.budget.id)
                ? 'border-blue-500 shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Selection Checkbox */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedBudgets.has(status.budget.id)}
                  onChange={() => onBudgetSelect(status.budget.id)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {status.budget.category === 'total' ? 'Total Budget' : status.budget.category}
                  </h3>
                  <p className="text-sm text-gray-500">{status.budget.period}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.percentUsed, status.isOverBudget)}`}>
                {status.isOverBudget ? 'Over Budget' : `${Math.round(status.percentUsed)}% Used`}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Spent: {formatCurrency(status.spent)}</span>
                <span>Budget: {formatCurrency(status.budget.amount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(status.percentUsed, status.isOverBudget)}`}
                  style={{ width: `${Math.min(status.percentUsed, 100)}%` }}
                />
              </div>
              {status.isOverBudget && (
                <div className="mt-1 text-xs text-red-600">
                  Over by {formatCurrency(Math.abs(status.remaining))}
                </div>
              )}
            </div>

            {/* Budget Details */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Remaining:</span>
                <span className={status.remaining < 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(status.remaining)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Days left:</span>
                <span>{status.daysRemaining}</span>
              </div>
              <div className="flex justify-between">
                <span>Daily avg:</span>
                <span>{formatCurrency(status.averageDailySpending)}</span>
              </div>
              <div className="flex justify-between">
                <span>Trend:</span>
                <span className={
                  status.trend === 'increasing' ? 'text-red-600' :
                  status.trend === 'decreasing' ? 'text-green-600' :
                  'text-gray-600'
                }>
                  {status.trend}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => onEditBudget(status.budget)}
                className="flex-1 px-3 py-1 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteBudget(status.budget.id)}
                className="flex-1 px-3 py-1 text-sm text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {budgetStatuses.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No budgets created yet. Create your first budget to get started!</p>
        </div>
      )}
    </div>
  );
};