import type { Budget, BudgetTemplate, CustomCategory } from '../../types';
import { BaseStorage } from './BaseStorage';

export class BudgetStorage extends BaseStorage<Budget> {
  constructor() {
    super('expense-tracker-budgets');
  }

  getBudgetsByCategory(category: string): Budget[] {
    return this.findByField('category', category);
  }

  getBudgetsByPeriod(period: 'monthly' | 'weekly' | 'yearly' | 'daily'): Budget[] {
    return this.findByField('period', period);
  }

  getBudgetsByType(type: 'standard' | 'savings' | 'envelope' | 'auto-adjusting'): Budget[] {
    return this.findByField('type', type);
  }

  getActiveBudgets(): Budget[] {
    const budgets = this.getAll();
    const now = new Date();
    
    return budgets.filter(budget => {
      if (!budget.targetDate) return true;
      return new Date(budget.targetDate) >= now;
    });
  }

  getExpiredBudgets(): Budget[] {
    const budgets = this.getAll();
    const now = new Date();
    
    return budgets.filter(budget => {
      if (!budget.targetDate) return false;
      return new Date(budget.targetDate) < now;
    });
  }

  getBudgetsWithRollover(): Budget[] {
    const budgets = this.getAll();
    return budgets.filter(budget => budget.rolloverEnabled);
  }

  getBudgetsWithAutoAdjust(): Budget[] {
    const budgets = this.getAll();
    return budgets.filter(budget => 
      budget.autoAdjustSettings?.enabled === true
    );
  }

  getTotalBudgetAmount(): number {
    const budgets = this.getAll();
    return budgets.reduce((total, budget) => total + budget.amount, 0);
  }

  getBudgetsByAlertThreshold(threshold: number): Budget[] {
    const budgets = this.getAll();
    return budgets.filter(budget => 
      budget.alertThresholds.includes(threshold)
    );
  }
}

export class BudgetTemplateStorage extends BaseStorage<BudgetTemplate> {
  constructor() {
    super('expense-tracker-budget-templates');
  }

  getTemplatesByCategory(category: 'student' | 'family' | 'professional' | 'custom'): BudgetTemplate[] {
    return this.findByField('category', category);
  }

  getDefaultTemplates(): BudgetTemplate[] {
    const templates = this.getAll();
    return templates.filter(template => template.category !== 'custom');
  }

  getCustomTemplates(): BudgetTemplate[] {
    return this.getTemplatesByCategory('custom');
  }
}

export class CustomCategoryStorage extends BaseStorage<CustomCategory> {
  constructor() {
    super('expense-tracker-custom-categories');
  }

  getCategoriesByParent(parentCategory: string): CustomCategory[] {
    return this.findByField('parentCategory', parentCategory);
  }

  getCategoriesByColor(color: string): CustomCategory[] {
    return this.findByField('color', color);
  }

  getCategoryByName(name: string): CustomCategory | undefined {
    const categories = this.getAll();
    return categories.find(category => 
      category.name.toLowerCase() === name.toLowerCase()
    );
  }

  validateCategoryName(name: string, excludeId?: string): boolean {
    const categories = this.getAll();
    return !categories.some(category => 
      category.name.toLowerCase() === name.toLowerCase() && 
      category.id !== excludeId
    );
  }
}