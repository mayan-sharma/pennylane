import React, { useState, useMemo } from 'react';
import { optimizeTaxStrategy, calculateIncomeTax, compareTaxRegimes } from '../utils/taxCalculation';
import type { Expense } from '../types';

interface TaxOptimizerProps {
  expenses: Expense[];
  currentIncome: number;
  currentDeductions: Record<string, number>;
}

export const TaxOptimizer: React.FC<TaxOptimizerProps> = ({
  expenses,
  currentIncome,
  currentDeductions
}) => {
  const [userProfile, setUserProfile] = useState({
    age: 30,
    riskAppetite: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    timeHorizon: 5,
    hasHomeLoan: false,
    isMetroCity: true,
    dependents: 0,
    retirementAge: 60
  });

  const [optimizationGoals, setOptimizationGoals] = useState({
    minimizeTax: 100,
    maximizeReturns: 70,
    liquidity: 50,
    riskTolerance: 60
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return formatCurrency(amount);
  };

  const optimizationResults = useMemo(() => {
    const currentTotalDeductions = Object.values(currentDeductions).reduce((sum, val) => sum + val, 0);
    const optimization = optimizeTaxStrategy(currentIncome, currentDeductions, {
      riskAppetite: userProfile.riskAppetite,
      timeHorizon: userProfile.timeHorizon
    });

    const currentTaxCalc = calculateIncomeTax(currentIncome, currentTotalDeductions);
    const regimeComparison = compareTaxRegimes(currentIncome, currentTotalDeductions);

    // Advanced recommendations based on user profile
    const recommendations = [];

    // Section 80C optimization
    const remaining80C = Math.max(0, 150000 - (currentDeductions['80C'] || 0));
    if (remaining80C > 0) {
      if (userProfile.riskAppetite === 'HIGH' && userProfile.timeHorizon >= 3) {
        recommendations.push({
          category: 'Tax Saving Investment',
          recommendation: 'ELSS Mutual Funds',
          amount: Math.min(remaining80C, 100000),
          taxSaving: Math.min(remaining80C, 100000) * 0.3,
          expectedReturns: Math.min(remaining80C, 100000) * 0.15,
          risk: 'High',
          liquidity: '3 years lock-in',
          reasoning: 'Best for long-term wealth creation with tax benefits',
          priority: 'HIGH',
          icon: '📈'
        });
      } else if (userProfile.riskAppetite === 'LOW') {
        recommendations.push({
          category: 'Tax Saving Investment',
          recommendation: 'Public Provident Fund (PPF)',
          amount: Math.min(remaining80C, 150000),
          taxSaving: Math.min(remaining80C, 150000) * 0.3,
          expectedReturns: Math.min(remaining80C, 150000) * 0.08,
          risk: 'Low',
          liquidity: '15 years lock-in',
          reasoning: 'Guaranteed returns with triple tax benefit (EEE)',
          priority: 'HIGH',
          icon: '🏦'
        });
      }
    }

    // Health insurance optimization
    if (!currentDeductions['80D'] || currentDeductions['80D'] < 25000) {
      const recommendedAmount = userProfile.age > 45 ? 50000 : 25000;
      recommendations.push({
        category: 'Health Insurance',
        recommendation: 'Family Health Insurance',
        amount: recommendedAmount,
        taxSaving: recommendedAmount * 0.3,
        expectedReturns: 0,
        risk: 'None',
        liquidity: 'Annual premium',
        reasoning: 'Essential protection with tax benefits',
        priority: 'HIGH',
        icon: '🏥'
      });
    }

    // NPS recommendation for additional benefit
    if (currentIncome > 500000 && userProfile.age < 50) {
      recommendations.push({
        category: 'Retirement Planning',
        recommendation: 'National Pension System (NPS)',
        amount: 50000,
        taxSaving: 15000,
        expectedReturns: 50000 * 0.12,
        risk: 'Medium',
        liquidity: 'Until retirement',
        reasoning: 'Additional 80CCD(1B) benefit for retirement planning',
        priority: 'MEDIUM',
        icon: '🎯'
      });
    }

    // HRA vs Home Loan optimization
    if (userProfile.hasHomeLoan) {
      recommendations.push({
        category: 'Home Loan Optimization',
        recommendation: 'Home Loan Principal + Interest',
        amount: 200000,
        taxSaving: 60000,
        expectedReturns: 0,
        risk: 'None',
        liquidity: 'Long-term',
        reasoning: 'Principal under 80C, Interest under 24(b)',
        priority: 'MEDIUM',
        icon: '🏠'
      });
    }

    // Advanced strategies based on income level
    if (currentIncome > 1500000) {
      recommendations.push({
        category: 'Advanced Tax Strategy',
        recommendation: 'Employer NPS Contribution',
        amount: currentIncome * 0.1,
        taxSaving: currentIncome * 0.1 * 0.3,
        expectedReturns: currentIncome * 0.1 * 0.12,
        risk: 'Medium',
        liquidity: 'Until retirement',
        reasoning: '10% employer contribution exempt up to ₹7.5L',
        priority: 'LOW',
        icon: '💼'
      });
    }

    return {
      currentTax: currentTaxCalc.totalTax,
      currentEffectiveRate: currentTaxCalc.effectiveRate,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }),
      totalPotentialSaving: recommendations.reduce((sum, rec) => sum + rec.taxSaving, 0),
      regimeRecommendation: regimeComparison
    };
  }, [currentIncome, currentDeductions, userProfile]);

  const riskScoreColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">AI Tax Optimizer</h2>
        <div className="text-sm text-gray-600">
          Potential Savings: <span className="font-bold text-green-600">{formatCompactCurrency(optimizationResults.totalPotentialSaving)}</span>
        </div>
      </div>

      {/* User Profile Setup */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Personal Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={userProfile.age}
              onChange={(e) => setUserProfile({ ...userProfile, age: parseInt(e.target.value) || 30 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="18"
              max="100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Appetite</label>
            <select
              value={userProfile.riskAppetite}
              onChange={(e) => setUserProfile({ ...userProfile, riskAppetite: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Conservative</option>
              <option value="MEDIUM">Moderate</option>
              <option value="HIGH">Aggressive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Horizon (Years)</label>
            <input
              type="number"
              value={userProfile.timeHorizon}
              onChange={(e) => setUserProfile({ ...userProfile, timeHorizon: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="30"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={userProfile.isMetroCity ? 'metro' : 'non-metro'}
              onChange={(e) => setUserProfile({ ...userProfile, isMetroCity: e.target.value === 'metro' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="metro">Metro City</option>
              <option value="non-metro">Non-Metro City</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={userProfile.hasHomeLoan}
              onChange={(e) => setUserProfile({ ...userProfile, hasHomeLoan: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Have Home Loan</span>
          </label>
        </div>
      </div>

      {/* Current Tax Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500">Current Tax Liability</h3>
            <p className="text-2xl font-bold text-red-600">{formatCompactCurrency(optimizationResults.currentTax)}</p>
            <p className="text-xs text-gray-500 mt-1">{optimizationResults.currentEffectiveRate.toFixed(2)}% effective rate</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500">Optimized Tax</h3>
            <p className="text-2xl font-bold text-green-600">
              {formatCompactCurrency(optimizationResults.currentTax - optimizationResults.totalPotentialSaving)}
            </p>
            <p className="text-xs text-gray-500 mt-1">After optimization</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500">Total Savings</h3>
            <p className="text-2xl font-bold text-blue-600">{formatCompactCurrency(optimizationResults.totalPotentialSaving)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {((optimizationResults.totalPotentialSaving / optimizationResults.currentTax) * 100).toFixed(1)}% reduction
            </p>
          </div>
        </div>
      </div>

      {/* Tax Regime Recommendation */}
      {optimizationResults.regimeRecommendation && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Tax Regime Optimization</h3>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900">
                  Recommended: {optimizationResults.regimeRecommendation.recommendation === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'}
                </h4>
                <p className="text-blue-800 text-sm mt-1">
                  You can save {formatCompactCurrency(optimizationResults.regimeRecommendation.savings)} annually 
                  by choosing the {optimizationResults.regimeRecommendation.recommendation.toLowerCase()} tax regime.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Personalized Recommendations */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Personalized Tax Optimization Strategies</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {optimizationResults.recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{rec.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{rec.recommendation}</h4>
                    <p className="text-sm text-gray-600">{rec.category}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${priorityColor(rec.priority)}`}>
                  {rec.priority}
                </span>
              </div>
              
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Investment Amount:</span>
                  <span className="font-medium">{formatCompactCurrency(rec.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tax Saving:</span>
                  <span className="font-medium text-green-600">{formatCompactCurrency(rec.taxSaving)}</span>
                </div>
                {rec.expectedReturns > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Expected Returns:</span>
                    <span className="font-medium text-blue-600">{formatCompactCurrency(rec.expectedReturns)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Risk Level:</span>
                  <span className={`font-medium ${riskScoreColor(rec.risk)}`}>{rec.risk}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Liquidity:</span>
                  <span className="font-medium text-gray-700">{rec.liquidity}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="text-sm font-medium text-gray-900 mb-1">Why this recommendation?</h5>
                <p className="text-sm text-gray-700">{rec.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
        
        {optimizationResults.recommendations.length === 0 && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Tax Optimization Complete!</h3>
            <p className="mt-1 text-sm text-gray-500">You're already making optimal use of available tax benefits.</p>
          </div>
        )}
      </div>

      {/* Action Plan */}
      {optimizationResults.recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
          <h3 className="text-lg font-semibold text-green-900 mb-4">🎯 Action Plan</h3>
          <div className="space-y-3">
            <h4 className="font-medium text-green-800">Immediate Actions (This Month):</h4>
            <ul className="text-sm text-green-700 space-y-1 ml-4">
              {optimizationResults.recommendations
                .filter(rec => rec.priority === 'HIGH')
                .slice(0, 3)
                .map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Start investing {formatCompactCurrency(rec.amount)} in {rec.recommendation}</span>
                  </li>
                ))}
            </ul>
            
            <h4 className="font-medium text-green-800 mt-4">Medium-term Goals (Next 3 Months):</h4>
            <ul className="text-sm text-green-700 space-y-1 ml-4">
              {optimizationResults.recommendations
                .filter(rec => rec.priority === 'MEDIUM')
                .slice(0, 2)
                .map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Consider {rec.recommendation} for additional tax benefits</span>
                  </li>
                ))}
            </ul>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-medium">Total Annual Savings:</span> {formatCompactCurrency(optimizationResults.totalPotentialSaving)} 
                <span className="ml-2 text-green-600">
                  (Effective tax rate reduction from {optimizationResults.currentEffectiveRate.toFixed(2)}% to {
                    ((optimizationResults.currentTax - optimizationResults.totalPotentialSaving) / currentIncome * 100).toFixed(2)
                  }%)
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};