import React from 'react';
import type { CategoryInsight } from '../utils/analyticsUtils';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from '@heroicons/react/24/outline';

interface CategoryInsightsProps {
  insights: CategoryInsight[];
}

export const CategoryInsights: React.FC<CategoryInsightsProps> = ({ insights }) => {
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Insights</h3>
        <div className="text-gray-500 text-center py-8">
          No spending data available for analysis
        </div>
      </div>
    );
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="w-4 h-4 text-red-500" />;
      case 'down':
        return <ArrowDownIcon className="w-4 h-4 text-green-500" />;
      default:
        return <MinusIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-orange-100 text-orange-800',
      'Transport': 'bg-blue-100 text-blue-800',
      'Bills': 'bg-red-100 text-red-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Healthcare': 'bg-green-100 text-green-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'Travel': 'bg-yellow-100 text-yellow-800',
      'Housing': 'bg-gray-100 text-gray-800',
      'Other': 'bg-slate-100 text-slate-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const maxAmount = Math.max(...insights.map(i => i.amount));

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Category Insights</h3>
        <div className="text-xs text-gray-500">vs. last month</div>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.category} className="relative">
            {/* Progress bar background */}
            <div className="absolute left-0 top-0 bottom-0 bg-gray-100 rounded-lg opacity-50"
                 style={{ width: `${(insight.amount / maxAmount) * 100}%` }}>
            </div>

            {/* Content */}
            <div className="relative p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(insight.category)}`}>
                    {insight.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(insight.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(insight.trend)}`}>
                      {insight.trendPercentage > 0 && `${insight.trendPercentage.toFixed(1)}%`}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    ₹{insight.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {insight.percentage.toFixed(1)}% of total
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                <div>
                  Avg per transaction: ₹{insight.avgTransactionSize.toFixed(0)}
                </div>
                <div className="flex items-center space-x-4">
                  {insight.trend === 'up' && (
                    <span className="text-red-600 text-xs">
                      ↗ Higher than usual
                    </span>
                  )}
                  {insight.trend === 'down' && (
                    <span className="text-green-600 text-xs">
                      ↘ Lower than usual
                    </span>
                  )}
                  {insight.trend === 'stable' && (
                    <span className="text-gray-500 text-xs">
                      → Consistent
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary insights */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="font-medium text-gray-900 mb-3">Quick Insights</h4>
        <div className="space-y-2 text-sm">
          {insights.length > 0 && (
            <>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span className="text-blue-800">Top spending category:</span>
                <span className="font-medium text-blue-900">{insights[0].category}</span>
              </div>
              
              {insights.find(i => i.trend === 'up') && (
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-red-800">Increasing spending in:</span>
                  <span className="font-medium text-red-900">
                    {insights.filter(i => i.trend === 'up').length} categories
                  </span>
                </div>
              )}
              
              {insights.find(i => i.trend === 'down') && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-green-800">Decreasing spending in:</span>
                  <span className="font-medium text-green-900">
                    {insights.filter(i => i.trend === 'down').length} categories
                  </span>
                </div>
              )}

              {insights.length >= 3 && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-yellow-800">Top 3 categories represent:</span>
                  <span className="font-medium text-yellow-900">
                    {insights.slice(0, 3).reduce((sum, i) => sum + i.percentage, 0).toFixed(1)}% of spending
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};