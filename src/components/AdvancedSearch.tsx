import React, { useState } from 'react';
import { type AdvancedFilters, ExpenseCategory } from '../types';

interface AdvancedSearchProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof AdvancedFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
      >
        <span>Advanced Search</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.amountMin || ''}
                  onChange={(e) => handleFilterChange('amountMin', parseFloat(e.target.value) || undefined)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.amountMax || ''}
                  onChange={(e) => handleFilterChange('amountMax', parseFloat(e.target.value) || undefined)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categories
              </label>
              <select
                multiple
                value={filters.categories || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  handleFilterChange('categories', values);
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                size={4}
              >
                {Object.values(ExpenseCategory).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => {
                  onFiltersChange({});
                  setIsOpen(false);
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};