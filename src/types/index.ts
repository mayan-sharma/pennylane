export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export interface ExpenseStats {
  total: number;
  monthlyTotal: number;
  categoryTotals: Record<string, number>;
  expenseCount: number;
}