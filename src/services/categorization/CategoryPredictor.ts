import type { ExpenseCategory } from '../../types';
import type { CategoryPrediction, ExpenseData } from './types';

export class CategoryPredictor {
  private merchantMappings: Map<string, ExpenseCategory> = new Map();
  private keywordMappings: Map<string, ExpenseCategory> = new Map();

  constructor() {
    this.initializeDefaultMappings();
  }

  private initializeDefaultMappings(): void {
    // Merchant mappings
    const merchantMap = new Map<string, ExpenseCategory>([
      // Food & Restaurants
      ['mcdonalds', 'Food'],
      ['starbucks', 'Food'],
      ['subway', 'Food'],
      ['pizza hut', 'Food'],
      ['dominos', 'Food'],
      ['kfc', 'Food'],
      ['burger king', 'Food'],
      ['taco bell', 'Food'],
      ['chipotle', 'Food'],
      ['dunkin', 'Food'],
      
      // Grocery Stores
      ['walmart', 'Food'],
      ['target', 'Food'],
      ['kroger', 'Food'],
      ['safeway', 'Food'],
      ['whole foods', 'Food'],
      ['trader joes', 'Food'],
      
      // Transport
      ['uber', 'Transport'],
      ['lyft', 'Transport'],
      ['shell', 'Transport'],
      ['exxon', 'Transport'],
      ['bp', 'Transport'],
      ['chevron', 'Transport'],
      ['citgo', 'Transport'],
      
      // Entertainment
      ['netflix', 'Entertainment'],
      ['spotify', 'Entertainment'],
      ['amazon prime', 'Entertainment'],
      ['hulu', 'Entertainment'],
      ['disney plus', 'Entertainment'],
      ['cinema', 'Entertainment'],
      ['theater', 'Entertainment'],
      
      // Shopping
      ['amazon', 'Shopping'],
      ['ebay', 'Shopping'],
      ['best buy', 'Shopping'],
      ['costco', 'Shopping'],
      ['home depot', 'Shopping'],
      ['lowes', 'Shopping'],
      
      // Healthcare
      ['cvs', 'Healthcare'],
      ['walgreens', 'Healthcare'],
      ['rite aid', 'Healthcare'],
      ['pharmacy', 'Healthcare'],
      ['hospital', 'Healthcare'],
      ['clinic', 'Healthcare'],
      
      // Bills & Utilities
      ['verizon', 'Bills'],
      ['att', 'Bills'],
      ['tmobile', 'Bills'],
      ['comcast', 'Bills'],
      ['spectrum', 'Bills'],
      ['electric company', 'Bills'],
      ['water department', 'Bills'],
      ['gas company', 'Bills'],
    ]);

    this.merchantMappings = merchantMap;

    // Keyword mappings
    const keywordMap = new Map<string, ExpenseCategory>([
      // Food keywords
      ['restaurant', 'Food'],
      ['cafe', 'Food'],
      ['coffee', 'Food'],
      ['pizza', 'Food'],
      ['burger', 'Food'],
      ['food', 'Food'],
      ['dining', 'Food'],
      ['lunch', 'Food'],
      ['dinner', 'Food'],
      ['breakfast', 'Food'],
      ['grocery', 'Food'],
      ['supermarket', 'Food'],
      
      // Transport keywords
      ['gas', 'Transport'],
      ['fuel', 'Transport'],
      ['parking', 'Transport'],
      ['taxi', 'Transport'],
      ['ride', 'Transport'],
      ['bus', 'Transport'],
      ['train', 'Transport'],
      ['metro', 'Transport'],
      ['toll', 'Transport'],
      
      // Bills keywords
      ['electric', 'Bills'],
      ['electricity', 'Bills'],
      ['water', 'Bills'],
      ['gas bill', 'Bills'],
      ['internet', 'Bills'],
      ['phone', 'Bills'],
      ['cable', 'Bills'],
      ['insurance', 'Bills'],
      ['rent', 'Bills'],
      ['mortgage', 'Bills'],
      
      // Entertainment keywords
      ['movie', 'Entertainment'],
      ['cinema', 'Entertainment'],
      ['theater', 'Entertainment'],
      ['concert', 'Entertainment'],
      ['game', 'Entertainment'],
      ['entertainment', 'Entertainment'],
      ['streaming', 'Entertainment'],
      
      // Healthcare keywords
      ['doctor', 'Healthcare'],
      ['hospital', 'Healthcare'],
      ['pharmacy', 'Healthcare'],
      ['medical', 'Healthcare'],
      ['health', 'Healthcare'],
      ['dentist', 'Healthcare'],
      ['medicine', 'Healthcare'],
      
      // Shopping keywords
      ['store', 'Shopping'],
      ['shop', 'Shopping'],
      ['clothing', 'Shopping'],
      ['electronics', 'Shopping'],
      ['furniture', 'Shopping'],
      ['online', 'Shopping'],
      
      // Education keywords
      ['school', 'Education'],
      ['university', 'Education'],
      ['college', 'Education'],
      ['tuition', 'Education'],
      ['books', 'Education'],
      ['course', 'Education'],
      
      // Travel keywords
      ['hotel', 'Travel'],
      ['flight', 'Travel'],
      ['airline', 'Travel'],
      ['vacation', 'Travel'],
      ['travel', 'Travel'],
      ['booking', 'Travel'],
      
      // Housing keywords
      ['home', 'Housing'],
      ['house', 'Housing'],
      ['apartment', 'Housing'],
      ['maintenance', 'Housing'],
      ['repair', 'Housing'],
      ['cleaning', 'Housing'],
    ]);

    this.keywordMappings = keywordMap;
  }

