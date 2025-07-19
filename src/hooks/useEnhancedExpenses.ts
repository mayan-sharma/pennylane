import { useState, useEffect, useCallback } from 'react';
import { 
  ExpenseCategory, 
  type Expense, 
  type ExpenseFilters, 
  type ExpenseStats,
  type RecurringExpense,
  type ExpenseTemplate,
  type Currency,
  type Receipt,
  type CustomCategory,
  type AdvancedFilters,
  type BulkOperationResult,
  type ExpenseImportData,
  type SpendingInsight,
  type QuickAddPreset
} from '../types/expense';
import { storage } from '../utils/localStorage';

// Enhanced storage utilities
const enhancedStorage = {
  ...storage,
  
  // Recurring expenses
  getRecurringExpenses: (): RecurringExpense[] => 
    JSON.parse(localStorage.getItem('recurringExpenses') || '[]'),
  saveRecurringExpenses: (expenses: RecurringExpense[]) => 
    localStorage.setItem('recurringExpenses', JSON.stringify(expenses)),
  
  // Templates
  getExpenseTemplates: (): ExpenseTemplate[] => 
    JSON.parse(localStorage.getItem('expenseTemplates') || '[]'),
  saveExpenseTemplates: (templates: ExpenseTemplate[]) => 
    localStorage.setItem('expenseTemplates', JSON.stringify(templates)),
  
  // Custom categories
  getCustomCategories: (): CustomCategory[] => 
    JSON.parse(localStorage.getItem('customCategories') || '[]'),
  saveCustomCategories: (categories: CustomCategory[]) => 
    localStorage.setItem('customCategories', JSON.stringify(categories)),
  
  // Currencies
  getCurrencies: (): Currency[] => 
    JSON.parse(localStorage.getItem('currencies') || JSON.stringify([
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 1, lastUpdated: new Date().toISOString() },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.012, lastUpdated: new Date().toISOString() },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.011, lastUpdated: new Date().toISOString() }
    ])),
  saveCurrencies: (currencies: Currency[]) => 
    localStorage.setItem('currencies', JSON.stringify(currencies)),
  
  // Quick add presets
  getQuickAddPresets: (): QuickAddPreset[] => 
    JSON.parse(localStorage.getItem('quickAddPresets') || JSON.stringify([
      { id: '1', name: 'Coffee', category: 'Food', amount: 150, description: 'Morning coffee', isDefault: true },
      { id: '2', name: 'Lunch', category: 'Food', amount: 300, description: 'Lunch', isDefault: true },
      { id: '3', name: 'Bus Ride', category: 'Transport', amount: 50, description: 'Public transport', isDefault: true }
    ])),
  saveQuickAddPresets: (presets: QuickAddPreset[]) => 
    localStorage.setItem('quickAddPresets', JSON.stringify(presets)),
};

