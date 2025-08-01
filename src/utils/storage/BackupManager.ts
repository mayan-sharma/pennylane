import type { Expense, Budget, BudgetTemplate, CustomCategory } from '../../types';
import { ExpenseStorage } from './ExpenseStorage';
import { BudgetStorage, BudgetTemplateStorage, CustomCategoryStorage } from './BudgetStorage';

interface BackupData {
  version: string;
  timestamp: string;
  expenses: Expense[];
  budgets: Budget[];
  customCategories: CustomCategory[];
  budgetTemplates: BudgetTemplate[];
  metadata: {
    totalExpenses: number;
    totalBudgets: number;
    totalAmount: number;
    dateRange?: {
      earliest: string;
      latest: string;
    };
  };
}

interface RestoreResult {
  success: boolean;
  message: string;
  count?: number;
  warnings?: string[];
}

export class BackupManager {
  private expenseStorage: ExpenseStorage;
  private budgetStorage: BudgetStorage;
  private templateStorage: BudgetTemplateStorage;
  private categoryStorage: CustomCategoryStorage;

  constructor() {
    this.expenseStorage = new ExpenseStorage();
    this.budgetStorage = new BudgetStorage();
    this.templateStorage = new BudgetTemplateStorage();
    this.categoryStorage = new CustomCategoryStorage();
  }

  createBackup(): string {
    const expenses = this.expenseStorage.getAll();
    const budgets = this.budgetStorage.getAll();
    const customCategories = this.categoryStorage.getAll();
    const budgetTemplates = this.templateStorage.getAll();
    
    // Calculate metadata
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const dates = expenses.map(e => e.date).sort();
    const dateRange = dates.length > 0 ? {
      earliest: dates[0],
      latest: dates[dates.length - 1]
    } : undefined;

    const backup: BackupData = {
      version: '2.0',
      timestamp: new Date().toISOString(),
      expenses,
      budgets,
      customCategories,
      budgetTemplates,
      metadata: {
        totalExpenses: expenses.length,
        totalBudgets: budgets.length,
        totalAmount,
        dateRange
      }
    };

    return JSON.stringify(backup, null, 2);
  }

  restoreFromBackup(backupData: string): RestoreResult {
    try {
      const backup: BackupData = JSON.parse(backupData);
      const warnings: string[] = [];
      
      // Validate backup format
      if (!backup.version || !backup.expenses || !Array.isArray(backup.expenses)) {
        return { success: false, message: 'Invalid backup format' };
      }

      // Version compatibility check
      if (backup.version !== '2.0' && backup.version !== '1.0') {
        warnings.push(`Backup version ${backup.version} may not be fully compatible`);
      }

      // Validate and restore expenses
      const validExpenses = backup.expenses.filter(expense => {
        const isValid = this.expenseStorage.validateExpense(expense);
        if (!isValid) {
          warnings.push(`Invalid expense data found and skipped: ${(expense as any)?.description || 'Unknown'}`);
        }
        return isValid;
      });

      // Validate and restore budgets
      const validBudgets = (backup.budgets || []).filter(budget => {
        const isValid = this.validateBudget(budget);
        if (!isValid) {
          warnings.push(`Invalid budget data found and skipped: ${(budget as any)?.category || 'Unknown'}`);
        }
        return isValid;
      });

      // Validate and restore custom categories
      const validCategories = (backup.customCategories || []).filter(category => {
        const isValid = this.validateCustomCategory(category);
        if (!isValid) {
          warnings.push(`Invalid category data found and skipped: ${(category as any)?.name || 'Unknown'}`);
        }
        return isValid;
      });

      // Validate and restore budget templates
      const validTemplates = (backup.budgetTemplates || []).filter(template => {
        const isValid = this.validateBudgetTemplate(template);
        if (!isValid) {
          warnings.push(`Invalid template data found and skipped: ${(template as any)?.name || 'Unknown'}`);
        }
        return isValid;
      });

      // Clear existing data and restore
      this.expenseStorage.clear();
      this.budgetStorage.clear();
      this.categoryStorage.clear();
      this.templateStorage.clear();

      // Restore data
      this.expenseStorage.bulkAdd(validExpenses);
      this.budgetStorage.bulkAdd(validBudgets);
      this.categoryStorage.bulkAdd(validCategories);
      this.templateStorage.bulkAdd(validTemplates);

      const totalRestored = validExpenses.length + validBudgets.length + validCategories.length + validTemplates.length;

      return {
        success: true,
        message: `Successfully restored ${validExpenses.length} expenses, ${validBudgets.length} budgets, ${validCategories.length} categories, and ${validTemplates.length} templates`,
        count: totalRestored,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('Backup restore error:', error);
      return {
        success: false,
        message: `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  exportToCSV(): { expenses: string; budgets: string } {
    const expenses = this.expenseStorage.getAll();
    const budgets = this.budgetStorage.getAll();

    // Generate expenses CSV
    const expenseHeaders = ['ID', 'Date', 'Amount', 'Category', 'Description', 'Merchant', 'Payment Method', 'Tags', 'Created At'];
    const expenseRows = expenses.map(expense => [
      expense.id,
      expense.date,
      expense.amount.toString(),
      expense.category,
      expense.description,
      expense.merchant || '',
      expense.paymentMethod || '',
      expense.tags?.join(';') || '',
      expense.createdAt
    ]);

    const expensesCSV = [expenseHeaders, ...expenseRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Generate budgets CSV
    const budgetHeaders = ['ID', 'Category', 'Amount', 'Period', 'Type', 'Alert Thresholds', 'Rollover Enabled', 'Created At'];
    const budgetRows = budgets.map(budget => [
      budget.id,
      budget.category,
      budget.amount.toString(),
      budget.period,
      budget.type,
      budget.alertThresholds.join(';'),
      budget.rolloverEnabled.toString(),
      budget.createdAt
    ]);

    const budgetsCSV = [budgetHeaders, ...budgetRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return {
      expenses: expensesCSV,
      budgets: budgetsCSV
    };
  }

  getBackupMetadata(): BackupData['metadata'] {
    const expenses = this.expenseStorage.getAll();
    const budgets = this.budgetStorage.getAll();
    
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const dates = expenses.map(e => e.date).sort();
    const dateRange = dates.length > 0 ? {
      earliest: dates[0],
      latest: dates[dates.length - 1]
    } : undefined;

    return {
      totalExpenses: expenses.length,
      totalBudgets: budgets.length,
      totalAmount,
      dateRange
    };
  }

  private validateBudget(budget: unknown): budget is Budget {
    return budget !== null &&
           typeof budget === 'object' &&
           'id' in budget &&
           'category' in budget &&
           'amount' in budget &&
           'period' in budget &&
           'type' in budget &&
           'alertThresholds' in budget &&
           'rolloverEnabled' in budget &&
           'createdAt' in budget &&
           'updatedAt' in budget;
  }

  private validateCustomCategory(category: unknown): category is CustomCategory {
    return category !== null &&
           typeof category === 'object' &&
           'id' in category &&
           'name' in category &&
           'color' in category;
  }

  private validateBudgetTemplate(template: unknown): template is BudgetTemplate {
    return template !== null &&
           typeof template === 'object' &&
           'id' in template &&
           'name' in template &&
           'description' in template &&
           'budgets' in template &&
           'category' in template &&
           Array.isArray((template as any).budgets);
  }
}