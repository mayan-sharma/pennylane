import React, { useState, useMemo } from 'react';
import { calculateIncomeTax, compareTaxRegimes } from '../utils/taxCalculation';

interface Scenario {
  id: string;
  name: string;
  income: number;
  deductions: {
    section80C: number;
    section80D: number;
    section80CCD: number;
    homeLoanInterest: number;
    otherDeductions: number;
  };
  description: string;
  isCustom: boolean;
}

interface ScenarioPlannerProps {
  currentIncome?: number;
  currentDeductions?: number;
}

export const ScenarioPlanner: React.FC<ScenarioPlannerProps> = ({ 
  currentIncome = 1200000, 
  currentDeductions = 50000 
}) => {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['current', 'optimized']);
  const [customScenario, setCustomScenario] = useState<Scenario>({
    id: 'custom',
    name: 'Custom Scenario',
    income: currentIncome,
    deductions: {
      section80C: 0,
      section80D: 0,
      section80CCD: 0,
      homeLoanInterest: 0,
      otherDeductions: 0
    },
    description: 'Your custom tax scenario',
    isCustom: true
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const predefinedScenarios: Scenario[] = useMemo(() => [
    {
      id: 'current',
      name: 'Current Situation',
      income: currentIncome,
      deductions: {
        section80C: Math.min(currentDeductions, 150000),
        section80D: 0,
        section80CCD: 0,
        homeLoanInterest: 0,
        otherDeductions: Math.max(0, currentDeductions - 150000)
      },
      description: 'Your current tax situation',
      isCustom: false
    },
    {
      id: 'optimized',
      name: 'Fully Optimized',
      income: currentIncome,
      deductions: {
        section80C: 150000,
        section80D: 25000,
        section80CCD: 50000,
        homeLoanInterest: 200000,
        otherDeductions: 50000
      },
      description: 'Maximum possible tax savings scenario',
      isCustom: false
    },
    {
      id: 'conservative',
      name: 'Conservative Approach',
      income: currentIncome,
      deductions: {
        section80C: 100000,
        section80D: 15000,
        section80CCD: 0,
        homeLoanInterest: 0,
        otherDeductions: 25000
      },
      description: 'Moderate tax planning with lower risk investments',
      isCustom: false
    },
    {
      id: 'aggressive',
      name: 'Aggressive Savings',
      income: currentIncome,
      deductions: {
        section80C: 150000,
        section80D: 25000,
        section80CCD: 50000,
        homeLoanInterest: 350000,
        otherDeductions: 75000
      },
      description: 'Maximum deductions with higher investment amounts',
      isCustom: false
    },
    {
      id: 'salary_hike',
      name: '20% Salary Increase',
      income: currentIncome * 1.2,
      deductions: {
        section80C: 150000,
        section80D: 25000,
        section80CCD: 50000,
        homeLoanInterest: 200000,
        otherDeductions: 50000
      },
      description: 'Planning for a potential salary increase',
      isCustom: false
    }
  ], [currentIncome, currentDeductions]);

  const allScenarios = [...predefinedScenarios, customScenario];

  const calculateScenarioResults = (scenario: Scenario) => {
    const totalDeductions = Object.values(scenario.deductions).reduce((sum, val) => sum + val, 0);
    const oldRegimeTax = calculateIncomeTax(scenario.income, totalDeductions);
    const regimeComparison = compareTaxRegimes(scenario.income, totalDeductions);
    
    return {
      totalDeductions,
      oldRegimeTax,
      newRegimeTax: regimeComparison.newRegime,
      bestRegime: regimeComparison.recommendation,
      savings: regimeComparison.savings,
      takeHome: scenario.income - oldRegimeTax.totalTax,
      savingsRate: ((scenario.income - oldRegimeTax.totalTax - scenario.income * 0.7) / scenario.income) * 100
    };
  };

  const getSelectedScenarioResults = () => {
    return selectedScenarios.map(id => {
      const scenario = allScenarios.find(s => s.id === id);
      if (!scenario) return null;
      
      return {
        scenario,
        results: calculateScenarioResults(scenario)
      };
    }).filter(Boolean);
  };

  const scenarioResults = getSelectedScenarioResults();

  const updateCustomScenario = (field: string, value: number) => {
    if (field === 'income') {
      setCustomScenario(prev => ({ ...prev, income: value }));
    } else {
      setCustomScenario(prev => ({
        ...prev,
        deductions: { ...prev.deductions, [field]: value }
      }));
    }
  };

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        return prev.filter(id => id !== scenarioId);
      } else if (prev.length < 3) {
        return [...prev, scenarioId];
      }
      return prev;
    });
  };

  const getComparisonWinner = (metric: string) => {
    if (scenarioResults.length < 2) return null;
    
    const values = scenarioResults.map((result, index) => {
      const value = metric === 'tax' ? result!.results.oldRegimeTax.totalTax :
                   metric === 'takeHome' ? result!.results.takeHome :
                   metric === 'savings' ? result!.results.savings : 0;
      return { index, value };
    });
    
    const best = metric === 'tax' ? 
      values.reduce((min, curr) => curr.value < min.value ? curr : min) :
      values.reduce((max, curr) => curr.value > max.value ? curr : max);
    
    return best.index;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Scenario Planner</h3>
        <div className="text-sm text-gray-500">
          Compare up to 3 scenarios
        </div>
      </div>

      {/* Scenario Selection */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="font-medium mb-4">Select Scenarios to Compare</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allScenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedScenarios.includes(scenario.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${selectedScenarios.length >= 3 && !selectedScenarios.includes(scenario.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => toggleScenario(scenario.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-gray-900">{scenario.name}</h5>
                <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                  selectedScenarios.includes(scenario.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedScenarios.includes(scenario.id) && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
              <div className="text-xs text-gray-500">
                Income: {formatCurrency(scenario.income)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Scenario Editor */}
      {selectedScenarios.includes('custom') && (
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-medium mb-4">Customize Your Scenario</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
              <input
                type="number"
                value={customScenario.income}
                onChange={(e) => updateCustomScenario('income', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section 80C</label>
              <input
                type="number"
                value={customScenario.deductions.section80C}
                onChange={(e) => updateCustomScenario('section80C', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                max={150000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section 80D</label>
              <input
                type="number"
                value={customScenario.deductions.section80D}
                onChange={(e) => updateCustomScenario('section80D', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                max={25000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section 80CCD(1B)</label>
              <input
                type="number"
                value={customScenario.deductions.section80CCD}
                onChange={(e) => updateCustomScenario('section80CCD', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                max={50000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Home Loan Interest</label>
              <input
                type="number"
                value={customScenario.deductions.homeLoanInterest}
                onChange={(e) => updateCustomScenario('homeLoanInterest', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other Deductions</label>
              <input
                type="number"
                value={customScenario.deductions.otherDeductions}
                onChange={(e) => updateCustomScenario('otherDeductions', Number(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Comparison Results */}
      {scenarioResults.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="font-medium mb-4">Scenario Comparison</h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-900">Metric</th>
                  {scenarioResults.map((result, index) => (
                    <th key={index} className="text-left py-3 px-2 font-medium text-gray-900">
                      {result!.scenario.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3 px-2 font-medium text-gray-700">Annual Income</td>
                  {scenarioResults.map((result, index) => (
                    <td key={index} className="py-3 px-2">{formatCurrency(result!.scenario.income)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium text-gray-700">Total Deductions</td>
                  {scenarioResults.map((result, index) => (
                    <td key={index} className="py-3 px-2">{formatCurrency(result!.results.totalDeductions)}</td>
                  ))}
                </tr>
                <tr className="bg-red-50">
                  <td className="py-3 px-2 font-medium text-gray-700">Tax Liability</td>
                  {scenarioResults.map((result, index) => (
                    <td key={index} className={`py-3 px-2 ${getComparisonWinner('tax') === index ? 'font-bold text-green-600' : ''}`}>
                      {formatCurrency(result!.results.oldRegimeTax.totalTax)}
                    </td>
                  ))}
                </tr>
                <tr className="bg-green-50">
                  <td className="py-3 px-2 font-medium text-gray-700">Take-Home Income</td>
                  {scenarioResults.map((result, index) => (
                    <td key={index} className={`py-3 px-2 ${getComparisonWinner('takeHome') === index ? 'font-bold text-green-600' : ''}`}>
                      {formatCurrency(result!.results.takeHome)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium text-gray-700">Effective Tax Rate</td>
                  {scenarioResults.map((result, index) => (
                    <td key={index} className="py-3 px-2">{result!.results.oldRegimeTax.effectiveRate.toFixed(2)}%</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-2 font-medium text-gray-700">Best Regime</td>
                  {scenarioResults.map((result, index) => (
                    <td key={index} className="py-3 px-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result!.results.bestRegime === 'NEW' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {result!.results.bestRegime === 'NEW' ? 'New Regime' : 'Old Regime'}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Key Insights */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Key Insights</h5>
            <div className="text-sm text-blue-800 space-y-1">
              {scenarioResults.length >= 2 && (
                <>
                  <div>
                    • Best tax efficiency: {scenarioResults[getComparisonWinner('tax') || 0]!.scenario.name}
                  </div>
                  <div>
                    • Highest take-home: {scenarioResults[getComparisonWinner('takeHome') || 0]!.scenario.name}
                  </div>
                  {scenarioResults.length > 1 && (
                    <div>
                      • Potential savings: {formatCurrency(Math.abs(scenarioResults[0]!.results.oldRegimeTax.totalTax - scenarioResults[1]!.results.oldRegimeTax.totalTax))} per year
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};