export const useEnhancedExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [expenseTemplates, setExpenseTemplates] = useState<ExpenseTemplate[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [quickAddPresets, setQuickAddPresets] = useState<QuickAddPreset[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    const loadAllData = () => {
      setLoading(true);
      setExpenses(storage.getExpenses());
      setRecurringExpenses(enhancedStorage.getRecurringExpenses());
      setExpenseTemplates(enhancedStorage.getExpenseTemplates());
      setCustomCategories(enhancedStorage.getCustomCategories());
      setCurrencies(enhancedStorage.getCurrencies());
      setQuickAddPresets(enhancedStorage.getQuickAddPresets());
      setLoading(false);
    };

    loadAllData();
  }, []);

  // Enhanced expense operations
  const addExpense = useCallback((expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency: expenseData.currency || 'INR',
    };

    storage.addExpense(newExpense);
    setExpenses(prev => [...prev, newExpense]);

    // Update template usage count if used
    if (expenseData.templateId) {
      updateTemplateUsage(expenseData.templateId);
    }
  }, []);

  const addExpenseFromTemplate = useCallback((templateId: string, overrides: Partial<Expense> = {}) => {
    const template = expenseTemplates.find(t => t.id === templateId);
    if (!template) return;

    const expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
      date: new Date().toISOString().split('T')[0],
      amount: template.amount || 0,
      category: template.category,
      description: template.description || '',
      merchant: template.merchant,
      tags: template.tags,
      paymentMethod: template.paymentMethod,
      notes: template.notes,
      templateId: template.id,
      ...overrides,
    };

    addExpense(expenseData);
  }, [expenseTemplates, addExpense]);

  const addQuickExpense = useCallback((presetId: string, overrides: Partial<Expense> = {}) => {
    const preset = quickAddPresets.find(p => p.id === presetId);
    if (!preset) return;

    const expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
      date: new Date().toISOString().split('T')[0],
      amount: preset.amount || 0,
      category: preset.category,
      description: preset.description || preset.name,
      merchant: preset.merchant,
      ...overrides,
    };

    addExpense(expenseData);
  }, [quickAddPresets, addExpense]);

  // Recurring expenses
  const addRecurringExpense = useCallback((recurringData: Omit<RecurringExpense, 'id' | 'createdAt' | 'updatedAt' | 'generatedExpenses'>) => {
    const newRecurring: RecurringExpense = {
      ...recurringData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedExpenses: [],
    };

    const updated = [...recurringExpenses, newRecurring];
    setRecurringExpenses(updated);
    enhancedStorage.saveRecurringExpenses(updated);
  }, [recurringExpenses]);

  const generateRecurringExpenses = useCallback(() => {
    const today = new Date();
    const updatedRecurring = [...recurringExpenses];
    let newExpenses: Expense[] = [];

    updatedRecurring.forEach(recurring => {
      if (!recurring.isActive || !recurring.autoGenerate) return;
      
      const nextDue = new Date(recurring.nextDueDate);
      if (nextDue <= today) {
        // Generate expense
        const expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> = {
          ...recurring.templateExpense,
          date: nextDue.toISOString().split('T')[0],
          recurringExpenseId: recurring.id,
          isRecurring: true,
        };

        const newExpense: Expense = {
          ...expense,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        newExpenses.push(newExpense);
        recurring.generatedExpenses.push(newExpense.id);

        // Calculate next due date
        const next = new Date(nextDue);
        switch (recurring.frequency) {
          case 'daily':
            next.setDate(next.getDate() + recurring.interval);
            break;
          case 'weekly':
            next.setDate(next.getDate() + (recurring.interval * 7));
            break;
          case 'monthly':
            next.setMonth(next.getMonth() + recurring.interval);
            break;
          case 'yearly':
            next.setFullYear(next.getFullYear() + recurring.interval);
            break;
        }
        recurring.nextDueDate = next.toISOString().split('T')[0];
        recurring.updatedAt = new Date().toISOString();
      }
    });

    if (newExpenses.length > 0) {
      const allExpenses = [...expenses, ...newExpenses];
      setExpenses(allExpenses);
      storage.saveExpenses(allExpenses);
      
      setRecurringExpenses(updatedRecurring);
      enhancedStorage.saveRecurringExpenses(updatedRecurring);
    }

    return newExpenses.length;
  }, [recurringExpenses, expenses]);

  // Templates
  const addExpenseTemplate = useCallback((templateData: Omit<ExpenseTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    const newTemplate: ExpenseTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    const updated = [...expenseTemplates, newTemplate];
    setExpenseTemplates(updated);
    enhancedStorage.saveExpenseTemplates(updated);
  }, [expenseTemplates]);

  const updateTemplateUsage = useCallback((templateId: string) => {
    const updated = expenseTemplates.map(template =>
      template.id === templateId
        ? { ...template, usageCount: template.usageCount + 1, updatedAt: new Date().toISOString() }
        : template
    );
    setExpenseTemplates(updated);
    enhancedStorage.saveExpenseTemplates(updated);
  }, [expenseTemplates]);

  // Custom categories
  const addCustomCategory = useCallback((categoryData: Omit<CustomCategory, 'id'>) => {
    const newCategory: CustomCategory = {
      ...categoryData,
      id: crypto.randomUUID(),
    };

    const updated = [...customCategories, newCategory];
    setCustomCategories(updated);
    enhancedStorage.saveCustomCategories(updated);
  }, [customCategories]);

  // Advanced filtering
  const getAdvancedFilteredExpenses = useCallback((filters: AdvancedFilters) => {
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
      if (filters.currencies && filters.currencies.length > 0 && (!expense.currency || !filters.currencies.includes(expense.currency))) return false;
      if (filters.hasReceipts !== undefined) {
        const hasReceipts = expense.receipts && expense.receipts.length > 0;
        if (filters.hasReceipts !== hasReceipts) return false;
      }
      if (filters.isRecurring !== undefined && expense.isRecurring !== filters.isRecurring) return false;

      return true;
    });
  }, [expenses]);

  // Bulk operations
  const bulkDeleteExpenses = useCallback((expenseIds: string[]): BulkOperationResult => {
    const initialCount = expenses.length;
    const filtered = expenses.filter(expense => !expenseIds.includes(expense.id));
    const deletedCount = initialCount - filtered.length;

    setExpenses(filtered);
    storage.saveExpenses(filtered);

    return {
      success: deletedCount,
      failed: expenseIds.length - deletedCount,
      errors: [],
      processedItems: expenseIds.length,
    };
  }, [expenses]);

  const importExpensesFromCSV = useCallback((csvData: ExpenseImportData[]): BulkOperationResult => {
    const result: BulkOperationResult = {
      success: 0,
      failed: 0,
      errors: [],
      processedItems: csvData.length,
    };

    const newExpenses: Expense[] = [];

    csvData.forEach((data, index) => {
      try {
        // Validate required fields
        if (!data.date || !data.description || (!data.amount && data.amount !== 0)) {
          result.failed++;
          result.errors.push(`Row ${index + 1}: Missing required fields`);
          return;
        }

        const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
        if (isNaN(amount)) {
          result.failed++;
          result.errors.push(`Row ${index + 1}: Invalid amount`);
          return;
        }

        const expense: Expense = {
          id: crypto.randomUUID(),
          date: data.date,
          amount,
          category: data.category || 'Other',
          description: data.description,
          merchant: data.merchant,
          paymentMethod: data.paymentMethod as any,
          currency: data.currency || 'INR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        newExpenses.push(expense);
        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    if (newExpenses.length > 0) {
      const allExpenses = [...expenses, ...newExpenses];
      setExpenses(allExpenses);
      storage.saveExpenses(allExpenses);
    }

    return result;
  }, [expenses]);

  // Receipt management
  const addReceiptToExpense = useCallback((expenseId: string, receipt: Omit<Receipt, 'id' | 'uploadDate'>) => {
    const newReceipt: Receipt = {
      ...receipt,
      id: crypto.randomUUID(),
      uploadDate: new Date().toISOString(),
    };

    const updated = expenses.map(expense =>
      expense.id === expenseId
        ? {
            ...expense,
            receipts: [...(expense.receipts || []), newReceipt],
            updatedAt: new Date().toISOString(),
          }
        : expense
    );

    setExpenses(updated);
    storage.saveExpenses(updated);
  }, [expenses]);

  // AI Insights (mock implementation)
  const generateSpendingInsights = useCallback((): SpendingInsight[] => {
    const insights: SpendingInsight[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentExpenses = expenses.filter(e => new Date(e.date) >= thirtyDaysAgo);
    
    // Spending pattern analysis
    const categoryTotals = recentExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0];
    if (topCategory && topCategory[1] > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'pattern',
        title: `High spending in ${topCategory[0]}`,
        description: `You've spent ₹${topCategory[1].toFixed(2)} on ${topCategory[0]} in the last 30 days.`,
        data: { category: topCategory[0], amount: topCategory[1] },
        confidence: 0.9,
        actionable: true,
        category: topCategory[0],
        dateRange: { start: thirtyDaysAgo.toISOString(), end: now.toISOString() },
        createdAt: now.toISOString(),
      });
    }

    return insights;
  }, [expenses]);

  // Enhanced stats
  const getEnhancedExpenseStats = useCallback(() => {
    const basicStats = getExpenseStats();
    const insights = generateSpendingInsights();
    
    return {
      ...basicStats,
      insights,
      recurringCount: recurringExpenses.filter(r => r.isActive).length,
      templatesCount: expenseTemplates.length,
      customCategoriesCount: customCategories.length,
    };
  }, [expenses, recurringExpenses, expenseTemplates, customCategories]);

  // Legacy compatibility
  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const updatedExpense: Expense = {
      ...expenses.find(e => e.id === id)!,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    storage.updateExpense(id, updatedExpense);
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? updatedExpense : expense
    ));
  }, [expenses]);

  const deleteExpense = useCallback((id: string) => {
    storage.deleteExpense(id);
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  }, []);

  const getFilteredExpenses = useCallback((filters: ExpenseFilters) => {
    return expenses.filter(expense => {
      if (filters.category && expense.category !== filters.category) return false;
      if (filters.dateFrom && expense.date < filters.dateFrom) return false;
      if (filters.dateTo && expense.date > filters.dateTo) return false;
      if (filters.searchTerm && !expense.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [expenses]);

  const getExpenseStats = useCallback((): ExpenseStats => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const thisMonthTotal = expenses
      .filter(expense => new Date(expense.date) >= thisMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const thisWeekTotal = expenses
      .filter(expense => new Date(expense.date) >= thisWeek)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const byCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    return {
      total,
      byCategory,
      thisMonth: thisMonthTotal,
      thisWeek: thisWeekTotal,
      count: expenses.length,
    };
  }, [expenses]);

  const getRecentExpenses = useCallback((limit: number = 5) => {
    return expenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [expenses]);

  const loadExpenses = useCallback(() => {
    const storedExpenses = storage.getExpenses();
    setExpenses(storedExpenses);
  }, []);

  return {
    // State
    expenses,
    recurringExpenses,
    expenseTemplates,
    customCategories,
    currencies,
    quickAddPresets,
    loading,

    // Basic operations (legacy compatibility)
    addExpense,
    updateExpense,
    deleteExpense,
    getFilteredExpenses,
    getExpenseStats,
    getRecentExpenses,
    loadExpenses,

    // Enhanced operations
    addExpenseFromTemplate,
    addQuickExpense,
    addRecurringExpense,
    generateRecurringExpenses,
    addExpenseTemplate,
    addCustomCategory,
    getAdvancedFilteredExpenses,
    bulkDeleteExpenses,
    importExpensesFromCSV,
    addReceiptToExpense,
    generateSpendingInsights,
    getEnhancedExpenseStats,
  };
};