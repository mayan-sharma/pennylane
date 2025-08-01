import React, { useState } from 'react';
import type { BudgetScenario, Budget, ScenarioAdjustment } from '../types';

interface BudgetScenarioPlanningProps {
  scenarios: BudgetScenario[];
  budgets: Budget[];
  onCreateScenario: (scenario: Omit<BudgetScenario, 'id' | 'createdAt' | 'lastCalculated'>) => void;
  onUpdateScenario: (id: string, updates: Partial<BudgetScenario>) => void;
  onDeleteScenario: (id: string) => void;
  onCalculateScenario: (id: string) => void;
}

export const BudgetScenarioPlanning: React.FC<BudgetScenarioPlanningProps> = ({
  scenarios,
  budgets,
  onCreateScenario,
  onUpdateScenario,
  onDeleteScenario,
  onCalculateScenario
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'scenarios' | 'comparison' | 'what-if'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingScenario, setEditingScenario] = useState<BudgetScenario | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    adjustments: [] as ScenarioAdjustment[],
    assumptions: ['']
  });

  const [newAdjustment, setNewAdjustment] = useState({
    budgetId: '',
    category: '',
    adjustmentType: 'percentage' as const,
    value: '',
    reason: ''
  });

  const calculateScenarioImpact = (scenario: BudgetScenario) => {
    let totalBudget = 0;
    let adjustedBudget = 0;
    
    budgets.forEach(budget => {
      totalBudget += budget.amount;
      
      const adjustment = scenario.adjustments.find(adj => adj.budgetId === budget.id);
      if (adjustment) {
        if (adjustment.adjustmentType === 'percentage') {
          adjustedBudget += budget.amount * (1 + adjustment.value / 100);
        } else {
          adjustedBudget += budget.amount + adjustment.value;
        }
      } else {
        adjustedBudget += budget.amount;
      }
    });

    return {
      originalTotal: totalBudget,
      adjustedTotal: adjustedBudget,
      difference: adjustedBudget - totalBudget,
      percentageChange: ((adjustedBudget - totalBudget) / totalBudget) * 100
    };
  };

  const getScenarioRiskLevel = (scenario: BudgetScenario): 'low' | 'medium' | 'high' => {
    const impact = calculateScenarioImpact(scenario);
    const changePercent = Math.abs(impact.percentageChange);
    
    if (changePercent > 30) return 'high';
    if (changePercent > 15) return 'medium';
    return 'low';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scenarioData = {
      name: formData.name,
      description: formData.description,
      baselineBudgets: budgets,
      adjustments: formData.adjustments,
      outcomes: {
        totalBudget: 0,
        projectedSpending: 0,
        projectedSavings: 0,
        riskLevel: 'medium' as const,
        recommendations: [],
        monthlyBreakdown: []
      },
      assumptions: formData.assumptions.filter(a => a.trim())
    };

    if (editingScenario) {
      onUpdateScenario(editingScenario.id, scenarioData);
    } else {
      onCreateScenario(scenarioData);
    }

    setShowForm(false);
    setEditingScenario(null);
    resetForm();
  };

  const addAdjustment = () => {
    if (!newAdjustment.budgetId || !newAdjustment.value) return;

    const budget = budgets.find(b => b.id === newAdjustment.budgetId);
    if (!budget) return;

    const adjustment: ScenarioAdjustment = {
      budgetId: newAdjustment.budgetId,
      category: budget.category,
      adjustmentType: newAdjustment.adjustmentType,
      value: parseFloat(newAdjustment.value),
      reason: newAdjustment.reason
    };

    setFormData({
      ...formData,
      adjustments: [...formData.adjustments, adjustment]
    });

    setNewAdjustment({
      budgetId: '',
      category: '',
      adjustmentType: 'percentage',
      value: '',
      reason: ''
    });
  };

  const removeAdjustment = (index: number) => {
    setFormData({
      ...formData,
      adjustments: formData.adjustments.filter((_, i) => i !== index)
    });
  };

  const addAssumption = () => {
    setFormData({
      ...formData,
      assumptions: [...formData.assumptions, '']
    });
  };

  const updateAssumption = (index: number, value: string) => {
    const newAssumptions = [...formData.assumptions];
    newAssumptions[index] = value;
    setFormData({
      ...formData,
      assumptions: newAssumptions
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      adjustments: [],
      assumptions: ['']
    });
    setNewAdjustment({
      budgetId: '',
      category: '',
      adjustmentType: 'percentage',
      value: '',
      reason: ''
    });
  };

  const getQuickScenarios = () => {
    return [
      {
        name: 'Income Reduction (-20%)',
        description: 'What if your income decreased by 20%?',
        adjustments: budgets.map(budget => ({
          budgetId: budget.id,
          category: budget.category,
          adjustmentType: 'percentage' as const,
          value: -20,
          reason: 'Reduced income scenario'
        }))
      },
      {
        name: 'Emergency Expenses',
        description: 'Unexpected major expenses scenario',
        adjustments: [
          {
            budgetId: budgets.find(b => b.category === 'Healthcare')?.id || budgets[0]?.id,
            category: 'Healthcare',
            adjustmentType: 'fixed_amount' as const,
            value: 50000,
            reason: 'Emergency medical expenses'
          },
          {
            budgetId: budgets.find(b => b.category === 'Housing')?.id || budgets[0]?.id,
            category: 'Housing',
            adjustmentType: 'fixed_amount' as const,
            value: 25000,
            reason: 'Emergency home repairs'
          }
        ]
      },
      {
        name: 'Economic Recession',
        description: 'General economic downturn impact',
        adjustments: budgets.map(budget => {
          if (['Food', 'Bills', 'Housing'].includes(budget.category)) {
            return {
              budgetId: budget.id,
              category: budget.category,
              adjustmentType: 'percentage' as const,
              value: 10,
              reason: 'Increased costs due to inflation'
            };
          } else {
            return {
              budgetId: budget.id,
              category: budget.category,
              adjustmentType: 'percentage' as const,
              value: -30,
              reason: 'Reduced discretionary spending'
            };
          }
        })
      }
    ];
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Budget Scenario Planning</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Scenario
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'scenarios', 'comparison', 'what-if'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md flex-1 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'what-if' ? 'What-If' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Total Scenarios</h3>
              <p className="text-2xl font-bold text-blue-900">{scenarios.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Low Risk</h3>
              <p className="text-2xl font-bold text-green-900">
                {scenarios.filter(s => getScenarioRiskLevel(s) === 'low').length}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800">Medium Risk</h3>
              <p className="text-2xl font-bold text-yellow-900">
                {scenarios.filter(s => getScenarioRiskLevel(s) === 'medium').length}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-sm font-medium text-red-800">High Risk</h3>
              <p className="text-2xl font-bold text-red-900">
                {scenarios.filter(s => getScenarioRiskLevel(s) === 'high').length}
              </p>
            </div>
          </div>

          {/* Current Budget Overview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Current Budget Baseline</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Budget</p>
                <p className="text-xl font-bold">₹{budgets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-xl font-bold">{new Set(budgets.map(b => b.category)).size}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average per Category</p>
                <p className="text-xl font-bold">₹{Math.round(budgets.reduce((sum, b) => sum + b.amount, 0) / budgets.length).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Largest Budget</p>
                <p className="text-xl font-bold">₹{Math.max(...budgets.map(b => b.amount)).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Recent Scenarios */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Scenarios</h3>
            <div className="space-y-3">
              {scenarios.slice(0, 3).map((scenario) => {
                const impact = calculateScenarioImpact(scenario);
                const risk = getScenarioRiskLevel(scenario);
                
                return (
                  <div key={scenario.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-800">{scenario.name}</h4>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(risk)}`}>
                          {risk} risk
                        </span>
                        <button
                          onClick={() => onCalculateScenario(scenario.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Recalculate
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Budget Impact:</span>
                        <p className={`font-medium ${impact.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {impact.difference >= 0 ? '+' : ''}₹{impact.difference.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Percentage Change:</span>
                        <p className={`font-medium ${impact.percentageChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {impact.percentageChange >= 0 ? '+' : ''}{impact.percentageChange.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Adjustments:</span>
                        <p className="font-medium">{scenario.adjustments.length}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {scenarios.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">📊</div>
                  <p className="text-lg font-medium">No scenarios created yet</p>
                  <p className="text-sm">Create scenarios to plan for different financial situations</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scenarios Tab */}
      {activeTab === 'scenarios' && (
        <div className="space-y-4">
          {scenarios.map((scenario) => {
            const impact = calculateScenarioImpact(scenario);
            const risk = getScenarioRiskLevel(scenario);
            
            return (
              <div key={scenario.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{scenario.name}</h3>
                    <p className="text-gray-600 mt-1">{scenario.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {new Date(scenario.lastCalculated).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRiskColor(risk)}`}>
                      {risk} risk
                    </span>
                    <button
                      onClick={() => {
                        setEditingScenario(scenario);
                        setFormData({
                          name: scenario.name,
                          description: scenario.description,
                          adjustments: scenario.adjustments,
                          assumptions: scenario.assumptions
                        });
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteScenario(scenario.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Impact Summary */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-3">Financial Impact</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Original Total</p>
                      <p className="font-bold">₹{impact.originalTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Adjusted Total</p>
                      <p className="font-bold">₹{impact.adjustedTotal.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Difference</p>
                      <p className={`font-bold ${impact.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {impact.difference >= 0 ? '+' : ''}₹{impact.difference.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Change</p>
                      <p className={`font-bold ${impact.percentageChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {impact.percentageChange >= 0 ? '+' : ''}{impact.percentageChange.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Adjustments */}
                <div className="mb-4">
                  <h4 className="font-medium mb-3">Budget Adjustments</h4>
                  <div className="space-y-2">
                    {scenario.adjustments.map((adjustment, index) => {
                      const budget = budgets.find(b => b.id === adjustment.budgetId);
                      return (
                        <div key={index} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                          <div>
                            <span className="font-medium capitalize">{adjustment.category}</span>
                            <p className="text-sm text-gray-600">{adjustment.reason}</p>
                          </div>
                          <div className="text-right">
                            <span className={`font-medium ${adjustment.value >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {adjustment.adjustmentType === 'percentage' 
                                ? `${adjustment.value >= 0 ? '+' : ''}${adjustment.value}%`
                                : `${adjustment.value >= 0 ? '+' : ''}₹${adjustment.value.toLocaleString()}`
                              }
                            </span>
                            {budget && (
                              <p className="text-sm text-gray-500">
                                ₹{budget.amount.toLocaleString()} → ₹{
                                  adjustment.adjustmentType === 'percentage'
                                    ? (budget.amount * (1 + adjustment.value / 100)).toLocaleString()
                                    : (budget.amount + adjustment.value).toLocaleString()
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Assumptions */}
                {scenario.assumptions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Assumptions</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {scenario.assumptions.map((assumption, index) => (
                        <li key={index}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Comparison Tab */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Scenarios to Compare</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scenarios.map(scenario => (
                <label key={scenario.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedScenarios.includes(scenario.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedScenarios([...selectedScenarios, scenario.id]);
                      } else {
                        setSelectedScenarios(selectedScenarios.filter(id => id !== scenario.id));
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium">{scenario.name}</span>
                </label>
              ))}
            </div>
          </div>

          {selectedScenarios.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Scenario Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Metric</th>
                      <th className="text-left p-2">Baseline</th>
                      {selectedScenarios.map(id => {
                        const scenario = scenarios.find(s => s.id === id);
                        return (
                          <th key={id} className="text-left p-2">{scenario?.name}</th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Total Budget</td>
                      <td className="p-2">₹{budgets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</td>
                      {selectedScenarios.map(id => {
                        const scenario = scenarios.find(s => s.id === id);
                        const impact = scenario ? calculateScenarioImpact(scenario) : null;
                        return (
                          <td key={id} className="p-2">
                            ₹{impact?.adjustedTotal.toLocaleString() || 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Budget Change</td>
                      <td className="p-2">-</td>
                      {selectedScenarios.map(id => {
                        const scenario = scenarios.find(s => s.id === id);
                        const impact = scenario ? calculateScenarioImpact(scenario) : null;
                        return (
                          <td key={id} className={`p-2 ${impact && impact.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {impact ? `${impact.difference >= 0 ? '+' : ''}₹${impact.difference.toLocaleString()}` : 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Percentage Change</td>
                      <td className="p-2">-</td>
                      {selectedScenarios.map(id => {
                        const scenario = scenarios.find(s => s.id === id);
                        const impact = scenario ? calculateScenarioImpact(scenario) : null;
                        return (
                          <td key={id} className={`p-2 ${impact && impact.percentageChange >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {impact ? `${impact.percentageChange >= 0 ? '+' : ''}${impact.percentageChange.toFixed(1)}%` : 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">Risk Level</td>
                      <td className="p-2">Low</td>
                      {selectedScenarios.map(id => {
                        const scenario = scenarios.find(s => s.id === id);
                        const risk = scenario ? getScenarioRiskLevel(scenario) : 'unknown';
                        return (
                          <td key={id} className="p-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(risk)}`}>
                              {risk}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* What-If Tab */}
      {activeTab === 'what-if' && (
        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold mb-4 text-purple-800">Quick Scenario Templates</h3>
            <p className="text-sm text-purple-700 mb-4">
              Use these pre-built scenarios to quickly analyze common financial situations.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getQuickScenarios().map((template, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="text-xs text-gray-500 mb-3">
                    Affects {template.adjustments.length} budget{template.adjustments.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={() => {
                      setFormData({
                        name: template.name,
                        description: template.description,
                        adjustments: template.adjustments.filter(adj => adj.budgetId),
                        assumptions: [`Based on ${template.name.toLowerCase()} scenario analysis`]
                      });
                      setShowForm(true);
                    }}
                    className="w-full bg-purple-600 text-white py-2 px-3 rounded text-sm hover:bg-purple-700"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">What-If Calculator</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What if all budgets increased by:
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="10"
                      className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-600 self-center">%</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      Calculate
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What if a specific category changed by:
                  </label>
                  <div className="flex space-x-2">
                    <select className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm">
                      <option>Select category</option>
                      {budgets.map(budget => (
                        <option key={budget.id} value={budget.id}>{budget.category}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="20"
                      className="w-20 border border-gray-300 rounded px-3 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-600 self-center">%</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    What if you had an emergency expense of:
                  </label>
                  <div className="flex space-x-2">
                    <span className="text-sm text-gray-600 self-center">₹</span>
                    <input
                      type="number"
                      placeholder="50000"
                      className="flex-1 border border-gray-300 rounded px-3 py-1 text-sm"
                    />
                    <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                      Analyze
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Scenario Ideas</h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-blue-50 rounded">
                  <strong>Job Loss Recovery:</strong> Plan for 3-6 months of reduced income
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <strong>Salary Increase:</strong> Model a 15-25% income boost impact
                </div>
                <div className="p-2 bg-yellow-50 rounded">
                  <strong>Major Purchase:</strong> Plan for car, home, or education expenses
                </div>
                <div className="p-2 bg-purple-50 rounded">
                  <strong>Lifestyle Change:</strong> Moving to a new city or changing jobs
                </div>
                <div className="p-2 bg-red-50 rounded">
                  <strong>Market Crash:</strong> Economic downturn affecting all expenses
                </div>
                <div className="p-2 bg-indigo-50 rounded">
                  <strong>Retirement Planning:</strong> Reduced income with specific needs
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Scenario Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingScenario ? 'Edit Scenario' : 'Create New Scenario'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="e.g., Income Reduction Scenario"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of this scenario"
                  />
                </div>
              </div>

              {/* Budget Adjustments */}
              <div>
                <h4 className="font-medium mb-3">Budget Adjustments</h4>
                
                {/* Add new adjustment */}
                <div className="border rounded-lg p-4 mb-4 bg-gray-50">
                  <h5 className="font-medium mb-3">Add Adjustment</h5>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <select
                      value={newAdjustment.budgetId}
                      onChange={(e) => {
                        const budget = budgets.find(b => b.id === e.target.value);
                        setNewAdjustment({
                          ...newAdjustment,
                          budgetId: e.target.value,
                          category: budget?.category || ''
                        });
                      }}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select budget</option>
                      {budgets.map(budget => (
                        <option key={budget.id} value={budget.id}>
                          {budget.category} (₹{budget.amount.toLocaleString()})
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={newAdjustment.adjustmentType}
                      onChange={(e) => setNewAdjustment({...newAdjustment, adjustmentType: e.target.value as any})}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed_amount">Fixed Amount</option>
                    </select>
                    
                    <input
                      type="number"
                      value={newAdjustment.value}
                      onChange={(e) => setNewAdjustment({...newAdjustment, value: e.target.value})}
                      placeholder={newAdjustment.adjustmentType === 'percentage' ? '±%' : '±₹'}
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    
                    <input
                      type="text"
                      value={newAdjustment.reason}
                      onChange={(e) => setNewAdjustment({...newAdjustment, reason: e.target.value})}
                      placeholder="Reason"
                      className="border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    
                    <button
                      type="button"
                      onClick={addAdjustment}
                      className="bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Current adjustments */}
                {formData.adjustments.length > 0 && (
                  <div className="space-y-2">
                    {formData.adjustments.map((adjustment, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <span className="font-medium capitalize">{adjustment.category}</span>
                          <span className="ml-2 text-sm text-gray-600">
                            {adjustment.adjustmentType === 'percentage' 
                              ? `${adjustment.value >= 0 ? '+' : ''}${adjustment.value}%`
                              : `${adjustment.value >= 0 ? '+' : ''}₹${adjustment.value.toLocaleString()}`
                            }
                          </span>
                          {adjustment.reason && (
                            <p className="text-sm text-gray-500">{adjustment.reason}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAdjustment(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assumptions */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Assumptions</h4>
                  <button
                    type="button"
                    onClick={addAssumption}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    + Add Assumption
                  </button>
                </div>
                
                <div className="space-y-2">
                  {formData.assumptions.map((assumption, index) => (
                    <input
                      key={index}
                      type="text"
                      value={assumption}
                      onChange={(e) => updateAssumption(index, e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter an assumption for this scenario..."
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingScenario ? 'Update Scenario' : 'Create Scenario'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingScenario(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};