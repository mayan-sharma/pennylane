/**
 * Intelligent Auto-categorization Service
 * Uses machine learning patterns to automatically categorize expenses
 * Learns from user corrections and patterns over time
 */

import { type Expense, ExpenseCategory } from '../types';

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

class CategorizationService {
  private rules: CategorizationRule[] = [];
  private patterns: LearningPattern[] = [];
  private corrections: UserCorrection[] = [];
  private metrics: ModelMetrics;
  private merchantMappings: Map<string, ExpenseCategory> = new Map();
  private keywordMappings: Map<string, ExpenseCategory> = new Map();

  constructor() {
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

  async categorizeExpense(expenseData: {
    merchant?: string;
    description: string;
    amount: number;
    date: string;
    location?: any;
  }): Promise<CategoryPrediction> {
    const predictions: CategoryPrediction[] = [];

    // 1. Apply rule-based categorization
    const rulePredictions = this.applyRules(expenseData);
    predictions.push(...rulePredictions);

    // 2. Apply ML pattern matching
    const patternPredictions = this.applyPatterns(expenseData);
    predictions.push(...patternPredictions);

    // 3. Apply merchant-based categorization
    const merchantPrediction = this.categorizeMerchant(expenseData.merchant || expenseData.description);
    if (merchantPrediction) {
      predictions.push(merchantPrediction);
    }

    // 4. Apply keyword-based categorization
    const keywordPrediction = this.categorizeByKeywords(expenseData.description);
    if (keywordPrediction) {
      predictions.push(keywordPrediction);
    }

    // 5. Apply amount-based patterns
    const amountPrediction = this.categorizeByAmount(expenseData.amount);
    if (amountPrediction) {
      predictions.push(amountPrediction);
    }

    // 6. Apply time-based patterns
    const timePrediction = this.categorizeByTime(expenseData.date, expenseData.amount);
    if (timePrediction) {
      predictions.push(timePrediction);
    }

    // Combine predictions using confidence weighting
    const finalPrediction = this.combinePredictions(predictions);
    
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
    await this.createPatternsFromCorrection(correction);

    // Update rule accuracies
    this.updateRuleAccuracies(expenseData, originalPrediction, correctedCategory);

    // Retrain if enough corrections accumulated
    if (this.corrections.length % 10 === 0) {
      await this.retrain();
    }

    this.saveStoredData();
  }

  async learnFromExpenses(expenses: Expense[]): Promise<void> {
    console.log(`Training categorization model with ${expenses.length} expenses...`);

    // Clear existing patterns to rebuild
    this.patterns = [];

    // Analyze merchant patterns
    this.analyzeMerchantPatterns(expenses);

    // Analyze description keyword patterns
    this.analyzeKeywordPatterns(expenses);

    // Analyze amount patterns
    this.analyzeAmountPatterns(expenses);

    // Analyze time-based patterns
    this.analyzeTimePatterns(expenses);

    // Analyze combination patterns
    this.analyzeCombinationPatterns(expenses);

    // Update metrics
    this.metrics.lastTraining = new Date().toISOString();
    this.saveStoredData();

    console.log(`Training complete. Generated ${this.patterns.length} patterns.`);
  }

  // === Rule Management ===

  createRule(rule: Omit<CategorizationRule, 'id' | 'createdAt' | 'lastUsed' | 'usageCount' | 'accuracy'>): CategorizationRule {
    const newRule: CategorizationRule = {
      ...rule,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      usageCount: 0,
      accuracy: 1.0,
    };

    this.rules.push(newRule);
    this.saveStoredData();
    return newRule;
  }

  updateRule(ruleId: string, updates: Partial<CategorizationRule>): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      Object.assign(rule, updates);
      this.saveStoredData();
    }
  }

  deleteRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
    this.saveStoredData();
  }

  getRules(): CategorizationRule[] {
    return [...this.rules];
  }

  // === Pattern Application ===

  private applyRules(expenseData: any): CategoryPrediction[] {
    const predictions: CategoryPrediction[] = [];

    for (const rule of this.rules.filter(r => r.isActive)) {
      if (this.ruleMatches(rule, expenseData)) {
        predictions.push({
          category: rule.action.category,
          confidence: rule.action.confidence * rule.accuracy,
          reasoning: [`Rule: ${this.describeRule(rule)}`],
          suggestedTags: rule.action.tags,
        });

        // Update rule usage
        rule.usageCount++;
        rule.lastUsed = new Date().toISOString();
      }
    }

    return predictions;
  }

  private applyPatterns(expenseData: any): CategoryPrediction[] {
    const predictions: CategoryPrediction[] = [];

    for (const pattern of this.patterns) {
      const confidence = this.calculatePatternMatch(pattern, expenseData);
      if (confidence > 0.3) { // Minimum confidence threshold
        predictions.push({
          category: pattern.category,
          confidence: confidence * pattern.accuracy,
          reasoning: [`Pattern: ${this.describePattern(pattern)}`],
        });
      }
    }

    return predictions;
  }

  private categorizeMerchant(merchantOrDescription: string): CategoryPrediction | null {
    const text = merchantOrDescription.toLowerCase();
    
    // Check exact merchant mappings first
    for (const [merchant, category] of this.merchantMappings) {
      if (text.includes(merchant.toLowerCase())) {
        return {
          category,
          confidence: 0.9,
          reasoning: [`Known merchant: ${merchant}`],
        };
      }
    }

    // Check common merchant patterns
    const merchantPatterns = [
      { patterns: ['starbucks', 'dunkin', 'coffee', 'cafe'], category: ExpenseCategory.FOOD, confidence: 0.85 },
      { patterns: ['uber', 'lyft', 'taxi', 'metro', 'bus'], category: ExpenseCategory.TRANSPORT, confidence: 0.9 },
      { patterns: ['amazon', 'ebay', 'walmart', 'target'], category: ExpenseCategory.SHOPPING, confidence: 0.8 },
      { patterns: ['netflix', 'spotify', 'cinema', 'movie'], category: ExpenseCategory.ENTERTAINMENT, confidence: 0.9 },
      { patterns: ['cvs', 'walgreens', 'pharmacy', 'medical'], category: ExpenseCategory.HEALTHCARE, confidence: 0.85 },
      { patterns: ['gas', 'shell', 'exxon', 'bp', 'fuel'], category: ExpenseCategory.TRANSPORT, confidence: 0.9 },
      { patterns: ['grocery', 'supermarket', 'kroger', 'safeway'], category: ExpenseCategory.FOOD, confidence: 0.85 },
    ];

    for (const pattern of merchantPatterns) {
      for (const keyword of pattern.patterns) {
        if (text.includes(keyword)) {
          return {
            category: pattern.category,
            confidence: pattern.confidence,
            reasoning: [`Merchant pattern: ${keyword}`],
          };
        }
      }
    }

    return null;
  }

  private categorizeByKeywords(description: string): CategoryPrediction | null {
    const text = description.toLowerCase();

    for (const [keyword, category] of this.keywordMappings) {
      if (text.includes(keyword)) {
        return {
          category,
          confidence: 0.7,
          reasoning: [`Keyword: ${keyword}`],
        };
      }
    }

    return null;
  }

  private categorizeByAmount(amount: number): CategoryPrediction | null {
    // Amount-based heuristics
    if (amount < 5) {
      return {
        category: ExpenseCategory.FOOD,
        confidence: 0.3,
        reasoning: ['Small amount typical for snacks/drinks'],
      };
    }

    if (amount > 500) {
      return {
        category: ExpenseCategory.SHOPPING,
        confidence: 0.4,
        reasoning: ['Large amount typical for major purchases'],
      };
    }

    return null;
  }

  private categorizeByTime(date: string, amount: number): CategoryPrediction | null {
    const expenseDate = new Date(date);
    const hour = expenseDate.getHours();
    const dayOfWeek = expenseDate.getDay();

    // Time-based patterns
    if (hour >= 6 && hour <= 10 && amount < 20) {
      return {
        category: ExpenseCategory.FOOD,
        confidence: 0.6,
        reasoning: ['Morning time suggests breakfast'],
      };
    }

    if (hour >= 11 && hour <= 14 && amount < 30) {
      return {
        category: ExpenseCategory.FOOD,
        confidence: 0.7,
        reasoning: ['Lunch time pattern'],
      };
    }

    if ((dayOfWeek === 0 || dayOfWeek === 6) && amount > 50) {
      return {
        category: ExpenseCategory.ENTERTAINMENT,
        confidence: 0.5,
        reasoning: ['Weekend spending pattern'],
      };
    }

    return null;
  }

  private combinePredictions(predictions: CategoryPrediction[]): CategoryPrediction {
    if (predictions.length === 0) {
      return {
        category: ExpenseCategory.OTHER,
        confidence: 0.1,
        reasoning: ['No matching patterns found'],
      };
    }

    // Group by category and combine confidences
    const categoryScores = new Map<ExpenseCategory, { score: number; reasoning: string[] }>();

    for (const prediction of predictions) {
      const existing = categoryScores.get(prediction.category);
      if (existing) {
        // Combine confidence scores (not simply add to avoid over-confidence)
        existing.score = existing.score + prediction.confidence * (1 - existing.score);
        existing.reasoning.push(...prediction.reasoning);
      } else {
        categoryScores.set(prediction.category, {
          score: prediction.confidence,
          reasoning: [...prediction.reasoning],
        });
      }
    }

    // Find the category with highest combined score
    let bestCategory = ExpenseCategory.OTHER;
    let bestScore = 0;
    let bestReasoning: string[] = [];

    for (const [category, data] of categoryScores) {
      if (data.score > bestScore) {
        bestCategory = category;
        bestScore = data.score;
        bestReasoning = data.reasoning;
      }
    }

    return {
      category: bestCategory,
      confidence: Math.min(bestScore, 0.95), // Cap confidence at 95%
      reasoning: bestReasoning,
    };
  }

  // === Pattern Analysis ===

  private analyzeMerchantPatterns(expenses: Expense[]): void {
    const merchantCategories = new Map<string, Map<ExpenseCategory, number>>();

    for (const expense of expenses) {
      if (!expense.merchant) continue;
      
      const merchant = expense.merchant.toLowerCase();
      if (!merchantCategories.has(merchant)) {
        merchantCategories.set(merchant, new Map());
      }
      
      const categoryMap = merchantCategories.get(merchant)!;
      categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + 1);
    }

    // Create patterns for merchants with strong category associations
    for (const [merchant, categoryMap] of merchantCategories) {
      const total = Array.from(categoryMap.values()).reduce((sum, count) => sum + count, 0);
      if (total < 3) continue; // Need at least 3 occurrences

      const mostCommonCategory = Array.from(categoryMap.entries())
        .reduce((best, [category, count]) => count > best.count ? { category, count } : best, 
                { category: ExpenseCategory.OTHER, count: 0 });

      const confidence = mostCommonCategory.count / total;
      if (confidence >= 0.7) { // At least 70% consistency
        this.merchantMappings.set(merchant, mostCommonCategory.category);
        
        this.patterns.push({
          id: crypto.randomUUID(),
          type: 'merchant_category',
          pattern: { merchant },
          category: mostCommonCategory.category,
          confidence,
          occurrences: total,
          accuracy: confidence,
          lastSeen: new Date().toISOString(),
          examples: expenses.filter(e => e.merchant?.toLowerCase() === merchant)
                           .slice(0, 3)
                           .map(e => e.description),
        });
      }
    }
  }

  private analyzeKeywordPatterns(expenses: Expense[]): void {
    const keywordCategories = new Map<string, Map<ExpenseCategory, number>>();

    for (const expense of expenses) {
      const words = expense.description.toLowerCase()
                                      .split(/\s+/)
                                      .filter(word => word.length > 2);
      
      for (const word of words) {
        if (!keywordCategories.has(word)) {
          keywordCategories.set(word, new Map());
        }
        
        const categoryMap = keywordCategories.get(word)!;
        categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + 1);
      }
    }

    // Create patterns for keywords with strong category associations
    for (const [keyword, categoryMap] of keywordCategories) {
      const total = Array.from(categoryMap.values()).reduce((sum, count) => sum + count, 0);
      if (total < 5) continue; // Need at least 5 occurrences

      const mostCommonCategory = Array.from(categoryMap.entries())
        .reduce((best, [category, count]) => count > best.count ? { category, count } : best, 
                { category: ExpenseCategory.OTHER, count: 0 });

      const confidence = mostCommonCategory.count / total;
      if (confidence >= 0.75) { // At least 75% consistency for keywords
        this.keywordMappings.set(keyword, mostCommonCategory.category);
        
        this.patterns.push({
          id: crypto.randomUUID(),
          type: 'description_keyword',
          pattern: { keyword },
          category: mostCommonCategory.category,
          confidence,
          occurrences: total,
          accuracy: confidence,
          lastSeen: new Date().toISOString(),
          examples: expenses.filter(e => e.description.toLowerCase().includes(keyword))
                           .slice(0, 3)
                           .map(e => e.description),
        });
      }
    }
  }

  private analyzeAmountPatterns(expenses: Expense[]): void {
    const categoryAmounts = new Map<ExpenseCategory, number[]>();

    for (const expense of expenses) {
      if (!categoryAmounts.has(expense.category)) {
        categoryAmounts.set(expense.category, []);
      }
      categoryAmounts.get(expense.category)!.push(expense.amount);
    }

    // Create amount range patterns for each category
    for (const [category, amounts] of categoryAmounts) {
      if (amounts.length < 10) continue; // Need enough data

      amounts.sort((a, b) => a - b);
      const q1 = amounts[Math.floor(amounts.length * 0.25)];
      const q3 = amounts[Math.floor(amounts.length * 0.75)];

      this.patterns.push({
        id: crypto.randomUUID(),
        type: 'amount_category',
        pattern: { category, range: { min: q1, max: q3 } },
        category,
        confidence: 0.6,
        occurrences: amounts.length,
        accuracy: 0.6,
        lastSeen: new Date().toISOString(),
        examples: [`Typical ${category} amounts: $${q1.toFixed(2)} - $${q3.toFixed(2)}`],
      });
    }
  }

  private analyzeTimePatterns(expenses: Expense[]): void {
    // Analyze spending patterns by time of day and day of week
    const timePatterns = new Map<string, Map<ExpenseCategory, number>>();

    for (const expense of expenses) {
      const date = new Date(expense.date);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      const timeKey = `${dayOfWeek}-${Math.floor(hour / 4)}`; // 6 time periods per day
      
      if (!timePatterns.has(timeKey)) {
        timePatterns.set(timeKey, new Map());
      }
      
      const categoryMap = timePatterns.get(timeKey)!;
      categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + 1);
    }

    // Create patterns for strong time-category associations
    for (const [timeKey, categoryMap] of timePatterns) {
      const total = Array.from(categoryMap.values()).reduce((sum, count) => sum + count, 0);
      if (total < 10) continue;

      const mostCommonCategory = Array.from(categoryMap.entries())
        .reduce((best, [category, count]) => count > best.count ? { category, count } : best, 
                { category: ExpenseCategory.OTHER, count: 0 });

      const confidence = mostCommonCategory.count / total;
      if (confidence >= 0.6) {
        this.patterns.push({
          id: crypto.randomUUID(),
          type: 'time_category',
          pattern: { timeKey, dayOfWeek: parseInt(timeKey.split('-')[0]), timePeriod: parseInt(timeKey.split('-')[1]) },
          category: mostCommonCategory.category,
          confidence,
          occurrences: total,
          accuracy: confidence,
          lastSeen: new Date().toISOString(),
          examples: [`${mostCommonCategory.category} spending pattern at time ${timeKey}`],
        });
      }
    }
  }

  private analyzeCombinationPatterns(expenses: Expense[]): void {
    // Analyze patterns that combine multiple factors
    const combos = new Map<string, { category: ExpenseCategory; count: number }>();

    for (const expense of expenses) {
      if (!expense.merchant) continue;

      const amount = expense.amount;
      const amountRange = amount < 10 ? 'small' : amount < 50 ? 'medium' : 'large';
      const comboKey = `${expense.merchant.toLowerCase()}-${amountRange}`;

      if (!combos.has(comboKey)) {
        combos.set(comboKey, { category: expense.category, count: 0 });
      }
      
      const combo = combos.get(comboKey)!;
      if (combo.category === expense.category) {
        combo.count++;
      }
    }

    // Create patterns for stable combinations
    for (const [comboKey, data] of combos) {
      if (data.count >= 3) {
        const [merchant, amountRange] = comboKey.split('-');
        
        this.patterns.push({
          id: crypto.randomUUID(),
          type: 'combo_pattern',
          pattern: { merchant, amountRange },
          category: data.category,
          confidence: 0.8,
          occurrences: data.count,
          accuracy: 0.8,
          lastSeen: new Date().toISOString(),
          examples: [`${merchant} + ${amountRange} amount → ${data.category}`],
        });
      }
    }
  }

  // === Helper Methods ===

  private ruleMatches(rule: CategorizationRule, expenseData: any): boolean {
    const { field, operator, value } = rule.condition;
    const fieldValue = this.getFieldValue(expenseData, field);

    switch (operator) {
      case 'contains':
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().includes(String(value).toLowerCase());
      case 'equals':
        return fieldValue === value;
      case 'startsWith':
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().startsWith(String(value).toLowerCase());
      case 'endsWith':
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().endsWith(String(value).toLowerCase());
      case 'regex':
        return typeof fieldValue === 'string' && 
               new RegExp(String(value), 'i').test(fieldValue);
      case 'range':
        return typeof fieldValue === 'number' && 
               typeof value === 'object' && 
               'min' in value && 'max' in value &&
               fieldValue >= value.min && fieldValue <= value.max;
      default:
        return false;
    }
  }

  private getFieldValue(expenseData: any, field: string): any {
    const fields = field.split('.');
    let value = expenseData;
    for (const f of fields) {
      value = value?.[f];
    }
    return value;
  }

  private calculatePatternMatch(pattern: LearningPattern, expenseData: any): number {
    switch (pattern.type) {
      case 'merchant_category':
        const merchant = (expenseData.merchant || expenseData.description).toLowerCase();
        return merchant.includes(pattern.pattern.merchant) ? pattern.confidence : 0;
      
      case 'description_keyword':
        const description = expenseData.description.toLowerCase();
        return description.includes(pattern.pattern.keyword) ? pattern.confidence : 0;
      
      case 'amount_category':
        const amount = expenseData.amount;
        const range = pattern.pattern.range;
        return (amount >= range.min && amount <= range.max) ? pattern.confidence : 0;
      
      case 'time_category':
        const date = new Date(expenseData.date);
        const dayOfWeek = date.getDay();
        const timePeriod = Math.floor(date.getHours() / 4);
        return (dayOfWeek === pattern.pattern.dayOfWeek && timePeriod === pattern.pattern.timePeriod) ? 
               pattern.confidence : 0;
      
      case 'combo_pattern':
        const comboMerchant = (expenseData.merchant || expenseData.description).toLowerCase();
        const comboAmount = expenseData.amount;
        const comboAmountRange = comboAmount < 10 ? 'small' : comboAmount < 50 ? 'medium' : 'large';
        return (comboMerchant.includes(pattern.pattern.merchant) && 
                comboAmountRange === pattern.pattern.amountRange) ? pattern.confidence : 0;
      
      default:
        return 0;
    }
  }

  private describeRule(rule: CategorizationRule): string {
    const { field, operator, value } = rule.condition;
    return `${field} ${operator} ${JSON.stringify(value)} → ${rule.action.category}`;
  }

  private describePattern(pattern: LearningPattern): string {
    switch (pattern.type) {
      case 'merchant_category':
        return `Merchant "${pattern.pattern.merchant}" typically categorized as ${pattern.category}`;
      case 'description_keyword':
        return `Keyword "${pattern.pattern.keyword}" suggests ${pattern.category}`;
      case 'amount_category':
        return `Amount range $${pattern.pattern.range.min}-$${pattern.pattern.range.max} typical for ${pattern.category}`;
      case 'time_category':
        return `Time pattern suggests ${pattern.category}`;
      case 'combo_pattern':
        return `Merchant + amount pattern suggests ${pattern.category}`;
      default:
        return `Pattern suggests ${pattern.category}`;
    }
  }

  private async createPatternsFromCorrection(correction: UserCorrection): Promise<void> {
    // Create new patterns based on user corrections
    const { expenseData, correctedCategory } = correction;

    // Create merchant pattern if merchant exists
    if (expenseData.merchant) {
      this.merchantMappings.set(expenseData.merchant.toLowerCase(), correctedCategory);
    }

    // Create keyword patterns from description
    const keywords = expenseData.description.toLowerCase()
                                           .split(/\s+/)
                                           .filter(word => word.length > 3);
    
    for (const keyword of keywords) {
      this.keywordMappings.set(keyword, correctedCategory);
    }
  }

  private updateRuleAccuracies(
    expenseData: Expense, 
    prediction: CategoryPrediction, 
    actualCategory: ExpenseCategory
  ): void {
    for (const rule of this.rules) {
      if (this.ruleMatches(rule, expenseData)) {
        const wasCorrect = rule.action.category === actualCategory;
        // Update running accuracy
        rule.accuracy = (rule.accuracy * rule.usageCount + (wasCorrect ? 1 : 0)) / (rule.usageCount + 1);
      }
    }
  }

  private updateCategoryAccuracy(category: ExpenseCategory, wasCorrect: boolean): void {
    if (!this.metrics.categoryAccuracy[category]) {
      this.metrics.categoryAccuracy[category] = { correct: 0, total: 0, accuracy: 0 };
    }
    
    const categoryMetrics = this.metrics.categoryAccuracy[category];
    categoryMetrics.total++;
    if (wasCorrect) {
      categoryMetrics.correct++;
    }
    categoryMetrics.accuracy = categoryMetrics.correct / categoryMetrics.total;
    
    // Update overall accuracy
    this.metrics.accuracy = this.metrics.correctPredictions / this.metrics.totalPredictions;
  }

  private async retrain(): Promise<void> {
    console.log('Retraining categorization model...');
    
    // Analyze recent corrections to improve patterns
    const recentCorrections = this.corrections.slice(-50); // Last 50 corrections
    
    for (const correction of recentCorrections) {
      await this.createPatternsFromCorrection(correction);
    }
    
    // Remove low-performing rules
    this.rules = this.rules.filter(rule => 
      rule.isUserCreated || rule.accuracy > 0.3 || rule.usageCount < 5
    );
    
    this.metrics.lastTraining = new Date().toISOString();
    this.saveStoredData();
  }

  private initializeDefaultRules(): void {
    // Initialize with some basic rules
    const defaultRules: Omit<CategorizationRule, 'id' | 'createdAt' | 'lastUsed' | 'usageCount' | 'accuracy'>[] = [
      {
        type: 'merchant',
        condition: { field: 'merchant', operator: 'contains', value: 'starbucks' },
        action: { category: ExpenseCategory.FOOD, confidence: 0.9 },
        priority: 10,
        isUserCreated: false,
        isActive: true,
      },
      {
        type: 'description',
        condition: { field: 'description', operator: 'contains', value: 'uber' },
        action: { category: ExpenseCategory.TRANSPORT, confidence: 0.9 },
        priority: 10,
        isUserCreated: false,
        isActive: true,
      },
      {
        type: 'amount',
        condition: { field: 'amount', operator: 'range', value: { min: 500, max: 10000 } },
        action: { category: ExpenseCategory.SHOPPING, confidence: 0.4 },
        priority: 1,
        isUserCreated: false,
        isActive: true,
      },
    ];

    for (const ruleData of defaultRules) {
      this.createRule(ruleData);
    }
  }

  private loadStoredData(): void {
    try {
      const storedRules = localStorage.getItem('categorization_rules');
      if (storedRules) {
        this.rules = JSON.parse(storedRules);
      }

      const storedPatterns = localStorage.getItem('categorization_patterns');
      if (storedPatterns) {
        this.patterns = JSON.parse(storedPatterns);
      }

      const storedCorrections = localStorage.getItem('categorization_corrections');
      if (storedCorrections) {
        this.corrections = JSON.parse(storedCorrections);
      }

      const storedMetrics = localStorage.getItem('categorization_metrics');
      if (storedMetrics) {
        this.metrics = { ...this.metrics, ...JSON.parse(storedMetrics) };
      }
    } catch (error) {
      console.error('Failed to load categorization data:', error);
    }
  }

  private saveStoredData(): void {
    try {
      localStorage.setItem('categorization_rules', JSON.stringify(this.rules));
      localStorage.setItem('categorization_patterns', JSON.stringify(this.patterns));
      localStorage.setItem('categorization_corrections', JSON.stringify(this.corrections));
      localStorage.setItem('categorization_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save categorization data:', error);
    }
  }

  // === Public API ===

  getMetrics(): ModelMetrics {
    return { ...this.metrics };
  }

  getPatterns(): LearningPattern[] {
    return [...this.patterns];
  }

  getCorrections(): UserCorrection[] {
    return [...this.corrections];
  }

  clearLearningData(): void {
    this.patterns = [];
    this.corrections = [];
    this.merchantMappings.clear();
    this.keywordMappings.clear();
    this.metrics = {
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      categoryAccuracy: {} as Record<ExpenseCategory, { correct: number; total: number; accuracy: number }>,
      rulesPerformance: {},
      lastTraining: new Date().toISOString(),
      modelVersion: '1.0.0',
    };
    this.saveStoredData();
  }

  exportLearningData(): any {
    return {
      rules: this.rules,
      patterns: this.patterns,
      corrections: this.corrections,
      metrics: this.metrics,
      merchantMappings: Array.from(this.merchantMappings.entries()),
      keywordMappings: Array.from(this.keywordMappings.entries()),
    };
  }

  importLearningData(data: any): void {
    this.rules = data.rules || [];
    this.patterns = data.patterns || [];
    this.corrections = data.corrections || [];
    this.metrics = data.metrics || this.metrics;
    this.merchantMappings = new Map(data.merchantMappings || []);
    this.keywordMappings = new Map(data.keywordMappings || []);
    this.saveStoredData();
  }
}

// Export singleton instance
export const categorizationService = new CategorizationService();

// Export classes
export { CategorizationService };