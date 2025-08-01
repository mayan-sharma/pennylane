import React from 'react';
import { type Expense, type ExpenseStats } from '../types';
import { formatCurrency } from '../utils/formatters';

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
  const generateRecommendations = () => {
    const recommendations = [];
    
    if (stats.thisMonth > income * 0.8) {
      recommendations.push({
        type: 'warning',
        title: 'High Spending Alert',
        message: 'Your monthly spending is approaching your income.'
      });
    }
    
    const topCategory = Object.entries(stats.byCategory)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (topCategory && topCategory[1] > stats.total * 0.4) {
      recommendations.push({
        type: 'suggestion',
        title: 'Category Optimization',
        message: `Consider reviewing your ${topCategory[0]} expenses (${formatCurrency(topCategory[1])})`
      });
    }
    
    return recommendations.slice(0, 3);
  };

  const recommendations = generateRecommendations();

  if (recommendations.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
        <p className="text-gray-500">Great job! No recommendations at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">AI Recommendations</h3>
      <div className="space-y-3">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg ${
              rec.type === 'warning' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
            } border`}
          >
            <h4 className="font-medium text-sm">{rec.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{rec.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};