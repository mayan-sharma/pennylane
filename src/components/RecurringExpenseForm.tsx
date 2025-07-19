import React, { useState } from 'react';
import { type RecurringExpense, ExpenseCategory, type Expense } from '../types/expense';

interface RecurringExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (recurringData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'generatedExpenses'>) => void;
  initialData?: Partial<RecurringExpense>;
}

export const RecurringExpenseForm: React.FC<RecurringExpenseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [formData, setFormData] = useState({
    amount: initialData?.templateExpense?.amount?.toString() || '',
    category: initialData?.templateExpense?.category || ExpenseCategory.OTHER,
    description: initialData?.templateExpense?.description || '',
    merchant: initialData?.templateExpense?.merchant || '',
    frequency: initialData?.frequency || 'monthly' as const,
    interval: initialData?.interval?.toString() || '1',
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
    endDate: initialData?.endDate || '',
    reminderDays: initialData?.reminderDays?.toString() || '1',
    autoGenerate: initialData?.autoGenerate ?? true,
    paymentMethod: initialData?.templateExpense?.paymentMethod || 'card' as const,
    notes: initialData?.templateExpense?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (parseInt(formData.interval) < 1) {
      newErrors.interval = 'Interval must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const templateExpense: Omit<Expense, 'id' | 'date' | 'createdAt' | 'updatedAt' | 'recurringExpenseId'> = {
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      merchant: formData.merchant || undefined,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined,
      currency: 'INR',
    };

    // Calculate next due date
    const startDate = new Date(formData.startDate);
    let nextDueDate = new Date(startDate);
    
    // If start date is in the past, calculate the next occurrence
    const today = new Date();
    if (startDate < today) {
      const diffTime = today.getTime() - startDate.getTime();
      const interval = parseInt(formData.interval);
      
      let intervalMs: number;
      switch (formData.frequency) {
        case 'daily':
          intervalMs = interval * 24 * 60 * 60 * 1000;
          break;
        case 'weekly':
          intervalMs = interval * 7 * 24 * 60 * 60 * 1000;
          break;
        case 'monthly':
          // Approximate - will be calculated more precisely in the hook
          intervalMs = interval * 30 * 24 * 60 * 60 * 1000;
          break;
        case 'yearly':
          intervalMs = interval * 365 * 24 * 60 * 60 * 1000;
          break;
        default:
          intervalMs = 30 * 24 * 60 * 60 * 1000;
      }
      
      const periods = Math.ceil(diffTime / intervalMs);
      nextDueDate = new Date(startDate.getTime() + periods * intervalMs);
    }

    const recurringData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'generatedExpenses'> = {
      templateExpense,
      frequency: formData.frequency,
      interval: parseInt(formData.interval),
      startDate: formData.startDate,
      endDate: formData.endDate || undefined,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      isActive: true,
      reminderDays: parseInt(formData.reminderDays),
      autoGenerate: formData.autoGenerate,
    };

    onSubmit(recurringData);
    onClose();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(ExpenseCategory).map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Monthly Netflix subscription"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Merchant
            </label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => handleInputChange('merchant', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Netflix"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => handleInputChange('frequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Every
              </label>
              <input
                type="number"
                min="1"
                value={formData.interval}
                onChange={(e) => handleInputChange('interval', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.interval ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.interval && <p className="text-red-500 text-xs mt-1">{errors.interval}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="digital_wallet">Digital Wallet</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reminder (days before)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={formData.reminderDays}
              onChange={(e) => handleInputChange('reminderDays', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoGenerate"
              checked={formData.autoGenerate}
              onChange={(e) => handleInputChange('autoGenerate', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoGenerate" className="ml-2 block text-sm text-gray-700">
              Automatically generate expenses
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              {initialData ? 'Update' : 'Create'} Recurring Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};