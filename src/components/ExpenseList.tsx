import React, { useState, useMemo } from 'react';
import { ExpenseCategory, type Expense, type ExpenseFilters, type AdvancedFilters, type BulkOperationResult, type ExpenseStats } from '../types';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';
import { AdvancedSearch } from './AdvancedSearch';
import { BulkOperations } from './BulkOperations';
import { InlineExpenseEditor } from './InlineExpenseEditor';
import { QuickAddFAB } from './QuickAddFAB';
import { PDFExporter } from './PDFExporter';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

interface ExpenseListProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onAddExpense?: () => void;
  onQuickAdd?: (presetId: string) => void;
  onTemplateAdd?: (templateId: string) => void;
  onBulkDelete?: (ids: string[]) => BulkOperationResult;
  onBulkEdit?: (ids: string[], updates: Partial<Expense>) => BulkOperationResult;
  onImportCSV?: (data: any[]) => BulkOperationResult;
  stats?: ExpenseStats;
  quickAddPresets?: any[];
  templates?: any[];
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  onEditExpense,
  onDeleteExpense,
  onAddExpense,
  onQuickAdd,
  onTemplateAdd,
  onBulkDelete,
  onBulkEdit,
  onImportCSV,
  stats,
  quickAddPresets = [],
  templates = []
}) => {
  const [filters, setFilters] = useState<AdvancedFilters>({});
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([]);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [showPDFExporter, setShowPDFExporter] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    onNewExpense: onAddExpense,
    onSearch: () => setShowAdvancedSearch(true),
    onToggleFilters: () => setShowAdvancedSearch(!showAdvancedSearch),
    onExport: () => setShowPDFExporter(true),
    onBulkSelect: () => setSelectedExpenses(filteredExpenses.map(e => e.id)),
    onRefresh: () => window.location.reload(),
    onHelp: () => setShowKeyboardHelp(true),
    onQuickAdd: onAddExpense,
    onNavigateUp: () => setCurrentFocusIndex(prev => Math.max(0, prev - 1)),
    onNavigateDown: () => setCurrentFocusIndex(prev => Math.min(filteredExpenses.length - 1, prev + 1)),
    onSelectItem: () => {
      if (currentFocusIndex >= 0 && currentFocusIndex < filteredExpenses.length) {
        const expense = filteredExpenses[currentFocusIndex];
        setSelectedExpenses(prev => 
          prev.includes(expense.id) 
            ? prev.filter(id => id !== expense.id)
            : [...prev, expense.id]
        );
      }
    },
    onDeleteSelected: () => {
      if (selectedExpenses.length > 0 && onBulkDelete) {
        onBulkDelete(selectedExpenses);
        setSelectedExpenses([]);
      }
    },
    onEditSelected: () => {
      if (selectedExpenses.length === 1) {
        setEditingExpenseId(selectedExpenses[0]);
      }
    }
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      // Basic filters
      if (filters.category && expense.category !== filters.category) return false;
      if (filters.dateFrom && expense.date < filters.dateFrom) return false;
      if (filters.dateTo && expense.date > filters.dateTo) return false;
      if (filters.searchTerm && !expense.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;

      // Advanced filters
      if (filters.amountMin !== undefined && expense.amount < filters.amountMin) return false;
      if (filters.amountMax !== undefined && expense.amount > filters.amountMax) return false;
      if (filters.categories && filters.categories.length > 0 && !filters.categories.includes(expense.category)) return false;
      if (filters.tags && filters.tags.length > 0 && (!expense.tags || !filters.tags.some(tag => expense.tags?.includes(tag)))) return false;
      if (filters.merchants && filters.merchants.length > 0 && (!expense.merchant || !filters.merchants.includes(expense.merchant))) return false;
      if (filters.paymentMethods && filters.paymentMethods.length > 0 && (!expense.paymentMethod || !filters.paymentMethods.includes(expense.paymentMethod))) return false;
      if (filters.hasReceipts !== undefined) {
        const hasReceipts = expense.receipts && expense.receipts.length > 0;
        if (filters.hasReceipts !== hasReceipts) return false;
      }
      if (filters.isRecurring !== undefined && expense.isRecurring !== filters.isRecurring) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, filters]);

  const availableCategories = [...new Set(expenses.map(e => e.category))];
  const availableMerchants = [...new Set(expenses.map(e => e.merchant).filter(Boolean))] as string[];
  const availableTags = [...new Set(expenses.flatMap(e => e.tags || []))];

  const handleFilterChange = (newFilters: AdvancedFilters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handleExport = async (options: any) => {
    const dataToExport = filteredExpenses.length > 0 ? filteredExpenses : expenses;
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (options.format === 'csv') {
      exportToCSV(dataToExport, `expenses_${timestamp}.csv`);
    } else if (options.format === 'json') {
      exportToJSON(dataToExport, `expenses_${timestamp}.json`);
    }
    // PDF export would need additional implementation
  };

  const handleSelectExpense = (expenseId: string, checked: boolean) => {
    setSelectedExpenses(prev => 
      checked 
        ? [...prev, expenseId]
        : prev.filter(id => id !== expenseId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedExpenses(checked ? filteredExpenses.map(e => e.id) : []);
  };

  const handleInlineEdit = (expenseId: string, updates: Partial<Expense>) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (expense) {
      onEditExpense({ ...expense, ...updates });
    }
    setEditingExpenseId(null);
  };

  return (
    <div className="space-y-6">
      {/* Advanced Search */}
      {showAdvancedSearch ? (
        <AdvancedSearch
          filters={filters}
          onFiltersChange={handleFilterChange}
          availableCategories={availableCategories}
          availableMerchants={availableMerchants}
          availableTags={availableTags}
          onClearFilters={clearFilters}
        />
      ) : (
        /* Basic Search */
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Filter Expenses</h3>
            <button
              onClick={() => setShowAdvancedSearch(true)}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Advanced Search
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search description..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange({ ...filters, searchTerm: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange({ ...filters, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {Object.values(ExpenseCategory).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowPDFExporter(true)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Export
              </button>
              <button
                onClick={() => setShowBulkOperations(true)}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Bulk Actions
              </button>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Operations */}
      {(showBulkOperations || selectedExpenses.length > 0) && onBulkDelete && onBulkEdit && onImportCSV && (
        <BulkOperations
          selectedExpenses={selectedExpenses}
          onBulkDelete={onBulkDelete}
          onBulkEdit={onBulkEdit}
          onImportCSV={onImportCSV}
          onClearSelection={() => setSelectedExpenses([])}
        />
      )}

      {/* Expense Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Merchant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <div className="text-4xl mb-2">📋</div>
                    <p>No expenses found</p>
                    <p className="text-sm">Try adjusting your filters or add some expenses</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense, index) => 
                  editingExpenseId === expense.id ? (
                    <InlineExpenseEditor
                      key={expense.id}
                      expense={expense}
                      onSave={handleInlineEdit}
                      onCancel={() => setEditingExpenseId(null)}
                      availableCategories={availableCategories}
                    />
                  ) : (
                    <tr 
                      key={expense.id} 
                      className={`hover:bg-gray-50 ${
                        currentFocusIndex === index ? 'ring-2 ring-blue-500' : ''
                      } ${
                        selectedExpenses.includes(expense.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedExpenses.includes(expense.id)}
                          onChange={(e) => handleSelectExpense(expense.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(expense.amount)}
                        {expense.currency && expense.currency !== 'INR' && (
                          <span className="text-xs text-gray-500 ml-1">({expense.currency})</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{expense.description || 'No description'}</div>
                        {expense.tags && expense.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {expense.tags.map(tag => (
                              <span key={tag} className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {expense.receipts && expense.receipts.length > 0 && (
                          <div className="mt-1 text-xs text-green-600">
                            📎 {expense.receipts.length} receipt(s)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.merchant || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {expense.paymentMethod ? (
                          <span className="capitalize">
                            {expense.paymentMethod.replace('_', ' ')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setEditingExpenseId(expense.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit inline (Ctrl+Enter)"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onEditExpense(expense)}
                          className="text-green-600 hover:text-green-900"
                          title="Full edit"
                        >
                          Full Edit
                        </button>
                        <button
                          onClick={() => onDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete (Del)"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Add FAB */}
      {onAddExpense && onQuickAdd && onTemplateAdd && (
        <QuickAddFAB
          quickAddPresets={quickAddPresets}
          templates={templates}
          onQuickAdd={onQuickAdd}
          onTemplateAdd={onTemplateAdd}
          onOpenFullForm={onAddExpense}
        />
      )}

      {/* PDF Exporter Modal */}
      {showPDFExporter && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Export Expenses</h2>
                <button
                  onClick={() => setShowPDFExporter(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <PDFExporter
                expenses={filteredExpenses}
                stats={stats}
                onExport={handleExport}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Floating help button */}
      <button
        onClick={() => setShowKeyboardHelp(true)}
        className="fixed bottom-6 left-6 w-12 h-12 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700 transition-colors z-40"
        title="Keyboard shortcuts (Press ?)"
      >
        ?
      </button>
    </div>
  );
};