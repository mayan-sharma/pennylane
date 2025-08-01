import { ExpenseCategory } from '../types';

export interface SuggestionResult {
  category: ExpenseCategory;
  confidence: number;
}

export const suggestCategory = (description: string, merchant?: string): SuggestionResult => {
  const text = `${description} ${merchant || ''}`.toLowerCase();
  
  // Simple keyword-based categorization
  const patterns = [
    { category: ExpenseCategory.FOOD, keywords: ['food', 'restaurant', 'cafe', 'burger', 'pizza', 'grocery', 'supermarket'] },
    { category: ExpenseCategory.TRANSPORT, keywords: ['gas', 'fuel', 'uber', 'taxi', 'bus', 'train', 'metro'] },
    { category: ExpenseCategory.BILLS, keywords: ['electric', 'water', 'internet', 'phone', 'utility', 'bill'] },
    { category: ExpenseCategory.ENTERTAINMENT, keywords: ['movie', 'cinema', 'game', 'concert', 'netflix', 'spotify'] },
    { category: ExpenseCategory.SHOPPING, keywords: ['amazon', 'shop', 'store', 'mall', 'clothing', 'shoes'] },
    { category: ExpenseCategory.HEALTHCARE, keywords: ['doctor', 'hospital', 'pharmacy', 'medicine', 'dental'] },
    { category: ExpenseCategory.EDUCATION, keywords: ['school', 'book', 'course', 'tuition', 'education'] },
    { category: ExpenseCategory.TRAVEL, keywords: ['hotel', 'flight', 'booking', 'travel', 'vacation'] },
    { category: ExpenseCategory.HOUSING, keywords: ['rent', 'mortgage', 'repair', 'furniture', 'home'] }
  ];

  for (const pattern of patterns) {
    const matches = pattern.keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      return {
        category: pattern.category,
        confidence: Math.min(0.9, matches.length * 0.3)
      };
    }
  }

  return {
    category: ExpenseCategory.OTHER,
    confidence: 0.1
  };
};