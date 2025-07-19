import type { Expense, Budget, CustomCategory, BudgetTemplate } from '../types/expense';

const STORAGE_KEY = 'expense-tracker-data';
const BUDGET_STORAGE_KEY = 'expense-tracker-budgets';
const CUSTOM_CATEGORIES_KEY = 'expense-tracker-custom-categories';
const BUDGET_TEMPLATES_KEY = 'expense-tracker-budget-templates';

export const storage = {
  getExpenses: (): Expense[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveExpenses: (expenses: Expense[]): void => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  addExpense: (expense: Expense): void => {
    const expenses = storage.getExpenses();
    expenses.push(expense);
    storage.saveExpenses(expenses);
  },

  updateExpense: (id: string, updatedExpense: Expense): void => {
    const expenses = storage.getExpenses();
    const index = expenses.findIndex(expense => expense.id === id);
    if (index !== -1) {
      expenses[index] = updatedExpense;
      storage.saveExpenses(expenses);
    }
  },

  deleteExpense: (id: string): void => {
    const expenses = storage.getExpenses();
    const filteredExpenses = expenses.filter(expense => expense.id !== id);
    storage.saveExpenses(filteredExpenses);
  },

  clearAllExpenses: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },

  createBackup: (): string => {
    const expenses = storage.getExpenses();
    const budgets = storage.getBudgets();
    const customCategories = storage.getCustomCategories();
    const budgetTemplates = storage.getBudgetTemplates();
    
    const backup = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      expenses,
      budgets,
      customCategories,
      budgetTemplates,
      totalExpenses: expenses.length,
      totalBudgets: budgets.length,
      totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0)
    };
    return JSON.stringify(backup, null, 2);
  },

  restoreFromBackup: (backupData: string): { success: boolean; message: string; count?: number } => {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.version || !backup.expenses || !Array.isArray(backup.expenses)) {
        return { success: false, message: 'Invalid backup format' };
      }

      // Validate expense structure
      const isValidExpense = (expense: unknown): expense is Expense => {
        return expense !== null && 
               typeof expense === 'object' &&
               'id' in expense &&
               'date' in expense &&
               'amount' in expense &&
               'category' in expense &&
               'description' in expense &&
               'createdAt' in expense &&
               'updatedAt' in expense &&
               typeof expense.id === 'string' &&
               typeof expense.date === 'string' &&
               typeof expense.amount === 'number' &&
               typeof expense.category === 'string' &&
               typeof expense.description === 'string' &&
               typeof expense.createdAt === 'string' &&
               typeof expense.updatedAt === 'string';
      };

      const validExpenses = backup.expenses.filter(isValidExpense);
      
      if (validExpenses.length !== backup.expenses.length) {
        return { 
          success: false, 
          message: `Invalid expense data found. Expected ${backup.expenses.length} expenses, but only ${validExpenses.length} are valid.` 
        };
      }

      storage.saveExpenses(validExpenses);
      return { 
        success: true, 
        message: `Successfully restored ${validExpenses.length} expenses from backup.`,
        count: validExpenses.length
      };
    } catch {
      return { success: false, message: 'Failed to parse backup file. Please check the file format.' };
    }
  },

  // Budget management methods
  getBudgets: (): Budget[] => {
    try {
      const data = localStorage.getItem(BUDGET_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading budgets from localStorage:', error);
      return [];
    }
  },

  saveBudgets: (budgets: Budget[]): void => {
    try {
      localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(budgets));
    } catch (error) {
      console.error('Error saving budgets to localStorage:', error);
    }
  },

  addBudget: (budget: Budget): void => {
    const budgets = storage.getBudgets();
    budgets.push(budget);
    storage.saveBudgets(budgets);
  },

  updateBudget: (id: string, updatedBudget: Budget): void => {
    const budgets = storage.getBudgets();
    const index = budgets.findIndex(budget => budget.id === id);
    if (index !== -1) {
      budgets[index] = updatedBudget;
      storage.saveBudgets(budgets);
    }
  },

  deleteBudget: (id: string): void => {
    const budgets = storage.getBudgets();
    const filteredBudgets = budgets.filter(budget => budget.id !== id);
    storage.saveBudgets(filteredBudgets);
  },

  // Custom Categories management
  getCustomCategories: (): CustomCategory[] => {
    try {
      const data = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading custom categories from localStorage:', error);
      return [];
    }
  },

  saveCustomCategories: (categories: CustomCategory[]): void => {
    try {
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving custom categories to localStorage:', error);
    }
  },

  addCustomCategory: (category: CustomCategory): void => {
    const categories = storage.getCustomCategories();
    categories.push(category);
    storage.saveCustomCategories(categories);
  },

  deleteCustomCategory: (id: string): void => {
    const categories = storage.getCustomCategories();
    const filteredCategories = categories.filter(cat => cat.id !== id);
    storage.saveCustomCategories(filteredCategories);
  },

  // Budget Templates management
  getBudgetTemplates: (): BudgetTemplate[] => {
    try {
      const data = localStorage.getItem(BUDGET_TEMPLATES_KEY);
      return data ? JSON.parse(data) : storage.getDefaultTemplates();
    } catch (error) {
      console.error('Error reading budget templates from localStorage:', error);
      return storage.getDefaultTemplates();
    }
  },

  saveBudgetTemplates: (templates: BudgetTemplate[]): void => {
    try {
      localStorage.setItem(BUDGET_TEMPLATES_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Error saving budget templates to localStorage:', error);
    }
  },

  addBudgetTemplate: (template: BudgetTemplate): void => {
    const templates = storage.getBudgetTemplates();
    templates.push(template);
    storage.saveBudgetTemplates(templates);
  },

  deleteBudgetTemplate: (id: string): void => {
    const templates = storage.getBudgetTemplates();
    const filteredTemplates = templates.filter(template => template.id !== id);
    storage.saveBudgetTemplates(filteredTemplates);
  },

  getDefaultTemplates: (): BudgetTemplate[] => {
    return [
      {
        id: 'student-template',
        name: 'Student Budget',
        description: 'Basic budget template for students',
        category: 'student',
        budgets: [
          {
            category: 'Food',
            amount: 8000,
            period: 'monthly',
            type: 'standard',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: false
          },
          {
            category: 'Transport',
            amount: 2000,
            period: 'monthly',
            type: 'standard',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: false
          },
          {
            category: 'Entertainment',
            amount: 3000,
            period: 'monthly',
            type: 'standard',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: true
          }
        ]
      },
      {
        id: 'family-template',
        name: 'Family Budget',
        description: 'Comprehensive budget for families',
        category: 'family',
        budgets: [
          {
            category: 'Food',
            amount: 20000,
            period: 'monthly',
            type: 'standard',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: false
          },
          {
            category: 'Bills',
            amount: 15000,
            period: 'monthly',
            type: 'standard',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: false
          },
          {
            category: 'Healthcare',
            amount: 8000,
            period: 'monthly',
            type: 'standard',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: true
          },
          {
            category: 'Education',
            amount: 10000,
            period: 'monthly',
            type: 'savings',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: true
          }
        ]
      },
      {
        id: 'professional-template',
        name: 'Professional Budget',
        description: 'Budget template for working professionals',
        category: 'professional',
        budgets: [
          {
            category: 'total',
            amount: 50000,
            period: 'monthly',
            type: 'auto-adjusting',
            alertThresholds: [80, 95, 100],
            rolloverEnabled: false,
            autoAdjustSettings: {
              enabled: true,
              baselineMonths: 3,
              adjustmentFactor: 0.1
            }
          },
          {
            category: 'Food',
            amount: 15000,
            period: 'monthly',
            type: 'standard',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: false
          },
          {
            category: 'Transport',
            amount: 8000,
            period: 'monthly',
            type: 'standard',
            alertThresholds: [75, 90, 100],
            rolloverEnabled: false
          }
        ]
      }
    ];
  }
};

// Generic storage utilities for tax data
export const getStorageData = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const setStorageData = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};