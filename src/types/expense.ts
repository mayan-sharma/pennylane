export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const ExpenseCategory = {
  FOOD: 'Food',
  TRANSPORT: 'Transport',
  BILLS: 'Bills',
  ENTERTAINMENT: 'Entertainment',
  SHOPPING: 'Shopping',
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education',
  TRAVEL: 'Travel',
  HOUSING: 'Housing',
  OTHER: 'Other'
} as const;

export type ExpenseCategory = typeof ExpenseCategory[keyof typeof ExpenseCategory];

export interface ExpenseFilters {
  category?: ExpenseCategory;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}

export interface ExpenseFormData {
  date: string;
  amount: string;
  category: ExpenseCategory;
  description: string;
}

export interface ExpenseStats {
  total: number;
  byCategory: Record<ExpenseCategory, number>;
  thisMonth: number;
  thisWeek: number;
  count: number;
}

export interface Budget {
  id: string;
  category: ExpenseCategory | 'total';
  amount: number;
  period: 'monthly' | 'weekly';
  createdAt: string;
  updatedAt: string;
}

export interface BudgetFormData {
  category: ExpenseCategory | 'total';
  amount: string;
  period: 'monthly' | 'weekly';
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
}