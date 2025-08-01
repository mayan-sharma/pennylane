import React, { useState } from 'react';
import { type Expense, type ExpenseStats, type BudgetStatus } from '../types';

interface ExportMenuProps {
  expenses: Expense[];
  stats: ExpenseStats;
  budgetStatuses: BudgetStatus[];
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  expenses,
  stats,
  budgetStatuses
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'csv' | 'pdf' | 'json') => {
    console.log(`Exporting as ${format}...`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200"
      >
        Export
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
          <div className="py-1">
            <button
              onClick={() => handleExport('csv')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Export as PDF
            </button>
            <button
              onClick={() => handleExport('json')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Export as JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};