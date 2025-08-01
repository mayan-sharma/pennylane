import type { Expense, ExpenseCategory } from '../../types';
import type { 
  CategoryPrediction, 
  CategorizationRule, 
  LearningPattern, 
  UserCorrection, 
  ModelMetrics,
  ExpenseData
} from './types';
import { RuleMatcher } from './RuleMatcher';
import { PatternLearner } from './PatternLearner';
import { CategoryPredictor } from './CategoryPredictor';

export class CategorizationService {
  private ruleMatcher: RuleMatcher;
  private patternLearner: PatternLearner;
  private categoryPredictor: CategoryPredictor;
  private corrections: UserCorrection[] = [];
  private metrics: ModelMetrics;

  constructor() {
    this.ruleMatcher = new RuleMatcher();
    this.patternLearner = new PatternLearner();
    this.categoryPredictor = new CategoryPredictor();
    
    this.metrics = {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      categoryAccuracy: {} as Record<ExpenseCategory, { correct: number; total: number; accuracy: number }>,
      rulesPerformance: {},
      lastTraining: new Date().toISOString(),
      modelVersion: '1.0.0',
    };
    
    this.initializeDefaultRules();
    this.loadStoredData();
  }

  // === Main Categorization API ===

  async categorizeExpense(expenseData: ExpenseData): Promise<CategoryPrediction> {
    const predictions: CategoryPrediction[] = [];

    // 1. Apply rule-based categorization
    const rulePredictions = this.ruleMatcher.applyRules(expenseData);
    predictions.push(...rulePredictions);

    // 2. Apply ML pattern matching
    const patternPredictions = this.patternLearner.applyPatterns(expenseData);
    predictions.push(...patternPredictions);

    // 3. Apply merchant-based categorization
    const merchantPrediction = this.categoryPredictor.categorizeMerchant(
      expenseData.merchant || expenseData.description
    );
    if (merchantPrediction) {
      predictions.push(merchantPrediction);
    }

    // 4. Apply keyword-based categorization
    const keywordPrediction = this.categoryPredictor.categorizeByKeywords(expenseData.description);
    if (keywordPrediction) {
      predictions.push(keywordPrediction);
    }

    // 5. Apply amount-based patterns
    const amountPrediction = this.categoryPredictor.categorizeByAmount(expenseData.amount);
    if (amountPrediction) {
      predictions.push(amountPrediction);
    }

    // 6. Apply time-based patterns
    const timePrediction = this.categoryPredictor.categorizeByTime(expenseData.date, expenseData.amount);
    if (timePrediction) {
      predictions.push(timePrediction);
    }

    // Combine predictions using confidence weighting
    const finalPrediction = this.categoryPredictor.combinePredictions(predictions);
    
    // Update metrics
    this.metrics.totalPredictions++;
    
    return finalPrediction;
  }

  // === Learning from User Feedback ===

  async learnFromCorrection(
    expenseData: Expense,
    originalPrediction: CategoryPrediction,
    correctedCategory: ExpenseCategory,
    reason?: string
  ): Promise<void> {
    // Record the correction
    const correction: UserCorrection = {
      id: crypto.randomUUID(),
      originalCategory: originalPrediction.category,
      correctedCategory,
      expenseData: {
        merchant: expenseData.merchant,
        description: expenseData.description,
        amount: expenseData.amount,
        date: expenseData.date,
      },
      timestamp: new Date().toISOString(),
      reason,
    };

    this.corrections.push(correction);

    // Update metrics
    if (originalPrediction.category === correctedCategory) {
      this.metrics.correctPredictions++;
    }
    this.updateCategoryAccuracy(correctedCategory, originalPrediction.category === correctedCategory);

    // Create or update patterns based on correction
    await this.patternLearner.createPatternsFromCorrection(correction);

    // Update merchant/keyword mappings
    if (expenseData.merchant) {
      this.categoryPredictor.updateMerchantMapping(expenseData.merchant, correctedCategory);
    }

    // Retrain if enough corrections accumulated
    if (this.corrections.length % 10 === 0) {
      await this.retrain();
    }

    this.saveStoredData();
  }

  async learnFromExpenses(expenses: Expense[]): Promise<void> {
    console.log(`Training categorization model with ${expenses.length} expenses...`);

    // Clear existing patterns to rebuild
    this.patternLearner.clearPatterns();

    for (const expense of expenses) {
      // Create patterns from existing categorized expenses
      const correction: UserCorrection = {
        id: crypto.randomUUID(),
        originalCategory: expense.category as ExpenseCategory,
        correctedCategory: expense.category as ExpenseCategory,
        expenseData: {
          merchant: expense.merchant,
          description: expense.description,
          amount: expense.amount,
          date: expense.date,
        },
        timestamp: expense.updatedAt,
      };

      await this.patternLearner.createPatternsFromCorrection(correction);
    }

    this.metrics.lastTraining = new Date().toISOString();
    this.saveStoredData();
  }

