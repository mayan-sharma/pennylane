import React, { useState } from 'react';
import type { Expense, ExpenseStats, BudgetStatus } from '../types';
import { exportToCSV, exportToJSON, generatePDFReport } from '../utils/exportUtils';
import { getAnalyticsData } from '../utils/analyticsUtils';

interface ExportMenuProps {
  expenses: Expense[];
  stats: ExpenseStats;
  budgetStatuses?: BudgetStatus[];
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ 
  expenses, 
  stats 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'csv' | 'json' | 'pdf' | null>(null);

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    setIsExporting(true);
    setExportType(format);

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (format) {
        case 'csv':
          exportToCSV(expenses, `expense-report-${timestamp}.csv`);
          break;
        case 'json':
          exportToJSON(expenses, `expense-data-${timestamp}.json`);
          break;
        case 'pdf': {
          const analyticsData = getAnalyticsData(expenses);
          await generatePDFReport(analyticsData, expenses);
          break;
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportType(null);
      setIsOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getExportSummary = () => {
    return {
      totalExpenses: expenses.length,
      totalAmount: stats.total,
      dateRange: expenses.length > 0 ? {
        from: new Date(Math.min(...expenses.map(e => new Date(e.date).getTime()))).toLocaleDateString('en-IN'),
        to: new Date(Math.max(...expenses.map(e => new Date(e.date).getTime()))).toLocaleDateString('en-IN')
      } : null
    };
  };

  const summary = getExportSummary();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        aria-label="Export options"
        disabled={expenses.length === 0}
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm font-medium text-gray-700">Export</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Export Expense Data</h4>
            
            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Transactions:</span>
                  <span className="font-medium ml-1">{summary.totalExpenses}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="font-medium ml-1">{formatCurrency(summary.totalAmount)}</span>
                </div>
                {summary.dateRange && (
                  <>
                    <div className="col-span-2">
                      <span className="text-gray-500">Period:</span>
                      <span className="font-medium ml-1">{summary.dateRange.from} - {summary.dateRange.to}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="space-y-2">
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">CSV Spreadsheet</div>
                    <div className="text-xs text-gray-500">Excel-compatible format</div>
                  </div>
                </div>
                {isExporting && exportType === 'csv' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                )}
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">PDF Report</div>
                    <div className="text-xs text-gray-500">Detailed analytics report</div>
                  </div>
                </div>
                {isExporting && exportType === 'pdf' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                )}
              </button>

              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">JSON Data</div>
                    <div className="text-xs text-gray-500">Raw data format</div>
                  </div>
                </div>
                {isExporting && exportType === 'json' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};