  categorizeMerchant(merchantText: string): CategoryPrediction | null {
    if (!merchantText) return null;

    const cleanMerchant = merchantText.toLowerCase().trim();
    
    // Direct mapping lookup
    for (const [merchant, category] of this.merchantMappings.entries()) {
      if (cleanMerchant.includes(merchant) || merchant.includes(cleanMerchant)) {
        return {
          category,
          confidence: 0.9,
          reasoning: [`Merchant match: ${merchant}`],
        };
      }
    }

    // Fuzzy matching for partial matches
    for (const [merchant, category] of this.merchantMappings.entries()) {
      const words = merchant.split(' ');
      const merchantWords = cleanMerchant.split(' ');
      
      const matchingWords = words.filter(word => 
        merchantWords.some(mWord => mWord.includes(word) || word.includes(mWord))
      );
      
      if (matchingWords.length >= Math.ceil(words.length / 2)) {
        return {
          category,
          confidence: 0.7,
          reasoning: [`Partial merchant match: ${merchant}`],
        };
      }
    }

    return null;
  }

  categorizeByKeywords(description: string): CategoryPrediction | null {
    if (!description) return null;

    const cleanDescription = description.toLowerCase();
    const matches: { category: ExpenseCategory; count: number; keywords: string[] }[] = [];

    // Count keyword matches by category
    for (const [keyword, category] of this.keywordMappings.entries()) {
      if (cleanDescription.includes(keyword)) {
        let existing = matches.find(m => m.category === category);
        if (!existing) {
          existing = { category, count: 0, keywords: [] };
          matches.push(existing);
        }
        existing.count++;
        existing.keywords.push(keyword);
      }
    }

    if (matches.length === 0) return null;

    // Sort by match count and return best match
    matches.sort((a, b) => b.count - a.count);
    const bestMatch = matches[0];

    const confidence = Math.min(0.8, 0.4 + (bestMatch.count * 0.1));

    return {
      category: bestMatch.category,
      confidence,
      reasoning: [`Keyword matches: ${bestMatch.keywords.join(', ')}`],
    };
  }

  categorizeByAmount(amount: number): CategoryPrediction | null {
    // Amount-based heuristics
    if (amount > 1000) {
      return {
        category: 'Housing',
        confidence: 0.3,
        reasoning: ['Large amount typically housing-related'],
      };
    }

    if (amount < 5) {
      return {
        category: 'Other',
        confidence: 0.2,
        reasoning: ['Very small amount'],
      };
    }

    if (amount >= 20 && amount <= 100) {
      return {
        category: 'Food',
        confidence: 0.3,
        reasoning: ['Amount typical for dining/grocery'],
      };
    }

    return null;
  }

  categorizeByTime(date: string, amount: number): CategoryPrediction | null {
    const dateObj = new Date(date);
    const hour = dateObj.getHours();
    const dayOfWeek = dateObj.getDay();

    // Weekend patterns
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (amount >= 20 && amount <= 150) {
        return {
          category: 'Entertainment',
          confidence: 0.4,
          reasoning: ['Weekend spending pattern'],
        };
      }
    }

    // Meal time patterns
    if (hour >= 7 && hour <= 9) {
      return {
        category: 'Food',
        confidence: 0.3,
        reasoning: ['Breakfast time pattern'],
      };
    }

    if (hour >= 11 && hour <= 14) {
      return {
        category: 'Food',
        confidence: 0.4,
        reasoning: ['Lunch time pattern'],
      };
    }

    if (hour >= 17 && hour <= 21) {
      return {
        category: 'Food',
        confidence: 0.4,
        reasoning: ['Dinner time pattern'],
      };
    }

    // Late night patterns
    if (hour >= 22 || hour <= 2) {
      return {
        category: 'Entertainment',
        confidence: 0.3,
        reasoning: ['Late night spending pattern'],
      };
    }

    return null;
  }

  combinePredictions(predictions: CategoryPrediction[]): CategoryPrediction {
    if (predictions.length === 0) {
      return {
        category: 'Other',
        confidence: 0.1,
        reasoning: ['No patterns matched - defaulting to Other'],
      };
    }

    if (predictions.length === 1) {
      return predictions[0];
    }

    // Weighted combination of predictions
    const categoryScores = new Map<ExpenseCategory, { score: number; reasoning: string[] }>();

    for (const prediction of predictions) {
      const existing = categoryScores.get(prediction.category);
      if (existing) {
        existing.score += prediction.confidence;
        existing.reasoning.push(...prediction.reasoning);
      } else {
        categoryScores.set(prediction.category, {
          score: prediction.confidence,
          reasoning: [...prediction.reasoning],
        });
      }
    }

    // Find best category
    let bestCategory: ExpenseCategory = 'Other';
    let bestScore = 0;
    let bestReasoning: string[] = [];

    for (const [category, data] of categoryScores.entries()) {
      if (data.score > bestScore) {
        bestScore = data.score;
        bestCategory = category;
        bestReasoning = data.reasoning;
      }
    }

    // Normalize confidence (max 0.95)
    const finalConfidence = Math.min(0.95, bestScore);

    return {
      category: bestCategory,
      confidence: finalConfidence,
      reasoning: bestReasoning,
    };
  }

  updateMerchantMapping(merchant: string, category: ExpenseCategory): void {
    this.merchantMappings.set(merchant.toLowerCase(), category);
  }

  updateKeywordMapping(keyword: string, category: ExpenseCategory): void {
    this.keywordMappings.set(keyword.toLowerCase(), category);
  }

  getMerchantMappings(): Map<string, ExpenseCategory> {
    return new Map(this.merchantMappings);
  }

  getKeywordMappings(): Map<string, ExpenseCategory> {
    return new Map(this.keywordMappings);
  }
}