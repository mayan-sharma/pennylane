import React, { useState } from 'react';
import { ExpenseCategory, type Budget, type BudgetFormData, type BudgetStatus } from '../types/expense';

interface BudgetManagementProps {
  budgetStatuses: BudgetStatus[];
  onAddBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBudget: (id: string, updates: Partial<Budget>) => void;
  onDeleteBudget: (id: string) => void;
}

export const BudgetManagement: React.FC<BudgetManagementProps> = ({
  budgetStatuses,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    category: 'total',
    amount: '',
    period: 'monthly',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBudget) {
      onUpdateBudget(editingBudget.id, {
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
      });
    } else {
      onAddBudget({
        category: formData.category,
        amount: parseFloat(formData.amount),
        period: formData.period,
      });
    }
    
    handleFormCancel();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({
      category: 'total',
      amount: '',
      period: 'monthly',
    });
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      onDeleteBudget(id);
    }
  };

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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Budget Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Add Budget
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingBudget ? 'Edit Budget' : 'Add New Budget'}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory | 'total' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="total">Total (All Categories)</option>
                  {Object.values(ExpenseCategory).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Period
                </label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value as 'monthly' | 'weekly' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingBudget ? 'Update Budget' : 'Add Budget'}
                </button>
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {budgetStatuses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No budgets set. Click "Add Budget" to get started.
          </div>
        ) : (
          budgetStatuses.map((status) => (
            <div key={status.budget.id} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {status.budget.category === 'total' ? 'Total Budget' : status.budget.category}
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">
                    {status.budget.period} • {formatCurrency(status.budget.amount)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(status.budget)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(status.budget.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Spent: {formatCurrency(status.spent)}</span>
                  <span>Remaining: {formatCurrency(Math.max(0, status.remaining))}</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(status.percentUsed, status.isOverBudget)}`}
                    style={{ width: `${Math.min(100, status.percentUsed)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {status.percentUsed.toFixed(1)}% used
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.percentUsed, status.isOverBudget)}`}>
                    {status.isOverBudget ? 'Over Budget' : 
                     status.percentUsed >= 90 ? 'Critical' :
                     status.percentUsed >= 75 ? 'Warning' : 'On Track'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};