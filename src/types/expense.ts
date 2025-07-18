export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export enum ExpenseCategory {
  FOOD = 'Food',
  TRANSPORT = 'Transport',
  BILLS = 'Bills',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  HEALTHCARE = 'Healthcare',
  EDUCATION = 'Education',
  TRAVEL = 'Travel',
  HOUSING = 'Housing',
  OTHER = 'Other'
}

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