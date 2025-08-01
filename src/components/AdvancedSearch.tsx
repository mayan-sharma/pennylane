import React, { useState } from 'react';
import { type AdvancedFilters, ExpenseCategory } from '../types';

interface AdvancedSearchProps {
  filters: AdvancedFilters;
  onFiltersChange: (filters: AdvancedFilters) => void;
  availableCategories?: string[];
  availableMerchants?: string[];
  availableTags?: string[];
  onClearFilters: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  filters,
  onFiltersChange,
  availableCategories = [],
  availableMerchants = [],
  availableTags = [],
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempFilters, setTempFilters] = useState<AdvancedFilters>(filters);

  const handleFilterChange = (key: keyof AdvancedFilters, value: any) => {
    const newFilters = { ...tempFilters, [key]: value };
    setTempFilters(newFilters);
  };

  const handleMultiSelectChange = (key: keyof AdvancedFilters, value: string, checked: boolean) => {
    const currentArray = (tempFilters[key] as string[]) || [];
    const newArray = checked 
      ? [...currentArray, value]
      : currentArray.filter(item => item !== value);
    
    handleFilterChange(key, newArray.length > 0 ? newArray : undefined);
  };

  const applyFilters = () => {
    onFiltersChange(tempFilters);
  };

  const clearFilters = () => {
    setTempFilters({});
    onClearFilters();
  };

  const activeFiltersCount = Object.values(tempFilters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== '';
  }).length;

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      {/* Search Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 min-w-64">
              <input
                type="text"
                placeholder="Search expenses..."
                value={tempFilters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`px-4 py-2 rounded-md border transition-colors ${
                isExpanded 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              Advanced
              {activeFiltersCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs bg-white text-blue-600 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          {/* Date Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Date Range</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input
                  type="date"
                  value={tempFilters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input
                  type="date"
                  value={tempFilters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Amount Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Amount Range</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tempFilters.amountMin || ''}
                  onChange={(e) => handleFilterChange('amountMin', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tempFilters.amountMax || ''}
                  onChange={(e) => handleFilterChange('amountMax', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="999999.99"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Categories</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.values(ExpenseCategory).concat(availableCategories).map((category) => {
                const isSelected = tempFilters.categories?.includes(category) || false;
                return (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleMultiSelectChange('categories', category, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Payment Methods</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {['cash', 'card', 'bank_transfer', 'digital_wallet', 'other'].map((method) => {
                const isSelected = tempFilters.paymentMethods?.includes(method) || false;
                const displayName = method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                return (
                  <label key={method} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleMultiSelectChange('paymentMethods', method, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{displayName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Merchants */}
          {availableMerchants.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Merchants</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                {availableMerchants.map((merchant) => {
                  const isSelected = tempFilters.merchants?.includes(merchant) || false;
                  return (
                    <label key={merchant} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleMultiSelectChange('merchants', merchant, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 truncate">{merchant}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {availableTags.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const isSelected = tempFilters.tags?.includes(tag) || false;
                  return (
                    <label
                      key={tag}
                      className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleMultiSelectChange('tags', tag, e.target.checked)}
                        className="sr-only"
                      />
                      #{tag}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Filters */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Additional Filters</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempFilters.hasReceipts || false}
                  onChange={(e) => handleFilterChange('hasReceipts', e.target.checked || undefined)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Has receipts</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tempFilters.isRecurring || false}
                  onChange={(e) => handleFilterChange('isRecurring', e.target.checked || undefined)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Recurring expenses</span>
              </label>
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Quick Filters</h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  handleFilterChange('dateFrom', thisWeek.toISOString().split('T')[0]);
                  handleFilterChange('dateTo', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Last 7 days
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                  handleFilterChange('dateFrom', thisMonth.toISOString().split('T')[0]);
                  handleFilterChange('dateTo', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                This month
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                  handleFilterChange('dateFrom', lastMonth.toISOString().split('T')[0]);
                  handleFilterChange('dateTo', lastMonthEnd.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Last month
              </button>
              <button
                onClick={() => {
                  handleFilterChange('amountMin', 1000);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
              >
                Large expenses (₹1000+)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};