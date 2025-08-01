import React, { useState, useEffect } from 'react';
import type { Budget, BudgetFormData, ExpenseCategory, CustomCategory } from '../../types';

interface BudgetFormProps {
  editingBudget: Budget | null;
  customCategories: CustomCategory[];
  onSubmit: (data: BudgetFormData) => void;
  onCancel: () => void;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  editingBudget,
  customCategories,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<BudgetFormData>({
    category: 'total',
    amount: '',
    period: 'monthly',
    type: 'standard',
    alertThresholds: [75, 90, 100],
    rolloverEnabled: false
  });

  useEffect(() => {
    if (editingBudget) {
      setFormData({
        category: editingBudget.category,
        amount: editingBudget.amount.toString(),
        period: editingBudget.period,
        type: editingBudget.type,
        alertThresholds: editingBudget.alertThresholds,
        rolloverEnabled: editingBudget.rolloverEnabled,
        targetDate: editingBudget.targetDate,
        description: editingBudget.description,
        autoAdjustSettings: editingBudget.autoAdjustSettings
      });
    } else {
      setFormData({
        category: 'total',
        amount: '',
        period: 'monthly',
        type: 'standard',
        alertThresholds: [75, 90, 100],
        rolloverEnabled: false
      });
    }
  }, [editingBudget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const categories = [
    'total',
    'Food',
    'Transport',
    'Bills',
    'Entertainment',
    'Shopping',
    'Healthcare',
    'Education',
    'Travel',
    'Housing',
    'Other',
    ...customCategories.map(cat => cat.name)
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingBudget ? 'Edit Budget' : 'Create New Budget'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'total' ? 'Total Budget' : category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter budget amount"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period
              </label>
              <select
                value={formData.period}
                onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="standard">Standard</option>
                <option value="savings">Savings Goal</option>
                <option value="envelope">Envelope Method</option>
                <option value="auto-adjusting">Auto-Adjusting</option>
              </select>
            </div>
          </div>

          {/* Optional Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add notes about this budget"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Date (Optional)
            </label>
            <input
              type="date"
              value={formData.targetDate || ''}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Alert Thresholds */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Thresholds (%)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {formData.alertThresholds.map((threshold, index) => (
                <input
                  key={index}
                  type="number"
                  min="0"
                  max="100"
                  value={threshold}
                  onChange={(e) => {
                    const newThresholds = [...formData.alertThresholds];
                    newThresholds[index] = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, alertThresholds: newThresholds });
                  }}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ))}
            </div>
          </div>

          {/* Rollover Setting */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rollover"
              checked={formData.rolloverEnabled}
              onChange={(e) => setFormData({ ...formData, rolloverEnabled: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="rollover" className="ml-2 text-sm text-gray-700">
              Enable rollover for unused budget
            </label>
          </div>

          {/* Auto-Adjust Settings */}
          {formData.type === 'auto-adjusting' && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="font-medium text-gray-900">Auto-Adjustment Settings</h3>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoAdjustEnabled"
                  checked={formData.autoAdjustSettings?.enabled || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    autoAdjustSettings: {
                      ...formData.autoAdjustSettings,
                      enabled: e.target.checked,
                      baselineMonths: formData.autoAdjustSettings?.baselineMonths || 3,
                      adjustmentFactor: formData.autoAdjustSettings?.adjustmentFactor || 0.1
                    }
                  })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoAdjustEnabled" className="ml-2 text-sm text-gray-700">
                  Enable automatic budget adjustments
                </label>
              </div>

              {formData.autoAdjustSettings?.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Baseline Months
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={formData.autoAdjustSettings?.baselineMonths || 3}
                      onChange={(e) => setFormData({
                        ...formData,
                        autoAdjustSettings: {
                          ...formData.autoAdjustSettings!,
                          baselineMonths: parseInt(e.target.value) || 3
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adjustment Factor
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.autoAdjustSettings?.adjustmentFactor || 0.1}
                      onChange={(e) => setFormData({
                        ...formData,
                        autoAdjustSettings: {
                          ...formData.autoAdjustSettings!,
                          adjustmentFactor: parseFloat(e.target.value) || 0.1
                        }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              {editingBudget ? 'Update Budget' : 'Create Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};