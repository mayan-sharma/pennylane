import React, { useMemo, useState } from 'react';
import type { Expense, ExpenseStats } from '../types/expense';

interface AIRecommendation {
  id: string;
  type: 'spending' | 'saving' | 'budget' | 'investment' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  action: string;
  category?: string;
  amount?: number;
  timeframe?: string;
}

interface AIRecommendationsProps {
  expenses: Expense[];
  stats: ExpenseStats;
  income?: number;
}

export const AIRecommendations: React.FC<AIRecommendationsProps> = ({ 
  expenses, 
  stats, 
  income = 0 
}) => {
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const generateRecommendations = (): AIRecommendation[] => {
    const recommendations: AIRecommendation[] = [];
    
    // Analyze spending patterns
    const categoryAmounts = stats.byCategory;
    const sortedCategories = Object.entries(categoryAmounts).sort(([, a], [, b]) => b - a);
    
    // Get recent expenses for trend analysis
    const recentExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return expenseDate >= thirtyDaysAgo;
    });

    // Calculate monthly average
    const monthlyAverage = stats.total / 12; // Simplified calculation

    // 1. High spending category warning
    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      if (topAmount > monthlyAverage * 0.4) {
        recommendations.push({
          id: 'high-category-spending',
          type: 'warning',
          title: `High ${topCategory} Spending Detected`,
          description: `Your ${topCategory} expenses account for ${((topAmount / stats.total) * 100).toFixed(1)}% of total spending`,
          impact: 'high',
          confidence: 85,
          action: `Consider setting a budget limit for ${topCategory} expenses`,
          category: topCategory,
          amount: topAmount
        });
      }
    }

    // 2. Savings opportunity
    if (income > 0) {
      const savingsRate = ((income - stats.total) / income) * 100;
      if (savingsRate < 20) {
        const potentialSavings = income * 0.2 - (income - stats.total);
        recommendations.push({
          id: 'low-savings-rate',
          type: 'saving',
          title: 'Increase Your Savings Rate',
          description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Aim for 20% or higher`,
          impact: 'high',
          confidence: 90,
          action: `Try to save an additional ${formatCurrency(potentialSavings)} per month`,
          amount: potentialSavings
        });
      }
    }

    // 3. Budget optimization
    const irregularSpending = recentExpenses.filter(e => e.amount > monthlyAverage * 0.1);
    if (irregularSpending.length > 5) {
      recommendations.push({
        id: 'irregular-spending',
        type: 'budget',
        title: 'Consider Creating Specific Budgets',
        description: `You have ${irregularSpending.length} large transactions this month`,
        impact: 'medium',
        confidence: 75,
        action: 'Set up category-specific budgets to better track large expenses',
        timeframe: 'This month'
      });
    }

    // 4. Investment suggestion
    if (income > 0 && stats.total < income * 0.7) {
      const availableForInvestment = income - stats.total - (income * 0.1); // Keep 10% buffer
      recommendations.push({
        id: 'investment-opportunity',
        type: 'investment',
        title: 'Investment Opportunity Available',
        description: `You have surplus funds that could be invested for better returns`,
        impact: 'medium',
        confidence: 80,
        action: `Consider investing ${formatCurrency(availableForInvestment)} in tax-saving instruments`,
        amount: availableForInvestment
      });
    }

    // 5. Spending trend analysis
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate.getMonth() === lastMonth.getMonth();
    });
    const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    if (stats.thisMonth > lastMonthTotal * 1.2) {
      recommendations.push({
        id: 'spending-increase',
        type: 'warning',
        title: 'Spending Increased Significantly',
        description: `This month's spending is ${(((stats.thisMonth - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1)}% higher than last month`,
        impact: 'high',
        confidence: 95,
        action: 'Review this month\'s transactions and identify unusual expenses',
        amount: stats.thisMonth - lastMonthTotal
      });
    }

    // 6. Smart spending tip
    const weekdayExpenses = expenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    });
    const weekendExpenses = expenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day === 0 || day === 6; // Saturday and Sunday
    });
    
    if (weekendExpenses.length > 0 && weekdayExpenses.length > 0) {
      const weekendAvg = weekendExpenses.reduce((sum, e) => sum + e.amount, 0) / weekendExpenses.length;
      const weekdayAvg = weekdayExpenses.reduce((sum, e) => sum + e.amount, 0) / weekdayExpenses.length;
      
      if (weekendAvg > weekdayAvg * 1.5) {
        recommendations.push({
          id: 'weekend-spending',
          type: 'spending',
          title: 'Weekend Spending Pattern',
          description: `Your weekend transactions average ${formatCurrency(weekendAvg)} vs ${formatCurrency(weekdayAvg)} on weekdays`,
          impact: 'medium',
          confidence: 70,
          action: 'Plan weekend activities in advance to avoid impulse spending',
          timeframe: 'Weekends'
        });
      }
    }

    return recommendations.filter(rec => !dismissedRecommendations.has(rec.id));
  };

  const recommendations = useMemo(generateRecommendations, [expenses, stats, income, dismissedRecommendations]);

  const getRecommendationIcon = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'spending': return '💡';
      case 'saving': return '💰';
      case 'budget': return '📊';
      case 'investment': return '📈';
      case 'warning': return '⚠️';
      default: return '💡';
    }
  };

  const getRecommendationColor = (type: AIRecommendation['type']) => {
    switch (type) {
      case 'spending': return 'border-l-blue-500 bg-blue-50';
      case 'saving': return 'border-l-green-500 bg-green-50';
      case 'budget': return 'border-l-purple-500 bg-purple-50';
      case 'investment': return 'border-l-indigo-500 bg-indigo-50';
      case 'warning': return 'border-l-red-500 bg-red-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getImpactColor = (impact: AIRecommendation['impact']) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const dismissRecommendation = (id: string) => {
    setDismissedRecommendations(prev => new Set([...prev, id]));
  };

  const getConfidenceBar = (confidence: number) => (
    <div className="w-full bg-gray-200 rounded-full h-1.5">
      <div 
        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${confidence}%` }}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Powered by spending pattern analysis</span>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Great Job!</h4>
          <p className="text-gray-600">Your spending patterns look healthy. No major recommendations at this time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div
              key={recommendation.id}
              className={`bg-white p-6 rounded-lg border-l-4 ${getRecommendationColor(recommendation.type)} shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{getRecommendationIcon(recommendation.type)}</span>
                    <div>
                      <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(recommendation.impact)}`}>
                          {recommendation.impact.toUpperCase()} IMPACT
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <span>Confidence:</span>
                          <span className="font-medium">{recommendation.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{recommendation.description}</p>

                  <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3">
                    <div className="flex items-start space-x-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div>
                        <div className="font-medium text-gray-900 text-sm mb-1">Recommended Action:</div>
                        <div className="text-gray-700 text-sm">{recommendation.action}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {recommendation.amount && (
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <div className="font-semibold">{formatCurrency(recommendation.amount)}</div>
                      </div>
                    )}
                    {recommendation.category && (
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <div className="font-semibold">{recommendation.category}</div>
                      </div>
                    )}
                    {recommendation.timeframe && (
                      <div>
                        <span className="text-gray-500">Timeframe:</span>
                        <div className="font-semibold">{recommendation.timeframe}</div>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Confidence:</span>
                      <div className="mt-1">{getConfidenceBar(recommendation.confidence)}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => dismissRecommendation(recommendation.id)}
                  className="ml-4 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  aria-label="Dismiss recommendation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {dismissedRecommendations.size > 0 && (
        <div className="text-center">
          <button
            onClick={() => setDismissedRecommendations(new Set())}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
          >
            Show {dismissedRecommendations.size} dismissed recommendation{dismissedRecommendations.size !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};