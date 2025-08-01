import type { ExpenseCategory } from '../../types';
import type { LearningPattern, CategoryPrediction, ExpenseData, UserCorrection } from './types';

export class PatternLearner {
  private patterns: LearningPattern[] = [];

  constructor(patterns: LearningPattern[] = []) {
    this.patterns = patterns;
  }

  setPatterns(patterns: LearningPattern[]): void {
    this.patterns = patterns;
  }

  applyPatterns(expenseData: ExpenseData): CategoryPrediction[] {
    const predictions: CategoryPrediction[] = [];

    for (const pattern of this.patterns) {
      const confidence = this.evaluatePattern(pattern, expenseData);
      
      if (confidence > 0.3) { // Minimum confidence threshold
        predictions.push({
          category: pattern.category,
          confidence: confidence * pattern.accuracy,
          reasoning: [`Pattern match: ${pattern.type} (${pattern.occurrences} occurrences)`],
        });
      }
    }

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }

  private evaluatePattern(pattern: LearningPattern, expenseData: ExpenseData): number {
    switch (pattern.type) {
      case 'merchant_category':
        return this.evaluateMerchantPattern(pattern, expenseData);
      
      case 'description_keyword':
        return this.evaluateKeywordPattern(pattern, expenseData);
      
      case 'amount_category':
        return this.evaluateAmountPattern(pattern, expenseData);
      
      case 'time_category':
        return this.evaluateTimePattern(pattern, expenseData);
      
      case 'combo_pattern':
        return this.evaluateComboPattern(pattern, expenseData);
      
      default:
        return 0;
    }
  }

  private evaluateMerchantPattern(pattern: LearningPattern, expenseData: ExpenseData): number {
    const merchant = (expenseData.merchant || expenseData.description).toLowerCase();
    const patternMerchant = String(pattern.pattern.merchant || '').toLowerCase();
    
    if (merchant.includes(patternMerchant) || patternMerchant.includes(merchant)) {
      return 0.9;
    }
    
    // Fuzzy matching
    const similarity = this.calculateStringSimilarity(merchant, patternMerchant);
    return similarity > 0.7 ? similarity : 0;
  }

  private evaluateKeywordPattern(pattern: LearningPattern, expenseData: ExpenseData): number {
    const description = expenseData.description.toLowerCase();
    const keywords = pattern.pattern.keywords || [];
    
    let matchCount = 0;
    for (const keyword of keywords) {
      if (description.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    return matchCount / keywords.length;
  }

  private evaluateAmountPattern(pattern: LearningPattern, expenseData: ExpenseData): number {
    const amount = expenseData.amount;
    const patternAmount = pattern.pattern.amount;
    
    if (typeof patternAmount === 'object') {
      const { min, max } = patternAmount;
      if (amount >= min && amount <= max) {
        return 0.7;
      }
    }
    
    return 0;
  }

  private evaluateTimePattern(pattern: LearningPattern, expenseData: ExpenseData): number {
    const date = new Date(expenseData.date);
    const dayOfWeek = date.getDay();
    const hour = date.getHours();
    
    const patternTime = pattern.pattern.time;
    
    let confidence = 0;
    
    if (patternTime.dayOfWeek && patternTime.dayOfWeek.includes(dayOfWeek)) {
      confidence += 0.3;
    }
    
    if (patternTime.hourRange && 
        hour >= patternTime.hourRange.start && 
        hour <= patternTime.hourRange.end) {
      confidence += 0.4;
    }
    
    return confidence;
  }

  private evaluateComboPattern(pattern: LearningPattern, expenseData: ExpenseData): number {
    const conditions = pattern.pattern.conditions || [];
    let matchCount = 0;
    
    for (const condition of conditions) {
      if (this.evaluateCondition(condition, expenseData)) {
        matchCount++;
      }
    }
    
    return matchCount / conditions.length;
  }

  private evaluateCondition(condition: any, expenseData: ExpenseData): boolean {
    // Simplified condition evaluation
    switch (condition.field) {
      case 'merchant':
        return (expenseData.merchant || '').toLowerCase().includes(condition.value.toLowerCase());
      
      case 'description':
        return expenseData.description.toLowerCase().includes(condition.value.toLowerCase());
      
      case 'amount':
        if (condition.operator === 'range') {
          return expenseData.amount >= condition.value.min && expenseData.amount <= condition.value.max;
        }
        return false;
      
      default:
        return false;
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simplified Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async createPatternsFromCorrection(correction: UserCorrection): Promise<void> {
    const { expenseData, correctedCategory } = correction;
    
    // Create merchant pattern
    if (expenseData.merchant) {
      await this.createOrUpdatePattern({
        type: 'merchant_category',
        pattern: { merchant: expenseData.merchant },
        category: correctedCategory,
        expenseData
      });
    }
    
    // Create keyword patterns from description
    const keywords = this.extractKeywords(expenseData.description);
    if (keywords.length > 0) {
      await this.createOrUpdatePattern({
        type: 'description_keyword',
        pattern: { keywords },
        category: correctedCategory,
        expenseData
      });
    }
    
    // Create amount pattern
    await this.createOrUpdatePattern({
      type: 'amount_category',
      pattern: { 
        amount: { 
          min: expenseData.amount * 0.8, 
          max: expenseData.amount * 1.2 
        } 
      },
      category: correctedCategory,
      expenseData
    });
  }

  private async createOrUpdatePattern(params: {
    type: LearningPattern['type'];
    pattern: any;
    category: ExpenseCategory;
    expenseData: any;
  }): Promise<void> {
    const { type, pattern, category, expenseData } = params;
    
    // Find existing pattern
    const existingPattern = this.patterns.find(p => 
      p.type === type && 
      p.category === category && 
      this.patternsMatch(p.pattern, pattern)
    );
    
    if (existingPattern) {
      // Update existing pattern
      existingPattern.occurrences++;
      existingPattern.lastSeen = new Date().toISOString();
      existingPattern.confidence = Math.min(existingPattern.confidence + 0.1, 1.0);
      
      if (!existingPattern.examples.includes(expenseData.description)) {
        existingPattern.examples.push(expenseData.description);
      }
    } else {
      // Create new pattern
      const newPattern: LearningPattern = {
        id: crypto.randomUUID(),
        type,
        pattern,
        category,
        confidence: 0.6,
        occurrences: 1,
        accuracy: 0.8,
        lastSeen: new Date().toISOString(),
        examples: [expenseData.description]
      };
      
      this.patterns.push(newPattern);
    }
  }

  private patternsMatch(pattern1: any, pattern2: any): boolean {
    // Simplified pattern matching
    return JSON.stringify(pattern1) === JSON.stringify(pattern2);
  }

  private extractKeywords(description: string): string[] {
    // Simple keyword extraction
    const stopWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5); // Limit to 5 keywords
  }

  getPatterns(): LearningPattern[] {
    return [...this.patterns];
  }

  clearPatterns(): void {
    this.patterns = [];
  }
}