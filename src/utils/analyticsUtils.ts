import type { Expense } from '../types';
import { ExpenseCategory } from '../types';

export interface TrendData {
  label: string;
  amount: number;
  count: number;
}

export interface CategoryInsight {
  category: ExpenseCategory;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  avgTransactionSize: number;
}

export interface SpendingPersonality {
  type: 'conservative' | 'moderate' | 'liberal' | 'impulsive';
  title: string;
  description: string;
  recommendations: string[];
  score: number;
}

export interface SeasonalPattern {
  season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
  averageSpending: number;
  peakCategory: string;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
}

export interface SpendingGoal {
  id: string;
  category: ExpenseCategory;
  targetAmount: number;
  currentAmount: number;
  period: 'monthly' | 'yearly';
  progress: number;
}

export interface PredictiveInsight {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  confidence: number;
  category?: string;
}

export interface AnalyticsData {
  monthlyTrends: TrendData[];
  yearlyTrends: TrendData[];
  weeklyTrends: TrendData[];
  dailyTrends: TrendData[];
  categoryInsights: CategoryInsight[];
  spendingPersonality: SpendingPersonality;
  seasonalPatterns: SeasonalPattern[];
  predictiveInsights: PredictiveInsight[];
  totalSpent: number;
  avgMonthlySpending: number;
  avgWeeklySpending: number;
  avgDailySpending: number;
  mostExpensiveMonth: string;
  topSpendingDay: string;
  spendingVariability: number;
  recurringExpenseRatio: number;
}

export const getMonthlyTrends = (expenses: Expense[]): TrendData[] => {
  const monthlyData = new Map<string, { amount: number; count: number }>();
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { amount: 0, count: 0 });
    }
    
    const data = monthlyData.get(monthKey)!;
    data.amount += expense.amount;
    data.count += 1;
  });
  
  return Array.from(monthlyData.entries())
    .map(([key, data]) => ({
      label: new Date(key).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
    .slice(-12); // Last 12 months
};

export const getYearlyTrends = (expenses: Expense[]): TrendData[] => {
  const yearlyData = new Map<string, { amount: number; count: number }>();
  
  expenses.forEach(expense => {
    const year = new Date(expense.date).getFullYear().toString();
    
    if (!yearlyData.has(year)) {
      yearlyData.set(year, { amount: 0, count: 0 });
    }
    
    const data = yearlyData.get(year)!;
    data.amount += expense.amount;
    data.count += 1;
  });
  
  return Array.from(yearlyData.entries())
    .map(([year, data]) => ({
      label: year,
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => parseInt(a.label) - parseInt(b.label));
};

export const getCategoryInsights = (expenses: Expense[]): CategoryInsight[] => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const currentMonthExpenses = expenses.filter(e => new Date(e.date) >= currentMonth);
  const lastMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date >= lastMonth && date < currentMonth;
  });
  
  const totalAmount = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const categoryData = Object.values(ExpenseCategory).map(category => {
    const currentCategoryExpenses = currentMonthExpenses.filter(e => e.category === category);
    const lastCategoryExpenses = lastMonthExpenses.filter(e => e.category === category);
    
    const currentAmount = currentCategoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const lastAmount = lastCategoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;
    
    if (lastAmount > 0) {
      const change = ((currentAmount - lastAmount) / lastAmount) * 100;
      trendPercentage = Math.abs(change);
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';
    } else if (currentAmount > 0) {
      trend = 'up';
      trendPercentage = 100;
    }
    
    const avgTransactionSize = currentCategoryExpenses.length > 0 
      ? currentAmount / currentCategoryExpenses.length 
      : 0;
    
    return {
      category,
      amount: currentAmount,
      percentage: totalAmount > 0 ? (currentAmount / totalAmount) * 100 : 0,
      trend,
      trendPercentage,
      avgTransactionSize
    };
  });
  
  return categoryData
    .filter(data => data.amount > 0)
    .sort((a, b) => b.amount - a.amount);
};

export const getSpendingPersonality = (expenses: Expense[]): SpendingPersonality => {
  if (expenses.length < 10) {
    return {
      type: 'conservative',
      title: 'Getting Started',
      description: 'You\'re just beginning your expense tracking journey.',
      recommendations: [
        'Continue tracking expenses consistently',
        'Set up basic budgets for major categories',
        'Review your spending weekly'
      ],
      score: 0
    };
  }
  
  const last30Days = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return expenseDate >= thirtyDaysAgo;
  });
  
  const avgDailySpending = last30Days.reduce((sum, e) => sum + e.amount, 0) / 30;
  const transactionFrequency = last30Days.length / 30;
  const impulsiveCategories = last30Days.filter(e => 
    e.category === 'Entertainment' || e.category === 'Shopping'
  ).length;
  const impulsiveRatio = impulsiveCategories / last30Days.length;
  
  const largeTransactions = last30Days.filter(e => e.amount > avgDailySpending * 3).length;
  const variabilityScore = calculateSpendingVariability(last30Days);
  
  let score = 0;
  score += Math.min(avgDailySpending / 100, 50);
  score += Math.min(transactionFrequency * 10, 30);
  score += impulsiveRatio * 40;
  score += Math.min(largeTransactions * 5, 20);
  score += variabilityScore * 30;
  
  if (score < 30) {
    return {
      type: 'conservative',
      title: 'Mindful Spender',
      description: 'You demonstrate excellent financial discipline with consistent, thoughtful spending patterns.',
      recommendations: [
        'Consider increasing your savings rate',
        'Explore investment opportunities',
        'Set stretch budget goals'
      ],
      score
    };
  } else if (score < 60) {
    return {
      type: 'moderate',
      title: 'Balanced Spender',
      description: 'You maintain a healthy balance between enjoying life and financial responsibility.',
      recommendations: [
        'Track discretionary spending more closely',
        'Set aside an emergency fund',
        'Review monthly subscriptions'
      ],
      score
    };
  } else if (score < 85) {
    return {
      type: 'liberal',
      title: 'Lifestyle Spender',
      description: 'You enjoy spending on experiences and lifestyle, but could benefit from more structure.',
      recommendations: [
        'Implement the 50/30/20 budget rule',
        'Set up automatic savings',
        'Use the 24-hour rule for large purchases'
      ],
      score
    };
  } else {
    return {
      type: 'impulsive',
      title: 'Free Spender',
      description: 'You tend to spend spontaneously. Consider implementing stricter budgeting strategies.',
      recommendations: [
        'Create a detailed weekly budget',
        'Use cash for discretionary spending',
        'Set up spending alerts and limits',
        'Practice the "want vs need" evaluation'
      ],
      score
    };
  }
};

