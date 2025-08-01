import React, { useState, useEffect, useRef } from 'react';
import { type Expense, ExpenseCategory } from '../types';

interface InlineExpenseEditorProps {
  expense: Expense;
  onSave: (id: string, updates: Partial<Expense>) => void;
  onCancel: () => void;
  availableCategories?: string[];
}

export const InlineExpenseEditor: React.FC<InlineExpenseEditorProps> = ({
  expense,
  onSave,
  onCancel,
  availableCategories = []
}) => {
  const [formData, setFormData] = useState({
    date: expense.date,
    amount: expense.amount.toString(),
    category: expense.category,
    description: expense.description,
    merchant: expense.merchant || '',
    paymentMethod: expense.paymentMethod || 'card',
    notes: expense.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Focus first input when component mounts
  useEffect(() => {
    firstInputRef.current?.focus();
    firstInputRef.current?.select();
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const updates: Partial<Expense> = {
      date: formData.date,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description.trim(),
      merchant: formData.merchant.trim() || undefined,
      paymentMethod: formData.paymentMethod as any,
      notes: formData.notes.trim() || undefined,
    };

    onSave(expense.id, updates);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const allCategories = [...Object.values(ExpenseCategory), ...availableCategories];

  return (
    <tr className="bg-blue-50 border-l-4 border-blue-500">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={false}
            disabled
            className="h-4 w-4 text-blue-600 border-gray-300 rounded opacity-50"
          />
        </div>
      </td>
      
      <td className="px-6 py-4">
        <input
          ref={firstInputRef}
          type="date"
          value={formData.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
          className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.date ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
      </td>
      
      <td className="px-6 py-4">
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={(e) => handleInputChange('amount', e.target.value)}
          className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.amount ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="0.00"
        />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
      </td>
      
      <td className="px-6 py-4">
        <select
          value={formData.category}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {allCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </td>
      
      <td className="px-6 py-4">
        <input
          type="text"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className={`w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Description"
        />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
      </td>
      
      <td className="px-6 py-4">
        <input
          type="text"
          value={formData.merchant}
          onChange={(e) => handleInputChange('merchant', e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Merchant"
        />
      </td>
      
      <td className="px-6 py-4">
        <select
          value={formData.paymentMethod}
          onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="digital_wallet">Digital Wallet</option>
          <option value="other">Other</option>
        </select>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSave}
            className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
            title="Save (Ctrl+Enter)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={onCancel}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Cancel (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};