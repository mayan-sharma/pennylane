import { useState, useEffect } from 'react';
import type { Expense, CustomCategory } from '../types/expense';
import type { Budget, BudgetTemplate } from '../types/budget';

// Enhanced storage utilities with advanced features
export interface StorageOptions {
  compress?: boolean;
  encrypt?: boolean;
  ttl?: number; // Time to live in milliseconds
  version?: string;
  syncAcrossTabs?: boolean;
}

export interface StorageData<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  version?: string;
  compressed?: boolean;
  encrypted?: boolean;
}

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

// Simple compression using JSON stringification optimization
const compress = (data: string): string => {
  // Simple LZ-style compression for JSON data
  const dict: Record<string, string> = {};
  let result = data;
  const commonPatterns = ['"', ':', '{', '}', '[', ']', ',', 'true', 'false', 'null'];
  
  commonPatterns.forEach((pattern, index) => {
    const token = String.fromCharCode(256 + index);
    dict[token] = pattern;
    result = result.split(pattern).join(token);
  });
  
  return JSON.stringify({ compressed: result, dict });
};

const decompress = (compressed: string): string => {
  try {
    const { compressed: data, dict } = JSON.parse(compressed);
    let result = data;
    Object.entries(dict).forEach(([token, pattern]) => {
      result = result.split(token).join(pattern);
    });
    return result;
  } catch {
    return compressed; // Fallback if not compressed
  }
};

// Simple encryption (for demo - use proper encryption in production)
const encrypt = (data: string): string => {
  return btoa(data); // Base64 encoding (use proper encryption in production)
};

const decrypt = (encrypted: string): string => {
  try {
    return atob(encrypted);
  } catch {
    return encrypted; // Fallback if not encrypted
  }
};

export const getStorageData = <T>(key: string, defaultValue: T, options?: StorageOptions): T => {
  try {
    const rawData = localStorage.getItem(key);
    if (!rawData) return defaultValue;

    
    // Try to parse as enhanced storage data first
    try {
      const parsedData: StorageData<T> = JSON.parse(rawData);
      
      // Check TTL
      if (parsedData.ttl && Date.now() - parsedData.timestamp > parsedData.ttl) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      
      // Check version compatibility
      if (options?.version && parsedData.version && parsedData.version !== options.version) {
        console.warn(`Version mismatch for ${key}. Expected: ${options.version}, Found: ${parsedData.version}`);
        localStorage.removeItem(key);
        return defaultValue;
      }
      
      let value = JSON.stringify(parsedData.value);
      
      // Decrypt if needed
      if (parsedData.encrypted) {
        value = decrypt(value);
      }
      
      // Decompress if needed
      if (parsedData.compressed) {
        value = decompress(value);
      }
      
      return JSON.parse(value);
    } catch {
      // Fallback to simple parsing for backward compatibility
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const setStorageData = <T>(key: string, value: T, options?: StorageOptions): void => {
  try {
    let data = JSON.stringify(value);
    
    // Compress if requested
    if (options?.compress) {
      data = compress(data);
    }
    
    // Encrypt if requested
    if (options?.encrypt) {
      data = encrypt(data);
    }
    
    const storageData: StorageData<T> = {
      value: options?.compress || options?.encrypt ? JSON.parse(data) : value,
      timestamp: Date.now(),
      ...(options?.ttl && { ttl: options.ttl }),
      ...(options?.version && { version: options.version }),
      ...(options?.compress && { compressed: true }),
      ...(options?.encrypt && { encrypted: true })
    };
    
    const finalData = JSON.stringify(storageData);
    localStorage.setItem(key, finalData);
    
    // Sync across tabs if requested
    if (options?.syncAcrossTabs) {
      window.dispatchEvent(new CustomEvent('localStorage-update', {
        detail: { key, value: storageData }
      }));
    }
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

// Advanced storage utilities
export const removeStorageData = (key: string): void => {
  localStorage.removeItem(key);
  window.dispatchEvent(new CustomEvent('localStorage-remove', { detail: { key } }));
};

export const clearAllStorageData = (): void => {
  localStorage.clear();
  window.dispatchEvent(new CustomEvent('localStorage-clear'));
};

export const getStorageInfo = () => {
  const info = {
    totalSize: 0,
    itemCount: Object.keys(localStorage).length,
    items: {} as Record<string, { size: number; lastModified?: number }>
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      const size = new Blob([value || '']).size;
      info.totalSize += size;
      
      try {
        const parsed: StorageData<any> = JSON.parse(value || '{}');
        info.items[key] = {
          size,
          lastModified: parsed.timestamp
        };
      } catch {
        info.items[key] = { size };
      }
    }
  }
  
  return info;
};

export const cleanupExpiredData = (): number => {
  let cleanedCount = 0;
  const keys = Object.keys(localStorage);
  
  keys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed: StorageData<any> = JSON.parse(data);
        if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      }
    } catch {
      // Ignore parsing errors for non-enhanced storage items
    }
  });
  
  return cleanedCount;
};

// Storage quota management
export const getStorageQuota = async (): Promise<{ used: number; total: number; available: number }> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      total: estimate.quota || 0,
      available: (estimate.quota || 0) - (estimate.usage || 0)
    };
  }
  
  // Fallback estimation
  const used = new Blob(Object.values(localStorage)).size;
  return {
    used,
    total: 5 * 1024 * 1024, // Assume 5MB default
    available: (5 * 1024 * 1024) - used
  };
};

// Backup and restore utilities
export const createFullBackup = (): string => {
  const backup = {
    version: '3.0',
    timestamp: new Date().toISOString(),
    data: {} as Record<string, any>
  };
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      backup.data[key] = localStorage.getItem(key);
    }
  }
  
  return JSON.stringify(backup, null, 2);
};

export const restoreFromFullBackup = (backupData: string): { success: boolean; message: string; restored: number } => {
  try {
    const backup = JSON.parse(backupData);
    
    if (!backup.version || !backup.data) {
      return { success: false, message: 'Invalid backup format', restored: 0 };
    }
    
    let restored = 0;
    Object.entries(backup.data).forEach(([key, value]) => {
      localStorage.setItem(key, value as string);
      restored++;
    });
    
    return {
      success: true,
      message: `Successfully restored ${restored} items from backup`,
      restored
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to restore backup: ${error}`,
      restored: 0
    };
  }
};

// Enhanced storage hooks for React
export const useStorageSync = (key: string) => {
  const [data, setData] = useState<any>(null);
  
  useEffect(() => {
    const handleUpdate = (event: CustomEvent) => {
      if (event.detail.key === key) {
        setData(event.detail.value);
      }
    };
    
    const handleRemove = (event: CustomEvent) => {
      if (event.detail.key === key) {
        setData(null);
      }
    };
    
    const handleClear = () => {
      setData(null);
    };
    
    window.addEventListener('localStorage-update', handleUpdate as EventListener);
    window.addEventListener('localStorage-remove', handleRemove as EventListener);
    window.addEventListener('localStorage-clear', handleClear);
    
    // Initial load
    const initialData = localStorage.getItem(key);
    if (initialData) {
      try {
        const parsed: StorageData<any> = JSON.parse(initialData);
        setData(parsed);
      } catch {
        setData(null);
      }
    }
    
    return () => {
      window.removeEventListener('localStorage-update', handleUpdate as EventListener);
      window.removeEventListener('localStorage-remove', handleRemove as EventListener);
      window.removeEventListener('localStorage-clear', handleClear);
    };
  }, [key]);
  
  return data;
};