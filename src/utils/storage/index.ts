// Export storage classes
export { BaseStorage } from './BaseStorage';
export { ExpenseStorage } from './ExpenseStorage';
export { BudgetStorage, BudgetTemplateStorage, CustomCategoryStorage } from './BudgetStorage';
export { BackupManager } from './BackupManager';

// Import classes for creating instances
import { ExpenseStorage } from './ExpenseStorage';
import { BudgetStorage, BudgetTemplateStorage, CustomCategoryStorage } from './BudgetStorage';
import { BackupManager } from './BackupManager';

export const expenseStorage = new ExpenseStorage();
export const budgetStorage = new BudgetStorage();
export const budgetTemplateStorage = new BudgetTemplateStorage();
export const customCategoryStorage = new CustomCategoryStorage();
export const backupManager = new BackupManager();

// Legacy compatibility - maintain the old interface
export const storage = {
  // Expense methods
  getExpenses: () => expenseStorage.getAll(),
  saveExpenses: (expenses: any[]) => {
    expenseStorage.clear();
    expenseStorage.bulkAdd(expenses);
  },
  addExpense: (expense: any) => expenseStorage.add(expense),
  updateExpense: (id: string, expense: any) => expenseStorage.update(id, expense),
  deleteExpense: (id: string) => expenseStorage.delete(id),
  clearAllExpenses: () => expenseStorage.clear(),

  // Budget methods
  getBudgets: () => budgetStorage.getAll(),
  saveBudgets: (budgets: any[]) => {
    budgetStorage.clear();
    budgetStorage.bulkAdd(budgets);
  },
  addBudget: (budget: any) => budgetStorage.add(budget),
  updateBudget: (id: string, budget: any) => budgetStorage.update(id, budget),
  deleteBudget: (id: string) => budgetStorage.delete(id),

  // Custom category methods
  getCustomCategories: () => customCategoryStorage.getAll(),
  saveCustomCategories: (categories: any[]) => {
    customCategoryStorage.clear();
    customCategoryStorage.bulkAdd(categories);
  },
  addCustomCategory: (category: any) => customCategoryStorage.add(category),
  updateCustomCategory: (id: string, category: any) => customCategoryStorage.update(id, category),
  deleteCustomCategory: (id: string) => customCategoryStorage.delete(id),

  // Budget template methods
  getBudgetTemplates: () => budgetTemplateStorage.getAll(),
  saveBudgetTemplates: (templates: any[]) => {
    budgetTemplateStorage.clear();
    budgetTemplateStorage.bulkAdd(templates);
  },
  addBudgetTemplate: (template: any) => budgetTemplateStorage.add(template),
  updateBudgetTemplate: (id: string, template: any) => budgetTemplateStorage.update(id, template),
  deleteBudgetTemplate: (id: string) => budgetTemplateStorage.delete(id),

  // Backup methods
  createBackup: () => backupManager.createBackup(),
  restoreFromBackup: (data: string) => backupManager.restoreFromBackup(data),
};