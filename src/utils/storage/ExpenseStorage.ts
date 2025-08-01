import type { Expense, ExpenseFilters } from '../../types';
import { BaseStorage } from './BaseStorage';

export class ExpenseStorage extends BaseStorage<Expense> {
  constructor() {
    super('expense-tracker-data');
  }

  getFilteredExpenses(filters: ExpenseFilters): Expense[] {
    const expenses = this.getAll();
    
    return expenses.filter(expense => {
      // Category filter
      if (filters.category && expense.category !== filters.category) {
        return false;
      }
      
      // Date range filter
      if (filters.dateFrom && expense.date < filters.dateFrom) {
        return false;
      }
      
      if (filters.dateTo && expense.date > filters.dateTo) {
        return false;
      }
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesDescription = expense.description.toLowerCase().includes(searchLower);
        const matchesMerchant = expense.merchant?.toLowerCase().includes(searchLower);
        const matchesTags = expense.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!matchesDescription && !matchesMerchant && !matchesTags) {
          return false;
        }
      }
      
      return true;
    });
  }

  getExpensesByDateRange(startDate: string, endDate: string): Expense[] {
    const expenses = this.getAll();
    return expenses.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    );
  }

  getExpensesByCategory(category: string): Expense[] {
    return this.findByField('category', category);
  }

  getRecentExpenses(limit: number = 10): Expense[] {
    const expenses = this.getAll();
    return expenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getExpensesByMerchant(merchant: string): Expense[] {
    const expenses = this.getAll();
    return expenses.filter(expense => 
      expense.merchant?.toLowerCase().includes(merchant.toLowerCase())
    );
  }

  getExpensesWithReceipts(): Expense[] {
    const expenses = this.getAll();
    return expenses.filter(expense => expense.receipts && expense.receipts.length > 0);
  }

  getRecurringExpenses(): Expense[] {
    const expenses = this.getAll();
    return expenses.filter(expense => expense.isRecurring);
  }

  getTotalSpentByCategory(): Record<string, number> {
    const expenses = this.getAll();
    const totals: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const category = expense.category;
      totals[category] = (totals[category] || 0) + expense.amount;
    });
    
    return totals;
  }

  getTotalSpentInPeriod(startDate: string, endDate: string): number {
    const expenses = this.getExpensesByDateRange(startDate, endDate);
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  }

  getAverageExpenseAmount(): number {
    const expenses = this.getAll();
    if (expenses.length === 0) return 0;
    
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    return total / expenses.length;
  }

  getTopMerchants(limit: number = 5): Array<{ merchant: string; total: number; count: number }> {
    const expenses = this.getAll();
    const merchantTotals: Record<string, { total: number; count: number }> = {};
    
    expenses.forEach(expense => {
      if (expense.merchant) {
        const merchant = expense.merchant;
        if (!merchantTotals[merchant]) {
          merchantTotals[merchant] = { total: 0, count: 0 };
        }
        merchantTotals[merchant].total += expense.amount;
        merchantTotals[merchant].count += 1;
      }
    });
    
    return Object.entries(merchantTotals)
      .map(([merchant, data]) => ({ merchant, ...data }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  validateExpense(expense: unknown): expense is Expense {
    return expense !== null && 
           typeof expense === 'object' &&
           'id' in expense &&
           'date' in expense &&
           'amount' in expense &&
           'category' in expense &&
           'description' in expense &&
           'createdAt' in expense &&
           'updatedAt' in expense &&
           typeof (expense as any).id === 'string' &&
           typeof (expense as any).date === 'string' &&
           typeof (expense as any).amount === 'number' &&
           typeof (expense as any).category === 'string' &&
           typeof (expense as any).description === 'string' &&
           typeof (expense as any).createdAt === 'string' &&
           typeof (expense as any).updatedAt === 'string';
  }
}