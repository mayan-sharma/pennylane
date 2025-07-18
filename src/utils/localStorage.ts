import type { Expense, Budget } from '../types/expense';

const STORAGE_KEY = 'expense-tracker-data';
const BUDGET_STORAGE_KEY = 'expense-tracker-budgets';

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
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      expenses,
      totalExpenses: expenses.length,
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
  }
};