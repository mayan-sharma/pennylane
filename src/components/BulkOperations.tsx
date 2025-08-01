import React, { useState, useRef } from 'react';
import { type Expense, type ExpenseImportData, type BulkOperationResult } from '../types';

interface BulkOperationsProps {
  selectedExpenses: string[];
  onBulkDelete: (expenseIds: string[]) => BulkOperationResult;
  onBulkEdit: (expenseIds: string[], updates: Partial<Expense>) => BulkOperationResult;
  onImportCSV: (csvData: ExpenseImportData[]) => BulkOperationResult;
  onClearSelection: () => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
  selectedExpenses,
  onBulkDelete,
  onBulkEdit,
  onImportCSV,
  onClearSelection
}) => {
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importResult, setImportResult] = useState<BulkOperationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [bulkEditData, setBulkEditData] = useState({
    category: '',
    merchant: '',
    paymentMethod: '',
    tags: '',
  });

  const handleBulkDelete = () => {
    if (selectedExpenses.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} selected expenses?`)) {
      const result = onBulkDelete(selectedExpenses);
      
      if (result.success > 0) {
        alert(`Successfully deleted ${result.success} expenses`);
        onClearSelection();
      }
      
      if (result.failed > 0) {
        alert(`Failed to delete ${result.failed} expenses`);
      }
    }
  };

  const handleBulkEdit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedExpenses.length === 0) return;

    const updates: Partial<Expense> = {};
    
    if (bulkEditData.category) updates.category = bulkEditData.category;
    if (bulkEditData.merchant) updates.merchant = bulkEditData.merchant;
    if (bulkEditData.paymentMethod) updates.paymentMethod = bulkEditData.paymentMethod as any;
    if (bulkEditData.tags) {
      updates.tags = bulkEditData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    if (Object.keys(updates).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    const result = onBulkEdit(selectedExpenses, updates);
    
    if (result.success > 0) {
      alert(`Successfully updated ${result.success} expenses`);
      setShowBulkEdit(false);
      setBulkEditData({ category: '', merchant: '', paymentMethod: '', tags: '' });
      onClearSelection();
    }
    
    if (result.failed > 0) {
      alert(`Failed to update ${result.failed} expenses`);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      const result = onImportCSV(csvData);
      setImportResult(result);
    } catch (error) {
      alert('Error reading CSV file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const parseCSV = (csvText: string): ExpenseImportData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: ExpenseImportData[] = [];

    // Expected headers mapping
    const headerMap: Record<string, string> = {
      'date': 'date',
      'amount': 'amount',
      'description': 'description',
      'category': 'category',
      'merchant': 'merchant',
      'payment method': 'paymentMethod',
      'currency': 'currency',
    };

    const getColumnIndex = (possibleNames: string[]) => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => h.includes(name));
        if (index !== -1) return index;
      }
      return -1;
    };

    const dateIndex = getColumnIndex(['date']);
    const amountIndex = getColumnIndex(['amount', 'price', 'cost']);
    const descriptionIndex = getColumnIndex(['description', 'desc', 'note', 'item']);
    const categoryIndex = getColumnIndex(['category', 'type']);
    const merchantIndex = getColumnIndex(['merchant', 'vendor', 'store', 'shop']);
    const paymentIndex = getColumnIndex(['payment', 'method']);
    const currencyIndex = getColumnIndex(['currency']);

    if (dateIndex === -1 || amountIndex === -1 || descriptionIndex === -1) {
      throw new Error('CSV must have Date, Amount, and Description columns');
    }

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"(.*)"$/, '$1'));
      
      if (values.length < 3) continue; // Skip incomplete rows

      const rowData: ExpenseImportData = {
        date: values[dateIndex] || '',
        amount: values[amountIndex] || '0',
        description: values[descriptionIndex] || '',
      };

      if (categoryIndex !== -1 && values[categoryIndex]) {
        rowData.category = values[categoryIndex];
      }
      if (merchantIndex !== -1 && values[merchantIndex]) {
        rowData.merchant = values[merchantIndex];
      }
      if (paymentIndex !== -1 && values[paymentIndex]) {
        rowData.paymentMethod = values[paymentIndex];
      }
      if (currencyIndex !== -1 && values[currencyIndex]) {
        rowData.currency = values[currencyIndex];
      }

      data.push(rowData);
    }

    return data;
  };

  const downloadSampleCSV = () => {
    const sampleData = [
      'Date,Amount,Description,Category,Merchant,Payment Method,Currency',
      '2024-01-01,299.99,Monthly Netflix subscription,Entertainment,Netflix,Card,INR',
      '2024-01-02,45.50,Lunch at work,Food,Office Cafeteria,Cash,INR',
      '2024-01-03,1200.00,Grocery shopping,Food,Big Bazaar,Card,INR',
      '2024-01-04,250.00,Bus pass,Transport,BMTC,Card,INR'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'expenses_sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (selectedExpenses.length === 0 && !showImport) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-600">Select expenses to perform bulk operations</p>
        <button
          onClick={() => setShowImport(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Import CSV
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selected expenses actions */}
      {selectedExpenses.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-4">
            <span className="text-blue-800 font-medium">
              {selectedExpenses.length} expenses selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowBulkEdit(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Bulk Edit
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Bulk Edit Form */}
      {showBulkEdit && (
        <div className="bg-white border rounded-lg p-4">
          <form onSubmit={handleBulkEdit} className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">
                Bulk Edit {selectedExpenses.length} Expenses
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkEdit(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={bulkEditData.category}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty to keep existing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant
                </label>
                <input
                  type="text"
                  value={bulkEditData.merchant}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, merchant: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Leave empty to keep existing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={bulkEditData.paymentMethod}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Keep existing</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="digital_wallet">Digital Wallet</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={bulkEditData.tags}
                  onChange={(e) => setBulkEditData(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., business, tax-deductible"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowBulkEdit(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Update {selectedExpenses.length} Expenses
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Import CSV Section */}
      {showImport && (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-900">Import Expenses from CSV</h3>
            <button
              onClick={() => {
                setShowImport(false);
                setImportResult(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-medium text-yellow-800 mb-2">CSV Format Requirements</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Required columns: Date, Amount, Description</li>
                <li>• Optional columns: Category, Merchant, Payment Method, Currency</li>
                <li>• Date format: YYYY-MM-DD (e.g., 2024-01-01)</li>
                <li>• Amount should be numeric (e.g., 299.99)</li>
              </ul>
              <button
                onClick={downloadSampleCSV}
                className="mt-2 text-yellow-800 hover:text-yellow-900 underline text-sm"
              >
                Download sample CSV file
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">Select CSV file to import expenses</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Choose CSV File
              </button>
            </div>

            {/* Import Results */}
            {importResult && (
              <div className={`p-4 rounded-md ${
                importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <h4 className={`font-medium mb-2 ${
                  importResult.failed === 0 ? 'text-green-800' : 'text-red-800'
                }`}>
                  Import Results
                </h4>
                <div className={`text-sm ${
                  importResult.failed === 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p>✅ Successfully imported: {importResult.success} expenses</p>
                  {importResult.failed > 0 && (
                    <>
                      <p>❌ Failed to import: {importResult.failed} expenses</p>
                      {importResult.errors.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer">View errors</summary>
                          <ul className="mt-1 space-y-1 text-xs">
                            {importResult.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};