import React, { useState, useMemo } from 'react';
import { useExpenses } from '../hooks/useExpenses';
import { getAnalyticsData } from '../utils/analyticsUtils';
import { TrendChart } from './TrendChart';
import { CategoryInsights } from './CategoryInsights';
import { SpendingPersonality } from './SpendingPersonality';
import { 
  ChartBarIcon, 
  TagIcon, 
  UserIcon, 
  InformationCircleIcon,
  CalendarDaysIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export const SmartAnalytics: React.FC = () => {
  const { expenses } = useExpenses();
  const [activeTab, setActiveTab] = useState<'trends' | 'categories' | 'personality' | 'overview'>('overview');

  const analyticsData = useMemo(() => {
    return getAnalyticsData(expenses);
  }, [expenses]);

  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: InformationCircleIcon },
    { id: 'trends' as const, name: 'Trends', icon: ChartBarIcon },
    { id: 'categories' as const, name: 'Categories', icon: TagIcon },
    { id: 'personality' as const, name: 'Personality', icon: UserIcon },
  ];

  if (expenses.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Analytics Available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start tracking expenses to see your spending insights and patterns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Smart Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover insights about your spending patterns and financial habits
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Spent</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ₹{analyticsData.totalSpent.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Monthly</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ₹{analyticsData.avgMonthlySpending.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Top Month</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {analyticsData.mostExpensiveMonth}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Spending Type</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {analyticsData.spendingPersonality.title}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TrendChart
              data={analyticsData.monthlyTrends}
              title="Monthly Spending Trend"
              type="amount"
              height={300}
            />
            <CategoryInsights insights={analyticsData.categoryInsights.slice(0, 5)} />
          </div>

          {/* Personality Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending Personality Summary</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-gray-900">
                  {analyticsData.spendingPersonality.title}
                </h4>
                <p className="text-gray-600 mt-1">
                  {analyticsData.spendingPersonality.description}
                </p>
                <button
                  onClick={() => setActiveTab('personality')}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View detailed analysis →
                </button>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {analyticsData.spendingPersonality.score.toFixed(0)}
                </div>
                <div className="text-sm text-gray-500">Spending Score</div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Spending Patterns</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Your highest spending day was {analyticsData.topSpendingDay}</li>
                  <li>• You have {analyticsData.monthlyTrends.length} months of data</li>
                  <li>• Most expensive month: {analyticsData.mostExpensiveMonth}</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Category Highlights</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {analyticsData.categoryInsights.slice(0, 3).map((insight) => (
                    <li key={insight.category}>
                      • {insight.category}: ₹{insight.amount.toLocaleString('en-IN')} ({insight.percentage.toFixed(1)}%)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-8">
          <TrendChart
            data={analyticsData.monthlyTrends}
            title="Monthly Spending Trends"
            type="amount"
            height={400}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TrendChart
              data={analyticsData.monthlyTrends}
              title="Monthly Transaction Count"
              type="count"
              height={300}
            />
            
            <TrendChart
              data={analyticsData.yearlyTrends}
              title="Yearly Overview"
              type="amount"
              height={300}
            />
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div>
          <CategoryInsights insights={analyticsData.categoryInsights} />
        </div>
      )}

      {activeTab === 'personality' && (
        <div>
          <SpendingPersonality personality={analyticsData.spendingPersonality} />
        </div>
      )}
    </div>
  );
};