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
  data: Record<string, unknown>;
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

// Debt Payoff Tracker Types
export interface DebtPayoffGoal {
  id: string;
  name: string;
  totalAmount: number;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  targetDate?: string;
  strategy: 'snowball' | 'avalanche' | 'custom';
  priority: number;
  paymentHistory: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  principal: number;
  interest: number;
  remainingBalance: number;
}

// Investment Budget Goals
export interface InvestmentGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  category: 'retirement' | 'emergency' | 'education' | 'house' | 'vacation' | 'custom';
  autoInvest: boolean;
  linkedBudgetId?: string;
  milestones: InvestmentMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentMilestone {
  id: string;
  targetAmount: number;
  targetDate: string;
  description: string;
  achieved: boolean;
  achievedDate?: string;
  reward?: string;
}

// Gamification and Achievements
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'saving' | 'budgeting' | 'streak' | 'goal' | 'special';
  criteria: AchievementCriteria;
  rewardType: 'badge' | 'points' | 'milestone';
  points?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface AchievementCriteria {
  type: 'budget_adherence' | 'saving_streak' | 'goal_completion' | 'expense_reduction' | 'challenge_win';
  value: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
}

export interface UserProgress {
  id: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  badges: string[];
  challengesWon: number;
  challengesParticipated: number;
  lastActivityDate: string;
}

// Budget Challenges
export interface BudgetChallenge {
  id: string;
  title: string;
  description: string;
  type: 'saving' | 'spending_limit' | 'category_focus' | 'streak' | 'social';
  startDate: string;
  endDate: string;
  participants: ChallengeParticipant[];
  rules: ChallengeRules;
  rewards: ChallengeReward[];
  leaderboard: LeaderboardEntry[];
  status: 'upcoming' | 'active' | 'completed';
  createdBy: string;
  isPublic: boolean;
}

export interface ChallengeParticipant {
  userId: string;
  username: string;
  joinedDate: string;
  progress: number;
  rank: number;
  isCompleted: boolean;
}

export interface ChallengeRules {
  targetAmount?: number;
  targetCategory?: string;
  streakDays?: number;
  spendingLimit?: number;
  customRules?: string[];
}

export interface ChallengeReward {
  type: 'points' | 'badge' | 'achievement' | 'custom';
  value: string | number;
  description: string;
  rank: number; // 1st, 2nd, 3rd place etc.
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  progress: number;
  completedDate?: string;
}

// Family Budget Sharing
export interface FamilyBudget {
  id: string;
  name: string;
  members: FamilyMember[];
  sharedBudgets: Budget[];
  permissions: FamilyPermissions;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedDate: string;
  permissions: string[];
  allocatedBudgets: string[];
}

export interface FamilyPermissions {
  canCreateBudgets: string[];
  canEditBudgets: string[];
  canDeleteBudgets: string[];
  canViewReports: string[];
  canInviteMembers: string[];
  canManageRoles: string[];
}

// Budget Accountability Partners
export interface AccountabilityPartner {
  id: string;
  partnerId: string;
  partnerUsername: string;
  partnerEmail: string;
  status: 'pending' | 'active' | 'paused';
  sharedGoals: string[];
  checkInFrequency: 'daily' | 'weekly' | 'monthly';
  lastCheckIn: string;
  nextCheckIn: string;
  settings: PartnershipSettings;
  createdAt: string;
}

export interface PartnershipSettings {
  shareProgress: boolean;
  shareGoals: boolean;
  allowEncouragement: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  autoCheckIn: boolean;
}

export interface PartnerCheckIn {
  id: string;
  partnershipId: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'struggling';
  achievements: string[];
  challenges: string[];
  message?: string;
  encouragementSent: boolean;
}

// Smart Suggestions and Automation
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

// Seasonal Budget Adjustments
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

// Budget Scenario Planning
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

// Budget Efficiency Score
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

// Bank Integration (placeholder for future implementation)
export interface BankAccount {
  id: string;
  bankName: string;
  accountType: 'checking' | 'savings' | 'credit';
  accountNumber: string; // masked
  balance: number;
  currency: string;
  lastSynced: string;
  isActive: boolean;
  linkedBudgets: string[];
}

export interface BankTransaction {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  date: string;
  category?: string;
  merchant?: string;
  type: 'debit' | 'credit';
  isRecurring: boolean;
  linkedExpenseId?: string;
}