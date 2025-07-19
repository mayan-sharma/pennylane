import React from 'react';
import type { SeasonalPattern, PredictiveInsight } from '../utils/analyticsUtils';
import { 
  ExclamationTriangleIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  SparklesIcon,
  SunIcon,
  CloudIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

interface AdvancedInsightsProps {
  seasonalPatterns: SeasonalPattern[];
  predictiveInsights: PredictiveInsight[];
  spendingVariability: number;
  recurringExpenseRatio: number;
}

export const AdvancedInsights: React.FC<AdvancedInsightsProps> = ({
  seasonalPatterns,
  predictiveInsights,
  spendingVariability,
  recurringExpenseRatio
}) => {
  const getInsightIcon = (type: PredictiveInsight['type']) => {
    switch (type) {
      case 'warning':
        return ExclamationTriangleIcon;
      case 'info':
        return InformationCircleIcon;
      case 'success':
        return CheckCircleIcon;
      default:
        return InformationCircleIcon;
    }
  };

  const getInsightStyle = (type: PredictiveInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getSeasonIcon = (season: SeasonalPattern['season']) => {
    switch (season) {
      case 'Spring':
        return BeakerIcon;
      case 'Summer':
        return SunIcon;
      case 'Fall':
        return CloudIcon;
      case 'Winter':
        return CloudIcon;
      default:
        return CloudIcon;
    }
  };

  const getVariabilityLevel = (variability: number) => {
    if (variability < 0.2) return { level: 'Very Stable', color: 'text-green-600', bg: 'bg-green-100' };
    if (variability < 0.4) return { level: 'Stable', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (variability < 0.6) return { level: 'Moderate', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (variability < 0.8) return { level: 'Variable', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'Highly Variable', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getRecurringLevel = (ratio: number) => {
    if (ratio < 0.2) return { level: 'Low Recurring', color: 'text-red-600', bg: 'bg-red-100' };
    if (ratio < 0.4) return { level: 'Some Recurring', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (ratio < 0.6) return { level: 'Many Recurring', color: 'text-blue-600', bg: 'bg-blue-100' };
    return { level: 'Highly Recurring', color: 'text-green-600', bg: 'bg-green-100' };
  };

  const variabilityInfo = getVariabilityLevel(spendingVariability);
  const recurringInfo = getRecurringLevel(recurringExpenseRatio);

  return (
    <div className="space-y-6">
      {/* Predictive Insights */}
      {predictiveInsights.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <SparklesIcon className="w-6 h-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
          </div>
          <div className="space-y-3">
            {predictiveInsights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getInsightStyle(insight.type)}`}
                >
                  <div className="flex items-start">
                    <Icon className="w-5 h-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{insight.title}</h4>
                        <span className="text-xs opacity-75">
                          {(insight.confidence * 100).toFixed(0)}% confidence
                        </span>
                      </div>
                      <p className="text-sm mt-1">{insight.description}</p>
                      {insight.category && (
                        <span className="inline-block mt-2 px-2 py-1 text-xs rounded-full bg-white bg-opacity-50">
                          {insight.category}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spending Behavior Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Behavior Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spending Variability */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Spending Consistency</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${variabilityInfo.bg} ${variabilityInfo.color}`}>
                {variabilityInfo.level}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(spendingVariability * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Variability Score: {(spendingVariability * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {spendingVariability < 0.3 
                ? 'Your spending is very consistent day-to-day'
                : spendingVariability < 0.6
                ? 'Your spending varies moderately'
                : 'Your spending is quite variable - consider budgeting'
              }
            </p>
          </div>

          {/* Recurring Expenses */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Recurring Expenses</h4>
              <span className={`px-2 py-1 text-xs rounded-full ${recurringInfo.bg} ${recurringInfo.color}`}>
                {recurringInfo.level}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(recurringExpenseRatio * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              Recurring Ratio: {(recurringExpenseRatio * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {recurringExpenseRatio > 0.4 
                ? 'You have many predictable expenses'
                : 'Most of your expenses are variable'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Seasonal Patterns */}
      {seasonalPatterns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Spending Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {seasonalPatterns.map((pattern) => {
              const Icon = getSeasonIcon(pattern.season);
              return (
                <div key={pattern.season} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <Icon className="w-5 h-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-gray-900">{pattern.season}</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Avg Spending</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ₹{pattern.averageSpending.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Top Category</p>
                      <p className="text-sm font-medium text-blue-600">{pattern.peakCategory}</p>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-600">Trend:</p>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        pattern.spendingTrend === 'increasing' 
                          ? 'bg-red-100 text-red-700'
                          : pattern.spendingTrend === 'decreasing'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {pattern.spendingTrend}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {seasonalPatterns.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Seasonal Insight:</strong> Your highest spending season appears to be{' '}
                {seasonalPatterns.reduce((max, pattern) => 
                  pattern.averageSpending > max.averageSpending ? pattern : max
                ).season} with an average of ₹
                {seasonalPatterns.reduce((max, pattern) => 
                  pattern.averageSpending > max.averageSpending ? pattern : max
                ).averageSpending.toLocaleString('en-IN')} per month.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Smart Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Spending Optimization</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Set up automatic savings for consistent amounts</li>
              <li>• Use the 24-hour rule for purchases over ₹5,000</li>
              <li>• Review subscriptions monthly</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Budget Planning</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Plan for seasonal spending variations</li>
              <li>• Track recurring expenses separately</li>
              <li>• Set category-specific spending alerts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};