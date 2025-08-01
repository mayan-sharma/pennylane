import React, { useState } from 'react';
import { type Expense, type ExpenseStats } from '../types';

interface PDFExporterProps {
  expenses: Expense[];
  stats: ExpenseStats;
  onExport: (options: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  format: 'pdf' | 'csv' | 'json' | 'excel';
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includeStatistics: boolean;
  includeCategoryBreakdown: boolean;
  includeReceiptImages: boolean;
  groupBy: 'date' | 'category' | 'merchant' | 'none';
  sortBy: 'date' | 'amount' | 'category';
  sortOrder: 'asc' | 'desc';
  customFields: string[];
}

export const PDFExporter: React.FC<PDFExporterProps> = ({
  expenses,
  stats,
  onExport
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    includeCharts: true,
    includeStatistics: true,
    includeCategoryBreakdown: true,
    includeReceiptImages: false,
    groupBy: 'date',
    sortBy: 'date',
    sortOrder: 'desc',
    customFields: [],
  });

  const availableFields = [
    'date', 'amount', 'category', 'description', 'merchant', 
    'paymentMethod', 'tags', 'notes', 'currency', 'receipts'
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(exportOptions);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  };

  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const startDate = new Date(exportOptions.dateRange.start);
    const endDate = new Date(exportOptions.dateRange.end);
    return expenseDate >= startDate && expenseDate <= endDate;
  });

  const previewData = {
    totalExpenses: filteredExpenses.length,
    totalAmount: filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0),
    dateRange: `${exportOptions.dateRange.start} to ${exportOptions.dateRange.end}`,
    categories: [...new Set(filteredExpenses.map(exp => exp.category))].length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export Expenses</h3>
          <p className="text-sm text-gray-600">
            Generate detailed reports of your expenses in various formats
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export Options */}
        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'pdf', label: 'PDF Report', icon: '📄', desc: 'Detailed report with charts' },
                { key: 'csv', label: 'CSV File', icon: '📊', desc: 'Spreadsheet compatible' },
                { key: 'json', label: 'JSON Data', icon: '🔧', desc: 'Raw data format' },
                { key: 'excel', label: 'Excel File', icon: '📈', desc: 'Advanced spreadsheet' },
              ].map((format) => (
                <button
                  key={format.key}
                  onClick={() => updateExportOptions({ format: format.key as any })}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    exportOptions.format === format.key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{format.icon}</span>
                    <span className="font-medium text-sm">{format.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{format.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={exportOptions.dateRange.start}
                  onChange={(e) => updateExportOptions({
                    dateRange: { ...exportOptions.dateRange, start: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={exportOptions.dateRange.end}
                  onChange={(e) => updateExportOptions({
                    dateRange: { ...exportOptions.dateRange, end: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Quick date range buttons */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[
                { label: 'This Month', days: 30 },
                { label: 'Last 3 Months', days: 90 },
                { label: 'This Year', days: 365 },
                { label: 'All Time', days: 0 },
              ].map((range) => (
                <button
                  key={range.label}
                  onClick={() => {
                    const end = new Date().toISOString().split('T')[0];
                    const start = range.days === 0 
                      ? new Date(Math.min(...expenses.map(e => new Date(e.date).getTime()))).toISOString().split('T')[0]
                      : new Date(Date.now() - range.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    updateExportOptions({ dateRange: { start, end } });
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Options (PDF only) */}
          {exportOptions.format === 'pdf' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Include in Report
              </label>
              <div className="space-y-2">
                {[
                  { key: 'includeCharts', label: 'Charts and Graphs', desc: 'Visual spending analysis' },
                  { key: 'includeStatistics', label: 'Summary Statistics', desc: 'Key metrics and totals' },
                  { key: 'includeCategoryBreakdown', label: 'Category Breakdown', desc: 'Spending by category' },
                  { key: 'includeReceiptImages', label: 'Receipt Images', desc: 'Attached receipt photos' },
                ].map((option) => (
                  <label key={option.key} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                      onChange={(e) => updateExportOptions({ [option.key]: e.target.checked })}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-700">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Organization Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group By
              </label>
              <select
                value={exportOptions.groupBy}
                onChange={(e) => updateExportOptions({ groupBy: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">No Grouping</option>
                <option value="date">Date</option>
                <option value="category">Category</option>
                <option value="merchant">Merchant</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={exportOptions.sortBy}
                  onChange={(e) => updateExportOptions({ sortBy: e.target.value as any })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                </select>
                <select
                  value={exportOptions.sortOrder}
                  onChange={(e) => updateExportOptions({ sortOrder: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>

          {/* Custom Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Include Fields
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableFields.map((field) => (
                <label key={field} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportOptions.customFields.includes(field)}
                    onChange={(e) => {
                      const newFields = e.target.checked
                        ? [...exportOptions.customFields, field]
                        : exportOptions.customFields.filter(f => f !== field);
                      updateExportOptions({ customFields: newFields });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-medium text-gray-900 mb-4">Export Preview</h4>
            
            {/* Preview Stats */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Expenses:</span>
                <span className="font-medium">{previewData.totalExpenses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Amount:</span>
                <span className="font-medium">₹{previewData.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date Range:</span>
                <span className="font-medium text-xs">{previewData.dateRange}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Categories:</span>
                <span className="font-medium">{previewData.categories}</span>
              </div>
            </div>

            {/* Sample Preview */}
            <div className="mt-4 border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h5 className="text-sm font-medium text-gray-700">Sample Data</h5>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Category</th>
                      <th className="px-3 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredExpenses.slice(0, 5).map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-3 py-2">{expense.date}</td>
                        <td className="px-3 py-2">₹{expense.amount.toFixed(2)}</td>
                        <td className="px-3 py-2">{expense.category}</td>
                        <td className="px-3 py-2 truncate max-w-32">{expense.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredExpenses.length > 5 && (
                  <div className="px-3 py-2 text-center text-gray-500 text-xs">
                    ... and {filteredExpenses.length - 5} more expenses
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={isExporting || filteredExpenses.length === 0}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating {exportOptions.format.toUpperCase()}...</span>
              </div>
            ) : (
              `Export ${filteredExpenses.length} Expenses as ${exportOptions.format.toUpperCase()}`
            )}
          </button>

          {filteredExpenses.length === 0 && (
            <p className="text-sm text-red-600 text-center">
              No expenses found in the selected date range
            </p>
          )}
        </div>
      </div>

      {/* Export Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="text-sm font-medium text-blue-800">Export Information</h5>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• PDF reports include charts, statistics, and formatted tables</li>
              <li>• CSV files can be opened in Excel, Google Sheets, or other spreadsheet apps</li>
              <li>• JSON format provides raw data for developers and advanced users</li>
              <li>• All exports respect your selected date range and filters</li>
              <li>• Receipt images are embedded in PDF reports when selected</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};