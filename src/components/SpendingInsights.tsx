import React, { useState, useMemo } from 'react';
import { type Expense, type SpendingInsight } from '../types/expense';

interface SpendingInsightsProps {
  expenses: Expense[];
  insights: SpendingInsight[];
  onGenerateInsights: () => void;
}

export const SpendingInsights: React.FC<SpendingInsightsProps> = ({
  expenses,
  insights,
  onGenerateInsights
}) => {
  const [selectedInsightType, setSelectedInsightType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');

  // Advanced analytics calculations
  const analytics = useMemo(() => {
    const now = new Date();
    const periodDays = parseInt(selectedPeriod);
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    const periodExpenses = expenses.filter(e => new Date(e.date) >= startDate);
    const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodExpenses = expenses.filter(e => 
      new Date(e.date) >= previousPeriodStart && new Date(e.date) < startDate
    );

    // Calculate spending patterns
    const dailySpending = periodExpenses.reduce((acc, expense) => {
      const date = expense.date;
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categorySpending = periodExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const merchantSpending = periodExpenses.reduce((acc, expense) => {
      if (expense.merchant) {
        acc[expense.merchant] = (acc[expense.merchant] || 0) + expense.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate trends
    const currentTotal = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previousPeriodExpenses.reduce((sum, e) => sum + e.amount, 0);
    const trendPercentage = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;

    // Calculate averages
    const averageDaily = currentTotal / periodDays;
    const averagePerTransaction = periodExpenses.length > 0 ? currentTotal / periodExpenses.length : 0;

    // Find unusual spending patterns
    const dailyValues = Object.values(dailySpending);
    const avgDaily = dailyValues.reduce((sum, val) => sum + val, 0) / dailyValues.length;
    const variance = dailyValues.reduce((sum, val) => sum + Math.pow(val - avgDaily, 2), 0) / dailyValues.length;
    const stdDev = Math.sqrt(variance);
    
    const unusualDays = Object.entries(dailySpending).filter(([_, amount]) => 
      Math.abs(amount - avgDaily) > 2 * stdDev
    );

    return {
      currentTotal,
      previousTotal,
      trendPercentage,
      averageDaily,
      averagePerTransaction,
      categorySpending,
      merchantSpending,
      unusualDays,
      totalTransactions: periodExpenses.length,
    };
  }, [expenses, selectedPeriod]);

  // Generate AI insights based on spending patterns
  const generateAIInsights = (): SpendingInsight[] => {
    const aiInsights: SpendingInsight[] = [];
    const now = new Date();
    
    // Trend analysis
    if (Math.abs(analytics.trendPercentage) > 10) {
      aiInsights.push({
        id: crypto.randomUUID(),
        type: 'trend',
        title: analytics.trendPercentage > 0 ? 'Spending Increase Detected' : 'Spending Decrease Detected',
        description: `Your spending has ${analytics.trendPercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(analytics.trendPercentage).toFixed(1)}% compared to the previous period.`,
        data: { 
          percentage: analytics.trendPercentage,
          current: analytics.currentTotal,
          previous: analytics.previousTotal 
        },
        confidence: 0.9,
        actionable: true,
        dateRange: { 
          start: new Date(now.getTime() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString(), 
          end: now.toISOString() 
        },
        createdAt: now.toISOString(),
      });
    }

    // Category analysis
    const topCategory = Object.entries(analytics.categorySpending).sort(([,a], [,b]) => b - a)[0];
    if (topCategory && topCategory[1] > analytics.currentTotal * 0.3) {
      aiInsights.push({
        id: crypto.randomUUID(),
        type: 'pattern',
        title: `High Spending in ${topCategory[0]}`,
        description: `${topCategory[0]} represents ${((topCategory[1] / analytics.currentTotal) * 100).toFixed(1)}% of your total spending. Consider setting a budget for this category.`,
        data: { 
          category: topCategory[0], 
          amount: topCategory[1], 
          percentage: (topCategory[1] / analytics.currentTotal) * 100 
        },
        confidence: 0.8,
        actionable: true,
        category: topCategory[0],
        dateRange: { 
          start: new Date(now.getTime() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString(), 
          end: now.toISOString() 
        },
        createdAt: now.toISOString(),
      });
    }

    // Merchant analysis
    const topMerchant = Object.entries(analytics.merchantSpending).sort(([,a], [,b]) => b - a)[0];
    if (topMerchant && topMerchant[1] > 1000) {
      aiInsights.push({
        id: crypto.randomUUID(),
        type: 'pattern',
        title: `Frequent Spending at ${topMerchant[0]}`,
        description: `You've spent ₹${topMerchant[1].toFixed(2)} at ${topMerchant[0]}. Consider if this aligns with your financial goals.`,
        data: { 
          merchant: topMerchant[0], 
          amount: topMerchant[1] 
        },
        confidence: 0.7,
        actionable: true,
        dateRange: { 
          start: new Date(now.getTime() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString(), 
          end: now.toISOString() 
        },
        createdAt: now.toISOString(),
      });
    }

    // Unusual spending days
    if (analytics.unusualDays.length > 0) {
      const highestDay = analytics.unusualDays.sort(([,a], [,b]) => b - a)[0];
      aiInsights.push({
        id: crypto.randomUUID(),
        type: 'anomaly',
        title: 'Unusual Spending Day Detected',
        description: `On ${highestDay[0]}, you spent ₹${highestDay[1].toFixed(2)}, which is significantly higher than your average daily spending of ₹${analytics.averageDaily.toFixed(2)}.`,
        data: { 
          date: highestDay[0], 
          amount: highestDay[1], 
          average: analytics.averageDaily 
        },
        confidence: 0.85,
        actionable: true,
        dateRange: { 
          start: new Date(now.getTime() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString(), 
          end: now.toISOString() 
        },
        createdAt: now.toISOString(),
      });
    }

    // Spending velocity analysis
    if (analytics.averageDaily > 500) {
      aiInsights.push({
        id: crypto.randomUUID(),
        type: 'suggestion',
        title: 'Consider Daily Spending Limits',
        description: `Your average daily spending of ₹${analytics.averageDaily.toFixed(2)} is quite high. Setting daily limits could help control expenses.`,
        data: { 
          averageDaily: analytics.averageDaily,
          suggestion: 'daily_limits'
        },
        confidence: 0.6,
        actionable: true,
        dateRange: { 
          start: new Date(now.getTime() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString(), 
          end: now.toISOString() 
        },
        createdAt: now.toISOString(),
      });
    }

    // Transaction frequency analysis
    if (analytics.totalTransactions > 50) {
      aiInsights.push({
        id: crypto.randomUUID(),
        type: 'pattern',
        title: 'High Transaction Frequency',
        description: `You made ${analytics.totalTransactions} transactions in ${selectedPeriod} days. Consider consolidating purchases to reduce impulse spending.`,
        data: { 
          transactions: analytics.totalTransactions,
          frequency: analytics.totalTransactions / parseInt(selectedPeriod)
        },
        confidence: 0.7,
        actionable: true,
        dateRange: { 
          start: new Date(now.getTime() - parseInt(selectedPeriod) * 24 * 60 * 60 * 1000).toISOString(), 
          end: now.toISOString() 
        },
        createdAt: now.toISOString(),
      });
    }

    return aiInsights;
  };

  const filteredInsights = useMemo(() => {
    const allInsights = [...insights, ...generateAIInsights()];
    if (selectedInsightType === 'all') {
      return allInsights;
    }
    return allInsights.filter(insight => insight.type === selectedInsightType);
  }, [insights, selectedInsightType, analytics]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return '📊';
      case 'anomaly':
        return '⚠️';
      case 'trend':
        return '📈';
      case 'suggestion':
        return '💡';
      default:
        return '🔍';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'anomaly':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'trend':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'suggestion':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Spending Insights</h3>
          <p className="text-sm text-gray-600">
            Discover patterns and anomalies in your spending behavior
          </p>
        </div>
        <button
          onClick={onGenerateInsights}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Insights
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Insight Type
          </label>
          <select
            value={selectedInsightType}
            onChange={(e) => setSelectedInsightType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Insights</option>
            <option value="pattern">Patterns</option>
            <option value="anomaly">Anomalies</option>
            <option value="trend">Trends</option>
            <option value="suggestion">Suggestions</option>
          </select>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">Total Spending</div>
          <div className="text-2xl font-bold text-gray-900">₹{analytics.currentTotal.toFixed(2)}</div>
          <div className={`text-sm ${analytics.trendPercentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {analytics.trendPercentage >= 0 ? '↑' : '↓'} {Math.abs(analytics.trendPercentage).toFixed(1)}% vs last period
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">Daily Average</div>
          <div className="text-2xl font-bold text-gray-900">₹{analytics.averageDaily.toFixed(2)}</div>
          <div className="text-sm text-gray-500">Over {selectedPeriod} days</div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">Avg per Transaction</div>
          <div className="text-2xl font-bold text-gray-900">₹{analytics.averagePerTransaction.toFixed(2)}</div>
          <div className="text-sm text-gray-500">{analytics.totalTransactions} transactions</div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">Top Category</div>
          <div className="text-lg font-bold text-gray-900">
            {Object.entries(analytics.categorySpending).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            ₹{Object.entries(analytics.categorySpending).sort(([,a], [,b]) => b - a)[0]?.[1]?.toFixed(2) || '0.00'}
          </div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-medium mb-2">No insights available</h3>
            <p className="text-sm">
              Add more expenses or try a different time period to generate insights
            </p>
          </div>
        ) : (
          filteredInsights
            .sort((a, b) => b.confidence - a.confidence)
            .map((insight) => (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium">{insight.title}</h4>
                      <span className="px-2 py-0.5 text-xs bg-white bg-opacity-60 rounded-full">
                        {(insight.confidence * 100).toFixed(0)}% confidence
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-white bg-opacity-60 rounded-full capitalize">
                        {insight.type}
                      </span>
                    </div>
                    <p className="text-sm mb-3">{insight.description}</p>
                    
                    {/* Action buttons for actionable insights */}
                    {insight.actionable && (
                      <div className="flex space-x-2">
                        {insight.type === 'suggestion' && insight.data?.suggestion === 'daily_limits' && (
                          <button className="px-3 py-1 text-xs bg-white bg-opacity-80 hover:bg-opacity-100 rounded-md transition-colors">
                            Set Daily Limit
                          </button>
                        )}
                        {insight.category && (
                          <button className="px-3 py-1 text-xs bg-white bg-opacity-80 hover:bg-opacity-100 rounded-md transition-colors">
                            View {insight.category} Expenses
                          </button>
                        )}
                        <button className="px-3 py-1 text-xs bg-white bg-opacity-80 hover:bg-opacity-100 rounded-md transition-colors">
                          Learn More
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  {new Date(insight.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Insights Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="text-sm font-medium text-blue-800">How AI Insights Work</h5>
            <ul className="text-sm text-blue-700 mt-1 space-y-1">
              <li>• <strong>Patterns:</strong> Recurring spending behaviors and trends</li>
              <li>• <strong>Anomalies:</strong> Unusual spending that deviates from your normal patterns</li>
              <li>• <strong>Trends:</strong> Changes in spending over time</li>
              <li>• <strong>Suggestions:</strong> Actionable recommendations to improve your finances</li>
              <li>• Confidence scores indicate how reliable each insight is</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};