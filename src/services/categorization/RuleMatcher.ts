import type { ExpenseCategory } from '../../types';
import type { CategorizationRule, CategoryPrediction, ExpenseData } from './types';

export class RuleMatcher {
  private rules: CategorizationRule[] = [];

  constructor(rules: CategorizationRule[] = []) {
    this.rules = rules;
  }

  setRules(rules: CategorizationRule[]): void {
    this.rules = rules;
  }

  addRule(rule: CategorizationRule): void {
    this.rules.push(rule);
  }

  applyRules(expenseData: ExpenseData): CategoryPrediction[] {
    const predictions: CategoryPrediction[] = [];
    const activeRules = this.rules
      .filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of activeRules) {
      if (this.matchesRule(rule, expenseData)) {
        predictions.push({
          category: rule.action.category,
          confidence: rule.action.confidence * (rule.accuracy || 0.5),
          reasoning: [`Matched rule: ${rule.type} (${rule.condition.operator})`],
          suggestedTags: rule.action.tags,
        });

        // Update rule usage
        rule.usageCount++;
        rule.lastUsed = new Date().toISOString();
      }
    }

    return predictions;
  }

  private matchesRule(rule: CategorizationRule, expenseData: ExpenseData): boolean {
    const { condition } = rule;
    let fieldValue: any;

    // Get field value based on rule field
    switch (condition.field) {
      case 'merchant':
        fieldValue = expenseData.merchant || '';
        break;
      case 'description':
        fieldValue = expenseData.description;
        break;
      case 'amount':
        fieldValue = expenseData.amount;
        break;
      case 'date':
        fieldValue = expenseData.date;
        break;
      default:
        return false;
    }

    // Apply operator
    switch (condition.operator) {
      case 'contains':
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().includes(String(condition.value).toLowerCase());
      
      case 'equals':
        return fieldValue === condition.value;
      
      case 'startsWith':
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().startsWith(String(condition.value).toLowerCase());
      
      case 'endsWith':
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().endsWith(String(condition.value).toLowerCase());
      
      case 'regex':
        try {
          const regex = new RegExp(String(condition.value), 'i');
          return regex.test(String(fieldValue));
        } catch {
          return false;
        }
      
      case 'range':
        if (typeof condition.value === 'object' && 'min' in condition.value && 'max' in condition.value) {
          const numValue = Number(fieldValue);
          return numValue >= condition.value.min && numValue <= condition.value.max;
        }
        return false;
      
      default:
        return false;
    }
  }

  updateRuleAccuracy(ruleId: string, isCorrect: boolean): void {
    const rule = this.rules.find(r => r.id === ruleId);
    if (rule) {
      // Simple accuracy calculation (could be improved with more sophisticated methods)
      const currentTotal = rule.usageCount || 1;
      const currentCorrect = (rule.accuracy || 0.5) * currentTotal;
      const newCorrect = currentCorrect + (isCorrect ? 1 : 0);
      const newTotal = currentTotal + 1;
      
      rule.accuracy = newCorrect / newTotal;
      rule.usageCount = newTotal;
    }
  }

  getRules(): CategorizationRule[] {
    return [...this.rules];
  }

  getActiveRules(): CategorizationRule[] {
    return this.rules.filter(rule => rule.isActive);
  }

  createDefaultRules(): CategorizationRule[] {
    return [
      {
        id: 'grocery-stores',
        type: 'merchant',
        condition: {
          field: 'merchant',
          operator: 'contains',
          value: 'supermarket|grocery|walmart|target|costco'
        },
        action: {
          category: 'Food' as ExpenseCategory,
          confidence: 0.9,
          tags: ['grocery']
        },
        priority: 100,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        accuracy: 0.9,
        isUserCreated: false,
        isActive: true
      },
      {
        id: 'gas-stations',
        type: 'merchant',
        condition: {
          field: 'merchant',
          operator: 'contains',
          value: 'shell|exxon|bp|chevron|gas|fuel'
        },
        action: {
          category: 'Transport' as ExpenseCategory,
          confidence: 0.95,
          tags: ['fuel', 'gas']
        },
        priority: 100,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        accuracy: 0.95,
        isUserCreated: false,
        isActive: true
      },
      {
        id: 'restaurants',
        type: 'merchant',
        condition: {
          field: 'description',
          operator: 'contains',
          value: 'restaurant|cafe|pizza|burger|food|dining'
        },
        action: {
          category: 'Food' as ExpenseCategory,
          confidence: 0.8,
          tags: ['dining']
        },
        priority: 80,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        accuracy: 0.8,
        isUserCreated: false,
        isActive: true
      },
      {
        id: 'utilities',
        type: 'description',
        condition: {
          field: 'description',
          operator: 'contains',
          value: 'electric|water|gas bill|utility|power|sewer'
        },
        action: {
          category: 'Bills' as ExpenseCategory,
          confidence: 0.9,
          tags: ['utilities']
        },
        priority: 90,
        createdAt: new Date().toISOString(),
        usageCount: 0,
        accuracy: 0.9,
        isUserCreated: false,
        isActive: true
      }
    ];
  }
}