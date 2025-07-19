import React, { useState, useMemo } from 'react';
import { calculateIncomeTax, getFinancialYear } from '../utils/taxCalculation';
import type { MultiYearComparison, TaxScenario } from '../types/tax';

export const MultiYearTaxPlanner: React.FC = () => {
  const [scenarios, setScenarios] = useState<TaxScenario[]>([]);
  const [showScenarioForm, setShowScenarioForm] = useState(false);
  const [selectedYears, setSelectedYears] = useState(5);
  const [growthRate, setGrowthRate] = useState(10);
  const [baseIncome, setBaseIncome] = useState(1200000);
  const [baseDeductions, setBaseDeductions] = useState(150000);

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

  const currentFY = getFinancialYear();
  const startYear = parseInt(currentFY.split('-')[0]);

  const multiYearProjection = useMemo(() => {
    const projections: MultiYearComparison[] = [];
    
    for (let i = 0; i < selectedYears; i++) {
      const year = `${startYear + i}-${startYear + i + 1}`;
      const income = baseIncome * Math.pow(1 + growthRate / 100, i);
      const deductions = baseDeductions * Math.pow(1 + Math.min(growthRate, 5) / 100, i); // Conservative deduction growth
      const taxCalc = calculateIncomeTax(income, deductions);
      
      projections.push({
        year,
        income,
        deductions,
        taxPaid: taxCalc.totalTax,
        investments: deductions, // Simplified assumption
        effectiveRate: taxCalc.effectiveRate
      });
    }
    
    return projections;
  }, [selectedYears, growthRate, baseIncome, baseDeductions, startYear]);

  const totalProjections = useMemo(() => {
    return multiYearProjection.reduce((acc, proj) => ({
      totalIncome: acc.totalIncome + proj.income,
      totalTax: acc.totalTax + proj.taxPaid,
      totalInvestments: acc.totalInvestments + proj.investments,
      avgEffectiveRate: acc.avgEffectiveRate + proj.effectiveRate / multiYearProjection.length
    }), { totalIncome: 0, totalTax: 0, totalInvestments: 0, avgEffectiveRate: 0 });
  }, [multiYearProjection]);

  const createScenario = (name: string, income: number, deductions: Record<string, number>) => {
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    const taxCalc = calculateIncomeTax(income, totalDeductions);
    
    const newScenario: TaxScenario = {
      id: Date.now().toString(),
      name,
      income,
      deductions,
      investments: deductions,
      totalTax: taxCalc.totalTax,
      effectiveRate: taxCalc.effectiveRate,
      isActive: scenarios.length === 0,
      createdAt: new Date().toISOString()
    };
    
    setScenarios([...scenarios, newScenario]);
  };

  const deleteScenario = (id: string) => {
    setScenarios(scenarios.filter(s => s.id !== id));
  };

  const toggleScenarioActive = (id: string) => {
    setScenarios(scenarios.map(s => ({
      ...s,
      isActive: s.id === id ? !s.isActive : s.isActive
    })));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Multi-Year Tax Planning</h2>
        <button
          onClick={() => setShowScenarioForm(!showScenarioForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showScenarioForm ? 'Cancel' : '+ Create Scenario'}
        </button>
      </div>

      {/* Projection Parameters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Projection Parameters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years to Project</label>
            <select
              value={selectedYears}
              onChange={(e) => setSelectedYears(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
              <option value={10}>10 Years</option>
              <option value={15}>15 Years</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income Growth (%)</label>
            <input
              type="number"
              value={growthRate}
              onChange={(e) => setGrowthRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="30"
              step="0.5"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Income (₹)</label>
            <input
              type="number"
              value={baseIncome}
              onChange={(e) => setBaseIncome(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="50000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Deductions (₹)</label>
            <input
              type="number"
              value={baseDeductions}
              onChange={(e) => setBaseDeductions(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="10000"
            />
          </div>
        </div>
      </div>

      {/* Total Projections Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
            <p className="text-2xl font-bold text-blue-600">{formatCompactCurrency(totalProjections.totalIncome)}</p>
            <p className="text-xs text-gray-500 mt-1">Over {selectedYears} years</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500">Total Tax</h3>
            <p className="text-2xl font-bold text-red-600">{formatCompactCurrency(totalProjections.totalTax)}</p>
            <p className="text-xs text-gray-500 mt-1">{((totalProjections.totalTax / totalProjections.totalIncome) * 100).toFixed(1)}% of income</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500">Total Investments</h3>
            <p className="text-2xl font-bold text-green-600">{formatCompactCurrency(totalProjections.totalInvestments)}</p>
            <p className="text-xs text-gray-500 mt-1">Tax-saving investments</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h3 className="text-sm font-medium text-gray-500">Avg. Effective Rate</h3>
            <p className="text-2xl font-bold text-purple-600">{totalProjections.avgEffectiveRate.toFixed(2)}%</p>
            <p className="text-xs text-gray-500 mt-1">Over {selectedYears} years</p>
          </div>
        </div>
      </div>

      {/* Year-over-Year Projection Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Year-over-Year Projection</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Income</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effective Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {multiYearProjection.map((projection, index) => {
                const prevProjection = index > 0 ? multiYearProjection[index - 1] : null;
                const incomeGrowth = prevProjection ? ((projection.income - prevProjection.income) / prevProjection.income) * 100 : 0;
                
                return (
                  <tr key={projection.year} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{projection.year}</div>
                      {index === 0 && <div className="text-xs text-blue-600">Current Year</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatCompactCurrency(projection.income)}</div>
                      {index > 0 && (
                        <div className="text-xs text-green-600">+{incomeGrowth.toFixed(1)}%</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatCompactCurrency(projection.deductions)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-red-600">{formatCompactCurrency(projection.taxPaid)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{projection.effectiveRate.toFixed(2)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {index === 0 ? 'Base Year' : `Year ${index + 1}`}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Planning */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Tax Scenarios</h3>
        
        {showScenarioForm && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Create New Scenario</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => createScenario('Conservative Growth', baseIncome * 1.05, { '80C': 150000, '80D': 25000 })}
                className="p-3 text-left border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="font-medium">Conservative Growth</div>
                <div className="text-sm text-gray-600">5% income growth, max deductions</div>
              </button>
              
              <button
                onClick={() => createScenario('Aggressive Growth', baseIncome * 1.15, { '80C': 100000, '80D': 15000 })}
                className="p-3 text-left border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="font-medium">Aggressive Growth</div>
                <div className="text-sm text-gray-600">15% income growth, moderate deductions</div>
              </button>
              
              <button
                onClick={() => createScenario('Job Switch', baseIncome * 1.25, { '80C': 80000, '80D': 0 })}
                className="p-3 text-left border border-gray-300 rounded-lg hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="font-medium">Job Switch</div>
                <div className="text-sm text-gray-600">25% income boost, limited deductions</div>
              </button>
            </div>
          </div>
        )}

        {scenarios.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Scenario Comparison</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    scenario.isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-semibold text-gray-900">{scenario.name}</h5>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => toggleScenarioActive(scenario.id)}
                        className={`w-4 h-4 rounded-full border-2 ${
                          scenario.isActive ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}
                      />
                      <button
                        onClick={() => deleteScenario(scenario.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income:</span>
                      <span className="font-medium">{formatCompactCurrency(scenario.income)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Tax:</span>
                      <span className="font-medium text-red-600">{formatCompactCurrency(scenario.totalTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Effective Rate:</span>
                      <span className="font-medium">{scenario.effectiveRate.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deductions:</span>
                      <span className="font-medium text-green-600">
                        {formatCompactCurrency(Object.values(scenario.deductions).reduce((sum, val) => sum + val, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {scenarios.length === 0 && !showScenarioForm && (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scenarios created</h3>
            <p className="mt-1 text-sm text-gray-500">Create scenarios to compare different tax planning strategies.</p>
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
        <h3 className="text-lg font-semibold text-green-900 mb-4">💡 Key Planning Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-green-800">Tax Optimization Tips:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Maximize 80C deductions early in the year</li>
              <li>• Consider NPS for additional 80CCD(1B) benefit</li>
              <li>• Plan HRA vs Home loan interest optimization</li>
              <li>• Review tax regime choice annually</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-green-800">Long-term Strategies:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Build emergency fund before tax-saving investments</li>
              <li>• Balance tax savings with investment returns</li>
              <li>• Consider inflation impact on deduction limits</li>
              <li>• Plan for retirement corpus alongside tax savings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};