import type { Expense } from '../types/expense';
import { ExpenseCategory } from '../types/expense';

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

export interface AnalyticsData {
  monthlyTrends: TrendData[];
  yearlyTrends: TrendData[];
  categoryInsights: CategoryInsight[];
  spendingPersonality: SpendingPersonality;
  totalSpent: number;
  avgMonthlySpending: number;
  mostExpensiveMonth: string;
  topSpendingDay: string;
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

export const getAnalyticsData = (expenses: Expense[]): AnalyticsData => {
  const monthlyTrends = getMonthlyTrends(expenses);
  const yearlyTrends = getYearlyTrends(expenses);
  const categoryInsights = getCategoryInsights(expenses);
  const spendingPersonality = getSpendingPersonality(expenses);
  
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgMonthlySpending = monthlyTrends.length > 0 
    ? monthlyTrends.reduce((sum, trend) => sum + trend.amount, 0) / monthlyTrends.length 
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
  
  return {
    monthlyTrends,
    yearlyTrends,
    categoryInsights,
    spendingPersonality,
    totalSpent,
    avgMonthlySpending,
    mostExpensiveMonth,
    topSpendingDay: topSpendingDay !== 'N/A' 
      ? new Date(topSpendingDay).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : 'N/A'
  };
};