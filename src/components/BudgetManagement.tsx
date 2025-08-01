import React, { useState } from 'react';
import { ExpenseCategory, type Budget, type BudgetFormData, type BudgetStatus, type BudgetTemplate, type CustomCategory } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getProgressBarColor } from '../utils/colors';
import type { BudgetAnalytics as BudgetAnalyticsType, Expense } from '../types';

interface BudgetManagementProps {
  budgetStatuses: BudgetStatus[];
  budgetTemplates: BudgetTemplate[];
  customCategories: CustomCategory[];
  analytics: BudgetAnalyticsType;
  expenses: Expense[];
  onAddBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBudget: (id: string, updates: Partial<Budget>) => void;
  onDeleteBudget: (id: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onCreateTemplate: (template: Omit<BudgetTemplate, 'id'>) => void;
  onAddCustomCategory: (category: Omit<CustomCategory, 'id'>) => void;
  onExportData: () => void;
  onBulkOperation: (operation: 'delete' | 'adjust', budgetIds: string[], adjustment?: number) => void;
}

export const BudgetManagement: React.FC<BudgetManagementProps> = ({
  budgetStatuses,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetStatus | null>(null);

  const handleAddBudget = () => {
    setEditingBudget(null);
    setShowForm(true);
  };

  const handleEditBudget = (budget: BudgetStatus) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleFormSubmit = (data: BudgetFormData) => {
    const budgetData = {
      ...data,
      amount: parseFloat(data.amount),
      type: data.type || 'standard' as const,
      alertThresholds: data.alertThresholds || [],
      rolloverEnabled: data.rolloverEnabled || false
    };
    
    if (editingBudget) {
      onUpdateBudget(editingBudget.budget.id, budgetData);
    } else {
      onAddBudget(budgetData);
    }
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
        <button
          onClick={handleAddBudget}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Budget
        </button>
      </div>

      <div className="grid gap-4">
        {budgetStatuses.map((budgetStatus) => (
          <div key={budgetStatus.budget.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-lg">{budgetStatus.budget.category}</h3>
                <p className="text-gray-600">
                  {formatCurrency(budgetStatus.spent)} of {formatCurrency(budgetStatus.budget.amount)}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditBudget(budgetStatus)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteBudget(budgetStatus.budget.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressBarColor(budgetStatus.percentUsed)}`}
                style={{ width: `${Math.min(budgetStatus.percentUsed, 100)}%` }}
              ></div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {budgetStatus.percentUsed.toFixed(1)}% used
              {budgetStatus.daysRemaining > 0 && (
                <span className="ml-2">• {budgetStatus.daysRemaining} days remaining</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">
              {editingBudget ? 'Edit Budget' : 'Add Budget'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleFormSubmit({
                  category: formData.get('category') as ExpenseCategory,
                  amount: formData.get('amount') as string,
                  period: 'monthly',
                  type: 'standard',
                  alertThresholds: [],
                  rolloverEnabled: false
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    defaultValue={editingBudget?.budget.category || ''}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select category</option>
                    {Object.values(ExpenseCategory).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={editingBudget?.budget.amount || ''}
                    step="0.01"
                    min="0"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingBudget ? 'Update' : 'Add'} Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};