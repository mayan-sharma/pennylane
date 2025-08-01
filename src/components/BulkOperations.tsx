import React, { useState } from 'react';
import { type Expense } from '../types';

interface BulkOperationsProps {
  selectedExpenses: string[];
  allExpenses: Expense[];
  onBulkDelete: (expenseIds: string[]) => void;
  onBulkCategorize: (expenseIds: string[], category: string) => void;
  onClearSelection: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedExpenses,
  allExpenses,
  onBulkDelete,
  onBulkCategorize,
  onClearSelection
}) => {
  const [showActions, setShowActions] = useState(false);

  if (selectedExpenses.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blue-800">
          {selectedExpenses.length} expense{selectedExpenses.length !== 1 ? 's' : ''} selected
        </span>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowActions(!showActions)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Actions
          </button>
          <button
            onClick={onClearSelection}
            className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
          >
            Clear
          </button>
        </div>
      </div>

      {showActions && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedExpenses.length} selected expenses?`)) {
                onBulkDelete(selectedExpenses);
              }
            }}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
          >
            Delete Selected
          </button>
          <select
            onChange={(e) => {
              if (e.target.value) {
                onBulkCategorize(selectedExpenses, e.target.value);
                e.target.value = '';
              }
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Change Category...</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Bills">Bills</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Shopping">Shopping</option>
            <option value="Other">Other</option>
          </select>
        </div>
      )}
    </div>
  );
};