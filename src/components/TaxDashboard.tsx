import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useInvestments } from '../hooks/useInvestments';
import { useNotifications } from '../hooks/useNotifications';
import { useTax } from '../hooks/useTax';
import { 
  calculateInvestmentRecommendations, 
  getFinancialYear, 
  calculateTaxProjection,
  calculateIncomeTax,
  compareTaxRegimes
} from '../utils/taxCalculation';
import { TaxCalendar } from './TaxCalendar';
import { DocumentTracker } from './DocumentTracker';
import { ScenarioPlanner } from './ScenarioPlanner';
import type { Expense } from '../types';

interface TaxDashboardProps {
  expenses: Expense[];
}

export const TaxDashboard: React.FC<TaxDashboardProps> = ({ expenses }) => {
  const [selectedView, setSelectedView] = useState<'overview' | 'projection' | 'regime' | 'calendar' | 'documents' | 'scenarios'>('overview');
  const [mockIncome, setMockIncome] = useState(1200000);
  const [debouncedIncome, setDebouncedIncome] = useState(1200000);
  
  // Debounce income input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedIncome(mockIncome);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [mockIncome]);
  
  // Persist selected view to localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('taxDashboardView');
    if (savedView) {
      setSelectedView(savedView as 'overview' | 'projection' | 'regime');
    }
  }, []);
  
  const handleViewChange = useCallback((view: 'overview' | 'projection' | 'regime' | 'calendar' | 'documents' | 'scenarios') => {
    setSelectedView(view);
    localStorage.setItem('taxDashboardView', view);
  }, []);
  
  const { getInvestmentSummary, getMaturingInvestments } = useInvestments();
  const { getUnreadCount, getHighPriorityNotifications } = useNotifications();
  const { calculateTotalDeductions } = useTax(expenses);

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

  const investmentSummary = getInvestmentSummary();
  const totalDeductions = calculateTotalDeductions();
  const maturingInvestments = getMaturingInvestments();
  const highPriorityNotifications = getHighPriorityNotifications();

  const recommendations = useMemo(() => 
    calculateInvestmentRecommendations(debouncedIncome, totalDeductions), 
    [debouncedIncome, totalDeductions]
  );

  const taxProjection = useMemo(() => 
    calculateTaxProjection(debouncedIncome, totalDeductions), 
    [debouncedIncome, totalDeductions]
  );

  const regimeComparison = useMemo(() => 
    compareTaxRegimes(debouncedIncome, totalDeductions), 
    [debouncedIncome, totalDeductions]
  );

  const currentTax = useMemo(() => 
    calculateIncomeTax(debouncedIncome, totalDeductions), 
    [debouncedIncome, totalDeductions]
  );

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8, color = "blue" }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            className={`text-${color}-500`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-2xl font-bold">{Math.round(percentage)}%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Income Input */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Tax Dashboard</h2>
        <div className="flex items-center space-x-2">
          <label htmlFor="income" className="text-sm font-medium text-gray-700">Annual Income:</label>
          <input
            id="income"
            type="number"
            value={mockIncome}
            onChange={(e) => setMockIncome(Number(e.target.value) || 0)}
            className="w-32 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            placeholder="1200000"
            aria-describedby="income-help"
          />
          {mockIncome !== debouncedIncome && (
            <div className="text-xs text-gray-500">Calculating...</div>
          )}
        </div>
      </div>

      {/* View Toggle */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'projection', label: 'Tax Projection', icon: '🔮' },
            { id: 'regime', label: 'Regime Comparison', icon: '⚖️' },
            { id: 'scenarios', label: 'Scenario Planning', icon: '🎯' },
            { id: 'calendar', label: 'Tax Calendar', icon: '📅' },
            { id: 'documents', label: 'Documents', icon: '📋' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleViewChange(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                selectedView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {highPriorityNotifications.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Urgent Actions Required</h3>
                <p className="text-sm text-red-600">{highPriorityNotifications.length} high priority alerts</p>
              </div>
            </div>
          </div>
        )}

        {maturingInvestments.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Investments Maturing</h3>
                <p className="text-sm text-yellow-600">{maturingInvestments.length} investments in next 90 days</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Tax Efficiency</h3>
              <p className="text-sm text-green-600">{Math.round(currentTax.effectiveRate)}% effective rate</p>
            </div>
          </div>
        </div>
      </div>

      {selectedView === 'overview' && (
        <>
          {/* Enhanced Quick Stats with Circular Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Annual Income</h3>
                  <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(debouncedIncome)}</p>
                  <p className="text-xs text-gray-500 mt-1">Financial Year {getFinancialYear()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tax Liability</h3>
                  <p className="text-2xl font-bold text-red-600">{formatCompactCurrency(currentTax.totalTax)}</p>
                  <p className="text-xs text-gray-500 mt-1">{currentTax.effectiveRate.toFixed(2)}% effective rate</p>
                </div>
                <CircularProgress 
                  percentage={currentTax.effectiveRate} 
                  size={60} 
                  strokeWidth={6} 
                  color="red" 
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Deductions</h3>
                  <p className="text-2xl font-bold text-green-600">{formatCompactCurrency(totalDeductions)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCompactCurrency(Math.max(0, 150000 - totalDeductions))} remaining in 80C
                  </p>
                </div>
                <CircularProgress 
                  percentage={(totalDeductions / 200000) * 100} 
                  size={60} 
                  strokeWidth={6} 
                  color="green" 
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Potential Savings</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCompactCurrency(recommendations.reduce((sum, rec) => sum + rec.taxBenefit, 0))}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Through optimization</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Investment Progress */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">Tax Saving Progress</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { section: '80C', limit: 150000, current: investmentSummary['80C'] || 0, color: 'blue', name: 'Section 80C' },
                { section: '80D', limit: 25000, current: investmentSummary['80D'] || 0, color: 'green', name: 'Health Insurance' },
                { section: '80CCD', limit: 50000, current: investmentSummary['80CCD'] || 0, color: 'purple', name: 'NPS Additional' }
              ].map((item) => (
                <div key={item.section} className="text-center">
                  <div className="mb-4">
                    <CircularProgress 
                      percentage={(item.current / item.limit) * 100} 
                      size={120} 
                      color={item.color} 
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-sm text-gray-600">{formatCompactCurrency(item.current)} / {formatCompactCurrency(item.limit)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCompactCurrency(Math.max(0, item.limit - item.current))} remaining
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {selectedView === 'projection' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Tax Year Projection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800">Remaining Months</h4>
                <p className="text-2xl font-bold text-blue-600">{taxProjection.remainingMonths}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-800">Projected Income</h4>
                <p className="text-2xl font-bold text-green-600">{formatCompactCurrency(taxProjection.projectedIncome)}</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h4 className="text-sm font-medium text-red-800">Projected Tax</h4>
                <p className="text-2xl font-bold text-red-600">{formatCompactCurrency(taxProjection.projectedTax)}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="text-sm font-medium text-purple-800">Monthly SIP Needed</h4>
                <p className="text-2xl font-bold text-purple-600">{formatCompactCurrency(taxProjection.monthlyRecommendation)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'regime' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Tax Regime Comparison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Old Tax Regime</h4>
                <div className="space-y-2">
                  <p className="text-sm">Taxable Income: <span className="font-medium">{formatCurrency(regimeComparison.oldRegime.taxableIncome)}</span></p>
                  <p className="text-sm">Total Tax: <span className="font-medium text-red-600">{formatCurrency(regimeComparison.oldRegime.totalTax)}</span></p>
                  <p className="text-sm">Effective Rate: <span className="font-medium">{regimeComparison.oldRegime.effectiveRate.toFixed(2)}%</span></p>
                  <p className="text-sm">Deductions Used: <span className="font-medium">{formatCurrency(regimeComparison.oldRegime.availableDeductions)}</span></p>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">New Tax Regime</h4>
                <div className="space-y-2">
                  <p className="text-sm">Taxable Income: <span className="font-medium">{formatCurrency(regimeComparison.newRegime.taxableIncome)}</span></p>
                  <p className="text-sm">Total Tax: <span className="font-medium text-red-600">{formatCurrency(regimeComparison.newRegime.totalTax)}</span></p>
                  <p className="text-sm">Effective Rate: <span className="font-medium">{regimeComparison.newRegime.effectiveRate.toFixed(2)}%</span></p>
                  <p className="text-sm">Standard Deduction: <span className="font-medium">{formatCurrency(regimeComparison.newRegime.standardDeduction)}</span></p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Recommendation</h4>
              <p className="text-sm">
                <span className={`font-medium ${regimeComparison.recommendation === 'NEW' ? 'text-green-600' : 'text-blue-600'}`}>
                  {regimeComparison.recommendation === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'}
                </span> is better for you. 
                You save <span className="font-medium text-green-600">{formatCurrency(regimeComparison.savings)}</span> in taxes.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'calendar' && (
        <TaxCalendar />
      )}

      {selectedView === 'documents' && (
        <DocumentTracker />
      )}

      {selectedView === 'scenarios' && (
        <ScenarioPlanner 
          currentIncome={debouncedIncome} 
          currentDeductions={totalDeductions} 
        />
      )}

      {/* Investment Recommendations */}
      {selectedView !== 'calendar' && selectedView !== 'documents' && selectedView !== 'scenarios' && recommendations.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Smart Investment Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-semibold text-gray-900">{rec.type}</h4>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    rec.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investment:</span>
                    <span className="font-medium">{formatCompactCurrency(rec.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax Benefit:</span>
                    <span className="font-medium text-green-600">{formatCompactCurrency(rec.taxBenefit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Section:</span>
                    <span className="font-medium">{rec.section}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Returns:</span>
                    <span className="text-blue-600 font-medium">{rec.returns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lock-in:</span>
                    <span className="text-orange-600">{rec.lockIn}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: '📊', label: 'Compare Regimes', onClick: () => setSelectedView('regime') },
            { icon: '💰', label: 'Add Investment', onClick: () => {} },
            { icon: '📈', label: 'Generate Report', onClick: () => {} },
            { icon: '🧮', label: 'Tax Calculator', onClick: () => {} }
          ].map((action, index) => (
            <button 
              key={index}
              onClick={action.onClick}
              className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{action.icon}</div>
              <div className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{action.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};