import React from 'react';
import { type Expense } from '../types';

interface PDFExporterProps {
  expenses: Expense[];
  onExport: () => void;
  isExporting?: boolean;
}

export const PDFExporter: React.FC<PDFExporterProps> = ({
  expenses,
  onExport,
  isExporting = false
}) => {
  return (
    <button
      onClick={onExport}
      disabled={isExporting || expenses.length === 0}
      className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span>
        {isExporting ? 'Exporting...' : 'Export PDF'}
      </span>
    </button>
  );
};