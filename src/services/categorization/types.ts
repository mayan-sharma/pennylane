import type { Expense, ExpenseCategory } from '../../types';

export interface CategoryPrediction {
  category: ExpenseCategory;
  confidence: number;
  reasoning: string[];
  suggestedTags?: string[];
}

export interface CategorizationRule {
  id: string;
  type: 'merchant' | 'description' | 'amount' | 'pattern' | 'ml';
  condition: {
    field: string;
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex' | 'range';
    value: string | number | { min: number; max: number };
  };
  action: {
    category: ExpenseCategory;
    confidence: number;
    tags?: string[];
    merchant?: string; // For merchant name cleanup
  };
  priority: number;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  accuracy: number; // How often this rule is correct when applied
  isUserCreated: boolean;
  isActive: boolean;
}

export interface LearningPattern {
  id: string;
  type: 'merchant_category' | 'description_keyword' | 'amount_category' | 'time_category' | 'combo_pattern';
  pattern: any;
  category: ExpenseCategory;
  confidence: number;
  occurrences: number;
  accuracy: number;
  lastSeen: string;
  examples: string[]; // Sample expenses that created this pattern
}

export interface UserCorrection {
  id: string;
  originalCategory: ExpenseCategory;
  correctedCategory: ExpenseCategory;
  expenseData: {
    merchant?: string;
    description: string;
    amount: number;
    date: string;
  };
  timestamp: string;
  reason?: string; // User-provided reason for correction
}

export interface ModelMetrics {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  categoryAccuracy: Record<ExpenseCategory, { correct: number; total: number; accuracy: number }>;
  rulesPerformance: Record<string, { accuracy: number; usage: number }>;
  lastTraining: string;
  modelVersion: string;
}

export interface ExpenseData {
  merchant?: string;
  description: string;
  amount: number;
  date: string;
  location?: any;
}