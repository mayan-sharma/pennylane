import React, { useState } from 'react';
import type { BudgetAnalytics as BudgetAnalyticsType, BudgetStatus } from '../types';

interface BudgetAnalyticsProps {
  analytics: BudgetAnalyticsType;
  budgetStatuses: BudgetStatus[];
  onExportData: () => void;
}

export const BudgetAnalytics: React.FC<BudgetAnalyticsProps> = ({
  analytics,
  budgetStatuses,
  onExportData
}) => {
  const [activeTab, setActiveTab] = useState<'trends' | 'performance' | 'patterns' | 'forecast'>('trends');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getPerformanceColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600 bg-green-50';
      case 'declining': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '➡️';
    }
  };

  const renderTrendsTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Monthly Budget vs Spending</h3>
        <div className="space-y-3">
          {analytics.monthlyTrends.slice(-6).map((trend) => (
            <div key={trend.month} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="font-medium">{trend.month}</span>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">
                  Budgeted: {formatCurrency(trend.budgeted)}
                </span>
                <span className="text-blue-600">
                  Spent: {formatCurrency(trend.spent)}
                </span>
                <span className="text-green-600">
                  Saved: {formatCurrency(trend.saved)}
                </span>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${trend.spent > trend.budgeted ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(100, (trend.spent / Math.max(trend.budgeted, 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Current Period Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgetStatuses.map((status) => (
            <div key={status.budget.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm">
                  {status.budget.category === 'total' ? 'Total' : status.budget.category}
                </h4>
                <span className="text-lg">{getTrendIcon(status.trend)}</span>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Spent: {formatCurrency(status.spent)}</div>
                <div>Projected: {formatCurrency(status.projectedSpending)}</div>
                <div>vs Previous: {status.previousPeriodComparison.changePercent > 0 ? '+' : ''}{status.previousPeriodComparison.changePercent.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Category Performance</h3>
        <div className="space-y-4">
          {analytics.categoryPerformance.map((perf) => (
            <div key={perf.category} className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <h4 className="font-medium">{perf.category}</h4>
                <p className="text-sm text-gray-600">
                  Average Usage: {perf.averageUsage.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(perf.trend)}`}>
                  {perf.trend}
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  Consistency: {perf.consistency.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Budget Utilization</h3>
          <div className="space-y-3">
            {budgetStatuses.map((status) => (
              <div key={status.budget.id} className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {status.budget.category === 'total' ? 'Total' : status.budget.category}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        status.isOverBudget ? 'bg-red-500' :
                        status.percentUsed >= 90 ? 'bg-orange-500' :
                        status.percentUsed >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(100, status.percentUsed)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {status.percentUsed.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Savings Potential</h3>
          <div className="space-y-3">
            {budgetStatuses
              .filter(status => status.remaining > 0)
              .sort((a, b) => b.remaining - a.remaining)
              .slice(0, 5)
              .map((status) => (
                <div key={status.budget.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {status.budget.category === 'total' ? 'Total' : status.budget.category}
                  </span>
                  <span className="text-sm text-green-600 font-medium">
                    {formatCurrency(status.remaining)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatternsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Spending by Day of Week</h3>
          <div className="space-y-2">
            {analytics.spendingPatterns.dayOfWeek.map((day) => (
              <div key={day.day} className="flex items-center justify-between">
                <span className="text-sm font-medium w-12">{day.day}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${(day.average / Math.max(...analytics.spendingPatterns.dayOfWeek.map(d => d.average))) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {formatCurrency(day.average)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Spending by Week of Month</h3>
          <div className="space-y-2">
            {analytics.spendingPatterns.weekOfMonth.map((week) => (
              <div key={week.week} className="flex items-center justify-between">
                <span className="text-sm font-medium">Week {week.week}</span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{
                        width: `${(week.average / Math.max(...analytics.spendingPatterns.weekOfMonth.map(w => w.average))) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {formatCurrency(week.average)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Spending Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Highest Spending Day</h4>
            <p className="text-sm text-blue-600">
              {analytics.spendingPatterns.dayOfWeek.reduce((max, day) => 
                day.average > max.average ? day : max
              ).day}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Most Consistent Week</h4>
            <p className="text-sm text-green-600">
              Week {analytics.spendingPatterns.weekOfMonth.reduce((min, week) => 
                Math.abs(week.average - 
                  analytics.spendingPatterns.weekOfMonth.reduce((sum, w) => sum + w.average, 0) / 4
                ) < Math.abs(min.average - 
                  analytics.spendingPatterns.weekOfMonth.reduce((sum, w) => sum + w.average, 0) / 4
                ) ? week : min
              ).week}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-2">Average Daily Spending</h4>
            <p className="text-sm text-purple-600">
              {formatCurrency(
                analytics.spendingPatterns.dayOfWeek.reduce((sum, day) => sum + day.average, 0) / 7
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderForecastTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Next Month Prediction</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(analytics.forecasting.nextMonthPrediction)}
            </p>
            <p className="text-sm text-gray-600">
              Confidence: {analytics.forecasting.confidence}%
            </p>
          </div>
          <div className="text-right">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-bold">{analytics.forecasting.confidence}%</span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Prediction Factors:</h4>
          <ul className="space-y-1">
            {analytics.forecasting.factors.map((factor, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                {factor}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Budget Recommendations</h3>
          <div className="space-y-3">
            {budgetStatuses
              .filter(status => status.trend === 'increasing' || status.percentUsed > 90)
              .map((status) => (
                <div key={status.budget.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <h4 className="font-medium text-yellow-800">
                    {status.budget.category === 'total' ? 'Total Budget' : status.budget.category}
                  </h4>
                  <p className="text-sm text-yellow-700">
                    {status.trend === 'increasing' 
                      ? 'Consider increasing budget by 10-15%'
                      : 'Monitor closely - approaching budget limit'
                    }
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Optimization Opportunities</h3>
          <div className="space-y-3">
            {budgetStatuses
              .filter(status => status.percentUsed < 60 && status.remaining > 1000)
              .map((status) => (
                <div key={status.budget.id} className="p-3 bg-green-50 border border-green-200 rounded">
                  <h4 className="font-medium text-green-800">
                    {status.budget.category === 'total' ? 'Total Budget' : status.budget.category}
                  </h4>
                  <p className="text-sm text-green-700">
                    Potential savings: {formatCurrency(status.remaining)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Budget Analytics</h2>
        <button
          onClick={onExportData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Export Data
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'trends', label: 'Trends' },
            { id: 'performance', label: 'Performance' },
            { id: 'patterns', label: 'Patterns' },
            { id: 'forecast', label: 'Forecast' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === 'trends' && renderTrendsTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'patterns' && renderPatternsTab()}
        {activeTab === 'forecast' && renderForecastTab()}
      </div>
    </div>
  );
};