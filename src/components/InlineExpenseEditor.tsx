import React, { useState } from 'react';
import { type Expense, ExpenseCategory } from '../types';

interface InlineExpenseEditorProps {
  expense: Expense;
  onSave: (expense: Expense) => void;
  onCancel: () => void;
}

export const InlineExpenseEditor: React.FC<InlineExpenseEditorProps> = ({
  expense,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    description: expense.description,
    amount: expense.amount.toString(),
    category: expense.category,
    date: expense.date
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...expense,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      updatedAt: new Date().toISOString()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-3 rounded-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description"
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          required
        />
        
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          placeholder="Amount"
          step="0.01"
          min="0"
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          required
        />
        
        <select
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
        >
          {Object.values(ExpenseCategory).map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm"
          required
        />
      </div>
      
      <div className="flex justify-end space-x-2 mt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
};