const calculateSpendingVariability = (expenses: Expense[]): number => {
  if (expenses.length < 7) return 0;
  
  const dailyTotals = new Map<string, number>();
  expenses.forEach(expense => {
    const dateKey = expense.date.split('T')[0];
    dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + expense.amount);
  });
  
  const amounts = Array.from(dailyTotals.values());
  const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
  const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
  const standardDeviation = Math.sqrt(variance);
  
  return mean > 0 ? Math.min(standardDeviation / mean, 1) : 0;
};

export const getWeeklyTrends = (expenses: Expense[]): TrendData[] => {
  const weeklyData = new Map<string, { amount: number; count: number }>();
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekKey = startOfWeek.toISOString().split('T')[0];
    
    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { amount: 0, count: 0 });
    }
    
    const data = weeklyData.get(weekKey)!;
    data.amount += expense.amount;
    data.count += 1;
  });
  
  return Array.from(weeklyData.entries())
    .map(([key, data]) => ({
      label: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
    .slice(-8); // Last 8 weeks
};

export const getDailyTrends = (expenses: Expense[]): TrendData[] => {
  const dailyData = new Map<string, { amount: number; count: number }>();
  
  expenses.forEach(expense => {
    const dateKey = expense.date.split('T')[0];
    
    if (!dailyData.has(dateKey)) {
      dailyData.set(dateKey, { amount: 0, count: 0 });
    }
    
    const data = dailyData.get(dateKey)!;
    data.amount += expense.amount;
    data.count += 1;
  });
  
  return Array.from(dailyData.entries())
    .map(([key, data]) => ({
      label: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: data.amount,
      count: data.count
    }))
    .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime())
    .slice(-30); // Last 30 days
};

export const getSeasonalPatterns = (expenses: Expense[]): SeasonalPattern[] => {
  const seasonalData = new Map<string, { amount: number; categories: Map<string, number> }>();
  
  expenses.forEach(expense => {
    const date = new Date(expense.date);
    const month = date.getMonth();
    let season: 'Spring' | 'Summer' | 'Fall' | 'Winter';
    
    if (month >= 2 && month <= 4) season = 'Spring';
    else if (month >= 5 && month <= 7) season = 'Summer';
    else if (month >= 8 && month <= 10) season = 'Fall';
    else season = 'Winter';
    
    if (!seasonalData.has(season)) {
      seasonalData.set(season, { amount: 0, categories: new Map() });
    }
    
    const data = seasonalData.get(season)!;
    data.amount += expense.amount;
    data.categories.set(expense.category, (data.categories.get(expense.category) || 0) + expense.amount);
  });
  
  return Array.from(seasonalData.entries()).map(([season, data]) => {
    const peakCategory = Array.from(data.categories.entries())
      .reduce((max, [cat, amount]) => amount > max[1] ? [cat, amount] : max, ['', 0])[0];
    
    return {
      season: season as 'Spring' | 'Summer' | 'Fall' | 'Winter',
      averageSpending: data.amount / 3, // Assuming 3 months per season
      peakCategory,
      spendingTrend: 'stable' as const // Would need more complex logic for trend analysis
    };
  });
};

export const generatePredictiveInsights = (expenses: Expense[]): PredictiveInsight[] => {
  const insights: PredictiveInsight[] = [];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Get current month expenses
  const currentMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  // Get last month expenses for comparison
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const lastMonthExpenses = expenses.filter(e => {
    const date = new Date(e.date);
    return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
  });
  
  const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // High spending warning
  if (currentMonthTotal > lastMonthTotal * 1.2) {
    insights.push({
      type: 'warning',
      title: 'Increased Spending Detected',
      description: `Your spending this month is ${((currentMonthTotal / lastMonthTotal - 1) * 100).toFixed(1)}% higher than last month.`,
      confidence: 0.85
    });
  }
  
  // Category-specific insights
  const categoryTotals = new Map<string, { current: number; last: number }>();
  
  currentMonthExpenses.forEach(e => {
    if (!categoryTotals.has(e.category)) {
      categoryTotals.set(e.category, { current: 0, last: 0 });
    }
    categoryTotals.get(e.category)!.current += e.amount;
  });
  
  lastMonthExpenses.forEach(e => {
    if (!categoryTotals.has(e.category)) {
      categoryTotals.set(e.category, { current: 0, last: 0 });
    }
    categoryTotals.get(e.category)!.last += e.amount;
  });
  
  categoryTotals.forEach((amounts, category) => {
    if (amounts.last > 0 && amounts.current > amounts.last * 1.5) {
      insights.push({
        type: 'warning',
        title: `High ${category} Spending`,
        description: `Your ${category} spending has increased significantly this month.`,
        confidence: 0.75,
        category
      });
    }
  });
  
  // Positive insights
  if (currentMonthTotal < lastMonthTotal * 0.8) {
    insights.push({
      type: 'success',
      title: 'Great Spending Control!',
      description: `You've reduced your spending by ${((1 - currentMonthTotal / lastMonthTotal) * 100).toFixed(1)}% this month.`,
      confidence: 0.9
    });
  }
  
  return insights;
};

export const calculateRecurringExpenseRatio = (expenses: Expense[]): number => {
  // Simple heuristic: expenses with same amount and category appearing regularly
  const recurringPatterns = new Map<string, number>();
  
  expenses.forEach(expense => {
    const key = `${expense.category}-${expense.amount}`;
    recurringPatterns.set(key, (recurringPatterns.get(key) || 0) + 1);
  });
  
  const recurringExpenses = Array.from(recurringPatterns.values())
    .filter(count => count >= 3).length;
  
  return expenses.length > 0 ? recurringExpenses / expenses.length : 0;
};

export const getAnalyticsData = (expenses: Expense[]): AnalyticsData => {
  const monthlyTrends = getMonthlyTrends(expenses);
  const yearlyTrends = getYearlyTrends(expenses);
  const weeklyTrends = getWeeklyTrends(expenses);
  const dailyTrends = getDailyTrends(expenses);
  const categoryInsights = getCategoryInsights(expenses);
  const spendingPersonality = getSpendingPersonality(expenses);
  const seasonalPatterns = getSeasonalPatterns(expenses);
  const predictiveInsights = generatePredictiveInsights(expenses);
  
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgMonthlySpending = monthlyTrends.length > 0 
    ? monthlyTrends.reduce((sum, trend) => sum + trend.amount, 0) / monthlyTrends.length 
    : 0;
  
  const avgWeeklySpending = weeklyTrends.length > 0
    ? weeklyTrends.reduce((sum, trend) => sum + trend.amount, 0) / weeklyTrends.length
    : 0;
    
  const avgDailySpending = dailyTrends.length > 0
    ? dailyTrends.reduce((sum, trend) => sum + trend.amount, 0) / dailyTrends.length
    : 0;
  
  const mostExpensiveMonth = monthlyTrends.length > 0 
    ? monthlyTrends.reduce((max, trend) => trend.amount > max.amount ? trend : max).label
    : 'N/A';
  
  const dailyTotals = new Map<string, number>();
  expenses.forEach(expense => {
    const dateKey = expense.date.split('T')[0];
    dailyTotals.set(dateKey, (dailyTotals.get(dateKey) || 0) + expense.amount);
  });
  
  const topSpendingDay = dailyTotals.size > 0
    ? Array.from(dailyTotals.entries())
        .reduce((max, [date, amount]) => amount > max[1] ? [date, amount] : max)[0]
    : 'N/A';
  
  const spendingVariability = calculateSpendingVariability(expenses);
  const recurringExpenseRatio = calculateRecurringExpenseRatio(expenses);
  
  return {
    monthlyTrends,
    yearlyTrends,
    weeklyTrends,
    dailyTrends,
    categoryInsights,
    spendingPersonality,
    seasonalPatterns,
    predictiveInsights,
    totalSpent,
    avgMonthlySpending,
    avgWeeklySpending,
    avgDailySpending,
    mostExpensiveMonth,
    topSpendingDay: topSpendingDay !== 'N/A' 
      ? new Date(topSpendingDay).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'N/A',
    spendingVariability,
    recurringExpenseRatio
  };
};