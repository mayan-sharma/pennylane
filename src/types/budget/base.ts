import type { ExpenseCategory } from '../expense/base';

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

export interface SeasonalAdjustment {
  id: string;
  name: string;
  budgetId: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday' | 'custom';
  adjustmentType: 'percentage' | 'fixed_amount';
  adjustmentValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoApply: boolean;
  description?: string;
}

export interface BudgetScenario {
  id: string;
  name: string;
  description: string;
  baselineBudgets: Budget[];
  adjustments: ScenarioAdjustment[];
  outcomes: ScenarioOutcome;
  assumptions: string[];
  createdAt: string;
  lastCalculated: string;
}

export interface ScenarioAdjustment {
  budgetId: string;
  category: string;
  adjustmentType: 'percentage' | 'fixed_amount';
  value: number;
  reason: string;
}

export interface ScenarioOutcome {
  totalBudget: number;
  projectedSpending: number;
  projectedSavings: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  monthlyBreakdown: {
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }[];
}

export interface BudgetEfficiencyScore {
  id: string;
  userId: string;
  overallScore: number;
  components: {
    adherence: number;
    optimization: number;
    consistency: number;
    goalProgress: number;
    savingsRate: number;
  };
  recommendations: EfficiencyRecommendation[];
  historicalScores: {
    date: string;
    score: number;
  }[];
  calculatedAt: string;
}

export interface EfficiencyRecommendation {
  type: 'adherence' | 'optimization' | 'goal_setting' | 'automation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  category?: string;
}

export interface SmartSuggestion {
  id: string;
  type: 'category_optimization' | 'budget_adjustment' | 'saving_opportunity' | 'spending_pattern';
  title: string;
  description: string;
  confidence: number;
  potentialSavings?: number;
  actionable: boolean;
  actions: SuggestionAction[];
  category?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  appliedAt?: string;
}

export interface SuggestionAction {
  type: 'create_budget' | 'adjust_budget' | 'create_category' | 'set_alert';
  data: Record<string, unknown>;
  description: string;
}