  // === Rule Management ===

  addCustomRule(rule: Omit<CategorizationRule, 'id' | 'createdAt' | 'usageCount' | 'accuracy'>): void {
    const newRule: CategorizationRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      usageCount: 0,
      accuracy: 0.8,
      isUserCreated: true,
    };

    const rules = this.ruleMatcher.getRules();
    rules.push(newRule);
    this.ruleMatcher.setRules(rules);
    this.saveStoredData();
  }

  updateRule(ruleId: string, updates: Partial<CategorizationRule>): void {
    const rules = this.ruleMatcher.getRules();
    const ruleIndex = rules.findIndex(r => r.id === ruleId);
    
    if (ruleIndex !== -1) {
      rules[ruleIndex] = { ...rules[ruleIndex], ...updates };
      this.ruleMatcher.setRules(rules);
      this.saveStoredData();
    }
  }

  deleteRule(ruleId: string): void {
    const rules = this.ruleMatcher.getRules().filter(r => r.id !== ruleId);
    this.ruleMatcher.setRules(rules);
    this.saveStoredData();
  }

  getRules(): CategorizationRule[] {
    return this.ruleMatcher.getRules();
  }

  // === Analytics and Metrics ===

  getMetrics(): ModelMetrics {
    this.metrics.accuracy = this.metrics.totalPredictions > 0 
      ? this.metrics.correctPredictions / this.metrics.totalPredictions 
      : 0;
    return { ...this.metrics };
  }

  getPatterns(): LearningPattern[] {
    return this.patternLearner.getPatterns();
  }

  getCorrections(): UserCorrection[] {
    return [...this.corrections];
  }

  // === Private Methods ===

  private initializeDefaultRules(): void {
    const defaultRules = this.ruleMatcher.createDefaultRules();
    this.ruleMatcher.setRules(defaultRules);
  }

  private updateCategoryAccuracy(category: ExpenseCategory, isCorrect: boolean): void {
    if (!this.metrics.categoryAccuracy[category]) {
      this.metrics.categoryAccuracy[category] = { correct: 0, total: 0, accuracy: 0 };
    }
    
    const categoryMetrics = this.metrics.categoryAccuracy[category];
    categoryMetrics.total++;
    if (isCorrect) {
      categoryMetrics.correct++;
    }
    categoryMetrics.accuracy = categoryMetrics.correct / categoryMetrics.total;
  }

  private async retrain(): Promise<void> {
    console.log('Retraining categorization model...');
    
    // Analyze recent corrections and update patterns
    const recentCorrections = this.corrections.slice(-50); // Last 50 corrections
    
    for (const correction of recentCorrections) {
      await this.patternLearner.createPatternsFromCorrection(correction);
    }
    
    this.metrics.lastTraining = new Date().toISOString();
  }

  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem('categorization-service-data');
      if (stored) {
        const data = JSON.parse(stored);
        
        if (data.rules) {
          this.ruleMatcher.setRules(data.rules);
        }
        
        if (data.patterns) {
          this.patternLearner.setPatterns(data.patterns);
        }
        
        if (data.corrections) {
          this.corrections = data.corrections;
        }
        
        if (data.metrics) {
          this.metrics = { ...this.metrics, ...data.metrics };
        }
      }
    } catch (error) {
      console.warn('Failed to load categorization service data:', error);
    }
  }

  private saveStoredData(): void {
    try {
      const data = {
        rules: this.ruleMatcher.getRules(),
        patterns: this.patternLearner.getPatterns(),
        corrections: this.corrections.slice(-100), // Keep last 100 corrections
        metrics: this.metrics,
        lastSaved: new Date().toISOString(),
      };
      
      localStorage.setItem('categorization-service-data', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save categorization service data:', error);
    }
  }

  // === Export Types ===
  static types = {
    CategoryPrediction,
    CategorizationRule,
    LearningPattern,
    UserCorrection,
    ModelMetrics,
  };
}

// Export the service instance
export const categorizationService = new CategorizationService();

// Export types
export type {
  CategoryPrediction,
  CategorizationRule,
  LearningPattern,
  UserCorrection,
  ModelMetrics,
  ExpenseData,
};

// Export classes for advanced usage
export { RuleMatcher, PatternLearner, CategoryPredictor };