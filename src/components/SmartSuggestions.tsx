import React, { useState } from 'react';
import type { SmartSuggestion, Expense, Budget } from '../types/expense';

interface SmartSuggestionsProps {
  suggestions: SmartSuggestion[];
  expenses: Expense[];
  budgets: Budget[];
  onApplySuggestion: (suggestionId: string) => void;
  onDismissSuggestion: (suggestionId: string) => void;
  onGenerateNewSuggestions: () => void;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  suggestions,
  expenses,
  budgets,
  onApplySuggestion,
  onDismissSuggestion,
  onGenerateNewSuggestions
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'budgets' | 'insights'>('overview');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const availableTypes = ['all', ...new Set(suggestions.map(s => s.type))];
  const priorityLevels = ['all', 'high', 'medium', 'low'];

  const filteredSuggestions = suggestions.filter(suggestion => {
    const typeMatch = filterType === 'all' || suggestion.type === filterType;
    const priorityMatch = filterPriority === 'all' || suggestion.priority === filterPriority;
    return typeMatch && priorityMatch && !suggestion.appliedAt;
  });

  const appliedSuggestions = suggestions.filter(s => s.appliedAt);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-green-200 bg-green-50 text-green-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'category_optimization': return '🎯';
      case 'budget_adjustment': return '📊';
      case 'saving_opportunity': return '💰';
      case 'spending_pattern': return '📈';
      default: return '💡';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const analyzeSpendingPatterns = () => {
    // Simple analysis for demonstration
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });

    const categoryTotals = monthlyExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalExpenses: monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
      categoryBreakdown: categoryTotals,
      topSpendingCategory: Object.entries(categoryTotals).sort(([,a], [,b]) => b - a)[0],
      expenseCount: monthlyExpenses.length
    };
  };

  const generateCategoryRecommendations = () => {
    const analysis = analyzeSpendingPatterns();
    const recommendations = [];

    // Example recommendations based on spending patterns
    if (analysis.topSpendingCategory && analysis.topSpendingCategory[1] > 10000) {
      recommendations.push({
        title: `High ${analysis.topSpendingCategory[0]} Spending Detected`,
        description: `Your ${analysis.topSpendingCategory[0]} spending is ₹${analysis.topSpendingCategory[1].toLocaleString()} this month. Consider setting a specific budget or finding ways to reduce this category.`,
        impact: 'high' as const,
        category: analysis.topSpendingCategory[0]
      });
    }

    if (analysis.expenseCount > 50) {
      recommendations.push({
        title: 'Frequent Small Transactions',
        description: `You have ${analysis.expenseCount} transactions this month. Consider consolidating purchases or using a weekly allowance to reduce transaction frequency.`,
        impact: 'medium' as const,
        category: 'general'
      });
    }

    return recommendations;
  };

  const getBudgetUtilization = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return budgets.map(budget => {
      const relevantExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        const matchesCategory = budget.category === 'total' || expense.category === budget.category;
        const matchesPeriod = budget.period === 'monthly' 
          ? expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
          : true; // Simplified for demo
        
        return matchesCategory && matchesPeriod;
      });

      const spent = relevantExpenses.reduce((sum, e) => sum + e.amount, 0);
      const utilization = (spent / budget.amount) * 100;

      return {
        budget,
        spent,
        utilization,
        remaining: budget.amount - spent,
        status: utilization > 100 ? 'over' : utilization > 80 ? 'warning' : 'good'
      };
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Smart Suggestions</h2>
        <button
          onClick={onGenerateNewSuggestions}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Generate New Suggestions
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'categories', 'budgets', 'insights'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md flex-1 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Active Suggestions</h3>
              <p className="text-2xl font-bold text-blue-900">{filteredSuggestions.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Applied Suggestions</h3>
              <p className="text-2xl font-bold text-green-900">{appliedSuggestions.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800">Potential Savings</h3>
              <p className="text-2xl font-bold text-yellow-900">
                ₹{filteredSuggestions.reduce((sum, s) => sum + (s.potentialSavings || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">High Priority</h3>
              <p className="text-2xl font-bold text-purple-900">
                {filteredSuggestions.filter(s => s.priority === 'high').length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorityLevels.map(priority => (
                  <option key={priority} value={priority}>
                    {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Suggestions List */}
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`border-l-4 rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getTypeIcon(suggestion.type)}</div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{suggestion.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                          {suggestion.confidence}% confidence
                        </span>
                        <span className="text-xs text-gray-500">
                          {suggestion.type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                        {suggestion.category && (
                          <span className="text-xs text-gray-500 capitalize">
                            {suggestion.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {suggestion.potentialSavings && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          ₹{suggestion.potentialSavings.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">potential savings</p>
                      </div>
                    )}
                    <div className="flex flex-col space-y-2">
                      {suggestion.actionable && (
                        <button
                          onClick={() => onApplySuggestion(suggestion.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Apply
                        </button>
                      )}
                      <button
                        onClick={() => onDismissSuggestion(suggestion.id)}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
                
                {suggestion.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Suggested Actions:</h5>
                    <ul className="space-y-1">
                      {suggestion.actions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{action.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
            
            {filteredSuggestions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-lg font-medium">No suggestions available</p>
                <p className="text-sm">Generate new suggestions based on your recent activity!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Category Optimization Suggestions</h3>
            
            <div className="space-y-4">
              {generateCategoryRecommendations().map((rec, index) => (
                <div key={index} className="bg-white p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800">{rec.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.impact === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rec.impact} impact
                    </span>
                    <span className="text-xs text-gray-500 capitalize">{rec.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Top Spending Categories</h4>
              <div className="space-y-2">
                {Object.entries(analyzeSpendingPatterns().categoryBreakdown)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([category, amount]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{category}</span>
                      <span className="font-medium">₹{amount.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Suggested Categories</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Health & Wellness</span>
                  <span className="text-green-600">Create budget</span>
                </div>
                <div className="flex justify-between">
                  <span>Subscriptions</span>
                  <span className="text-blue-600">Track recurring</span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency Fund</span>
                  <span className="text-purple-600">Set goal</span>
                </div>
                <div className="flex justify-between">
                  <span>Investments</span>
                  <span className="text-yellow-600">Start tracking</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold mb-4 text-green-800">Budget Optimization</h3>
            
            <div className="space-y-4">
              {getBudgetUtilization().map((budgetData) => (
                <div key={budgetData.budget.id} className="bg-white p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-800 capitalize">{budgetData.budget.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      budgetData.status === 'over' ? 'bg-red-100 text-red-800' :
                      budgetData.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {budgetData.utilization.toFixed(1)}% used
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        budgetData.status === 'over' ? 'bg-red-500' :
                        budgetData.status === 'warning' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetData.utilization, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>₹{budgetData.spent.toLocaleString()} spent</span>
                    <span>₹{budgetData.remaining.toLocaleString()} {budgetData.remaining >= 0 ? 'remaining' : 'over budget'}</span>
                  </div>
                  
                  {budgetData.status === 'over' && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-800">
                      💡 Consider increasing this budget or reviewing recent expenses
                    </div>
                  )}
                  
                  {budgetData.status === 'good' && budgetData.utilization < 50 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                      💡 You're doing great! Consider allocating unused funds to savings
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === 'insights' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Spending Trends */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Spending Insights</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    📊
                  </div>
                  <div>
                    <p className="text-sm font-medium">Average Daily Spending</p>
                    <p className="text-xs text-gray-600">
                      ₹{Math.round(analyzeSpendingPatterns().totalExpenses / 30).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    🎯
                  </div>
                  <div>
                    <p className="text-sm font-medium">Most Frequent Category</p>
                    <p className="text-xs text-gray-600 capitalize">
                      {analyzeSpendingPatterns().topSpendingCategory?.[0] || 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    🔥
                  </div>
                  <div>
                    <p className="text-sm font-medium">Transaction Frequency</p>
                    <p className="text-xs text-gray-600">
                      {analyzeSpendingPatterns().expenseCount} transactions this month
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Applied Suggestions */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Recently Applied</h4>
              <div className="space-y-2">
                {appliedSuggestions.slice(0, 5).map((suggestion) => (
                  <div key={suggestion.id} className="flex items-center space-x-3 p-2 bg-green-50 rounded">
                    <div className="text-lg">{getTypeIcon(suggestion.type)}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{suggestion.title}</p>
                      <p className="text-xs text-gray-600">
                        Applied {new Date(suggestion.appliedAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-green-600 text-sm">✓</div>
                  </div>
                ))}
                
                {appliedSuggestions.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No suggestions applied yet</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold mb-4 text-purple-800">AI-Powered Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Spending Pattern</h4>
                <p className="text-sm text-gray-600">
                  Your spending tends to be higher on weekends, particularly in Entertainment and Food categories. 
                  Consider setting weekend-specific budgets.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Savings Opportunity</h4>
                <p className="text-sm text-gray-600">
                  You consistently underspend in your Transport budget by 20%. Consider reallocating 
                  ₹2,000 to your Emergency Fund each month.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Budget Recommendation</h4>
                <p className="text-sm text-gray-600">
                  Based on your income and expenses, you could increase your savings rate by 15% 
                  by optimizing your subscription expenses.
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">Goal Achievement</h4>
                <p className="text-sm text-gray-600">
                  At your current savings rate, you'll reach your vacation goal 2 months ahead 
                  of schedule. Consider increasing the target amount.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};