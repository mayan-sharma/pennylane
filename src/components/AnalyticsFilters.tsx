import React, { useState } from 'react';
import { ExpenseCategory } from '../types';
import { CalendarDaysIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterOptions {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  categories: ExpenseCategory[];
  amountRange: {
    min: number | null;
    max: number | null;
  };
  granularity: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface AnalyticsFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onExport: (format: 'csv' | 'pdf') => void;
}

export const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFiltersChange,
  onExport
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value ? new Date(value) : null
      }
    });
  };

  const handleCategoryToggle = (category: ExpenseCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({
      ...filters,
      categories: newCategories
    });
  };

  const handleAmountRangeChange = (field: 'min' | 'max', value: string) => {
    onFiltersChange({
      ...filters,
      amountRange: {
        ...filters.amountRange,
        [field]: value ? parseFloat(value) : null
      }
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      dateRange: { start: null, end: null },
      categories: [],
      amountRange: { min: null, max: null },
      granularity: 'monthly'
    });
  };

  const formatDateForInput = (date: Date | null) => {
    return date ? date.toISOString().split('T')[0] : '';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Analytics Filters</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onExport('csv')}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
          >
            CSV
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-800 border border-green-300 rounded-md hover:bg-green-50"
          >
            PDF
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            {isExpanded ? 'Hide' : 'More'} Filters
          </button>
        </div>
      </div>

      {/* Quick Filters - Always Visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <select
            value={filters.granularity}
            onChange={(e) => onFiltersChange({
              ...filters,
              granularity: e.target.value as FilterOptions['granularity']
            })}
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
            Start Date
          </label>
          <input
            type="date"
            value={formatDateForInput(filters.dateRange.start)}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={formatDateForInput(filters.dateRange.end)}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center"
          >
            <XMarkIcon className="w-4 h-4 mr-2" />
            Clear All
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* Category Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.values(ExpenseCategory).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                    filters.categories.includes(category)
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {filters.categories.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {filters.categories.length} category(s) selected
              </p>
            )}
          </div>

          {/* Amount Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="number"
                  placeholder="Min amount"
                  value={filters.amountRange.min || ''}
                  onChange={(e) => handleAmountRangeChange('min', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max amount"
                  value={filters.amountRange.max || ''}
                  onChange={(e) => handleAmountRangeChange('max', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Date Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Date Ranges
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Last 7 days', days: 7 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 3 months', days: 90 },
                { label: 'Last 6 months', days: 180 },
                { label: 'Last year', days: 365 }
              ].map(({ label, days }) => (
                <button
                  key={label}
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(end.getDate() - days);
                    onFiltersChange({
                      ...filters,
                      dateRange: { start, end }
                    });
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {(filters.dateRange.start || filters.dateRange.end || filters.categories.length > 0 || 
        filters.amountRange.min !== null || filters.amountRange.max !== null) && (
        <div className="bg-blue-50 rounded-md p-3 mt-4">
          <div className="flex items-center">
            <CalendarDaysIcon className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-800">Active Filters:</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2 text-sm text-blue-700">
            {filters.dateRange.start && (
              <span>From: {filters.dateRange.start.toLocaleDateString()}</span>
            )}
            {filters.dateRange.end && (
              <span>To: {filters.dateRange.end.toLocaleDateString()}</span>
            )}
            {filters.categories.length > 0 && (
              <span>Categories: {filters.categories.join(', ')}</span>
            )}
            {filters.amountRange.min && (
              <span>Min: ₹{filters.amountRange.min}</span>
            )}
            {filters.amountRange.max && (
              <span>Max: ₹{filters.amountRange.max}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};