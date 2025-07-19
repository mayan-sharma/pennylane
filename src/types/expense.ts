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
  category: ExpenseCategory | 'total' | string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly' | 'daily';
  createdAt: string;
  updatedAt: string;
  type: 'standard' | 'savings' | 'envelope' | 'auto-adjusting';
  alertThresholds: number[];
  rolloverEnabled: boolean;
  rolloverAmount?: number;
  targetDate?: string;
  description?: string;
  templateId?: string;
  autoAdjustSettings?: {
    enabled: boolean;
    baselineMonths: number;
    adjustmentFactor: number;
  };
}

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  budgets: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>[];
  category: 'student' | 'family' | 'professional' | 'custom';
}

export interface BudgetFormData {
  category: ExpenseCategory | 'total' | string;
  amount: string;
  period: 'monthly' | 'weekly' | 'yearly' | 'daily';
  type: 'standard' | 'savings' | 'envelope' | 'auto-adjusting';
  alertThresholds: number[];
  rolloverEnabled: boolean;
  targetDate?: string;
  description?: string;
  autoAdjustSettings?: {
    enabled: boolean;
    baselineMonths: number;
    adjustmentFactor: number;
  };
}

export interface BudgetStatus {
  budget: Budget;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  projectedSpending: number;
  daysRemaining: number;
  averageDailySpending: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  previousPeriodComparison: {
    spent: number;
    change: number;
    changePercent: number;
  };
}

export interface BudgetAnalytics {
  monthlyTrends: {
    month: string;
    budgeted: number;
    spent: number;
    saved: number;
  }[];
  categoryPerformance: {
    category: string;
    averageUsage: number;
    consistency: number;
    trend: 'improving' | 'declining' | 'stable';
  }[];
  spendingPatterns: {
    dayOfWeek: { day: string; average: number }[];
    weekOfMonth: { week: number; average: number }[];
  };
  forecasting: {
    nextMonthPrediction: number;
    confidence: number;
    factors: string[];
  };
}

export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parentCategory?: ExpenseCategory;
}