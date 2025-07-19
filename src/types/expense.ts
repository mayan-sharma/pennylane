export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: ExpenseCategory | string; // Support custom categories
  description: string;
  createdAt: string;
  updatedAt: string;
  
  // New fields for enhanced functionality
  receipts?: Receipt[];
  tags?: string[];
  merchant?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  currency?: string;
  originalAmount?: number; // For multi-currency support
  exchangeRate?: number;
  recurringExpenseId?: string; // Link to recurring expense
  templateId?: string; // Link to expense template
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet' | 'other';
  notes?: string;
  isRecurring?: boolean;
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

export interface Receipt {
  id: string;
  filename: string;
  url: string;
  uploadDate: string;
  size: number;
  type: string;
  extractedData?: {
    amount?: number;
    merchant?: string;
    date?: string;
    items?: string[];
  };
}

export interface RecurringExpense {
  id: string;
  templateExpense: Omit<Expense, 'id' | 'date' | 'createdAt' | 'updatedAt' | 'recurringExpenseId'>;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  startDate: string;
  endDate?: string;
  nextDueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  generatedExpenses: string[]; // IDs of generated expenses
  reminderDays?: number; // Days before to remind
  autoGenerate: boolean;
}

export interface ExpenseTemplate {
  id: string;
  name: string;
  description?: string;
  category: ExpenseCategory | string;
  amount?: number;
  merchant?: string;
  tags?: string[];
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  isDefault?: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number; // Rate to base currency (INR)
  lastUpdated: string;
}

export interface ExpenseImportData {
  date: string;
  amount: number | string;
  category?: string;
  description: string;
  merchant?: string;
  paymentMethod?: string;
  currency?: string;
}

export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: string[];
  processedItems: number;
}

export interface AdvancedFilters extends ExpenseFilters {
  amountMin?: number;
  amountMax?: number;
  categories?: (ExpenseCategory | string)[];
  tags?: string[];
  merchants?: string[];
  paymentMethods?: string[];
  currencies?: string[];
  hasReceipts?: boolean;
  isRecurring?: boolean;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in kilometers
  };
}

export interface SpendingInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'trend' | 'suggestion';
  title: string;
  description: string;
  data: any;
  confidence: number;
  actionable: boolean;
  category?: ExpenseCategory | string;
  dateRange: {
    start: string;
    end: string;
  };
  createdAt: string;
}

export interface QuickAddPreset {
  id: string;
  name: string;
  icon?: string;
  amount?: number;
  category: ExpenseCategory | string;
  description?: string;
  merchant?: string;
  isDefault?: boolean;
}