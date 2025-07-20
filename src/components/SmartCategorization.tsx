import React, { useState, useEffect } from 'react';
import { 
  categorizationService, 
  type CategoryPrediction, 
  type CategorizationRule,
  type LearningPattern,
  type ModelMetrics,
  type UserCorrection 
} from '../services/categorizationService';
import { ExpenseCategory, type Expense } from '../types/expense';

interface SmartCategorizationProps {
  expenses: Expense[];
  onRetrain?: () => void;
}

export const SmartCategorization: React.FC<SmartCategorizationProps> = ({
  expenses,
  onRetrain
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'patterns' | 'corrections'>('overview');
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [corrections, setCorrections] = useState<UserCorrection[]>([]);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [newRule, setNewRule] = useState({
    type: 'merchant' as 'merchant' | 'description' | 'amount',
    field: 'merchant',
    operator: 'contains' as 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'range',
    value: '',
    category: ExpenseCategory.OTHER,
    confidence: 0.8,
    priority: 5,
  });
  const [testExpense, setTestExpense] = useState({
    merchant: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
  });
  const [testResult, setTestResult] = useState<CategoryPrediction | null>(null);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMetrics(categorizationService.getMetrics());
    setRules(categorizationService.getRules());
    setPatterns(categorizationService.getPatterns());
    setCorrections(categorizationService.getCorrections());
  };

  const handleCreateRule = () => {
    try {
      const ruleData = {
        type: newRule.type,
        condition: {
          field: newRule.field,
          operator: newRule.operator,
          value: newRule.operator === 'range' ? 
                 { min: 0, max: parseFloat(newRule.value) } : 
                 newRule.value,
        },
        action: {
          category: newRule.category,
          confidence: newRule.confidence,
        },
        priority: newRule.priority,
        isUserCreated: true,
        isActive: true,
      };

      categorizationService.createRule(ruleData);
      setShowCreateRule(false);
      loadData();
      
      // Reset form
      setNewRule({
        type: 'merchant',
        field: 'merchant',
        operator: 'contains',
        value: '',
        category: ExpenseCategory.OTHER,
        confidence: 0.8,
        priority: 5,
      });
    } catch (error) {
      alert('Failed to create rule');
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      categorizationService.deleteRule(ruleId);
      loadData();
    }
  };

  const handleToggleRule = (ruleId: string, isActive: boolean) => {
    categorizationService.updateRule(ruleId, { isActive });
    loadData();
  };

  const handleTestCategorization = async () => {
    try {
      const prediction = await categorizationService.categorizeExpense(testExpense);
      setTestResult(prediction);
    } catch (error) {
      alert('Failed to test categorization');
    }
  };

  const handleRetrain = async () => {
    setIsTraining(true);
    try {
      await categorizationService.learnFromExpenses(expenses);
      loadData();
      onRetrain?.();
      alert('Model retrained successfully!');
    } catch (error) {
      alert('Failed to retrain model');
    } finally {
      setIsTraining(false);
    }
  };

  const handleClearLearningData = () => {
    if (confirm('This will clear all learned patterns and corrections. Are you sure?')) {
      categorizationService.clearLearningData();
      loadData();
    }
  };

  const handleExportData = () => {
    const data = categorizationService.exportLearningData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `categorization-model-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getCategoryColor = (category: ExpenseCategory) => {
    const colors: Record<ExpenseCategory, string> = {
      [ExpenseCategory.FOOD]: 'bg-orange-100 text-orange-800',
      [ExpenseCategory.TRANSPORT]: 'bg-blue-100 text-blue-800',
      [ExpenseCategory.SHOPPING]: 'bg-purple-100 text-purple-800',
      [ExpenseCategory.ENTERTAINMENT]: 'bg-pink-100 text-pink-800',
      [ExpenseCategory.HEALTHCARE]: 'bg-red-100 text-red-800',
      [ExpenseCategory.EDUCATION]: 'bg-green-100 text-green-800',
      [ExpenseCategory.TRAVEL]: 'bg-indigo-100 text-indigo-800',
      [ExpenseCategory.HOUSING]: 'bg-yellow-100 text-yellow-800',
      [ExpenseCategory.BILLS]: 'bg-gray-100 text-gray-800',
      [ExpenseCategory.OTHER]: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Smart Categorization</h2>
            <p className="text-gray-600">
              AI-powered expense categorization that learns from your patterns and corrections
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleRetrain}
              disabled={isTraining}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isTraining ? 'Training...' : 'Retrain Model'}
            </button>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export Data
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatPercentage(metrics.accuracy)}</div>
              <div className="text-sm text-blue-800">Overall Accuracy</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{metrics.totalPredictions}</div>
              <div className="text-sm text-green-800">Total Predictions</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{rules.length}</div>
              <div className="text-sm text-purple-800">Active Rules</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{patterns.length}</div>
              <div className="text-sm text-orange-800">Learned Patterns</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'rules', label: 'Rules' },
              { id: 'patterns', label: 'Patterns' },
              { id: 'corrections', label: 'Corrections' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
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

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Model Performance */}
              {metrics && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Model Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Accuracy */}
                    <div>
                      <h4 className="font-medium mb-3">Accuracy by Category</h4>
                      <div className="space-y-2">
                        {Object.entries(metrics.categoryAccuracy).map(([category, data]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(category as ExpenseCategory)}`}>
                              {category}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${data.accuracy * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600 w-12">
                                {formatPercentage(data.accuracy)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h4 className="font-medium mb-3">Recent Activity</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Last Training:</span>
                          <span className="text-gray-600">
                            {new Date(metrics.lastTraining).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Model Version:</span>
                          <span className="text-gray-600">{metrics.modelVersion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recent Corrections:</span>
                          <span className="text-gray-600">{corrections.slice(-10).length}/10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test Categorization */}
              <div>
                <h3 className="text-lg font-medium mb-4">Test Categorization</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Merchant
                      </label>
                      <input
                        type="text"
                        value={testExpense.merchant}
                        onChange={(e) => setTestExpense(prev => ({ ...prev, merchant: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Starbucks"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={testExpense.amount}
                        onChange={(e) => setTestExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={testExpense.description}
                        onChange={(e) => setTestExpense(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Coffee and pastry"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      onClick={handleTestCategorization}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Test Categorization
                    </button>
                    
                    {testResult && (
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(testResult.category)}`}>
                          {testResult.category}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatPercentage(testResult.confidence)} confidence
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {testResult && testResult.reasoning.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <h5 className="text-sm font-medium text-blue-800 mb-1">Reasoning:</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {testResult.reasoning.map((reason, index) => (
                          <li key={index}>• {reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Categorization Rules</h3>
                <button
                  onClick={() => setShowCreateRule(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Rule
                </button>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(rule.action.category)}`}>
                            {rule.action.category}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatPercentage(rule.action.confidence)} confidence
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatPercentage(rule.accuracy)} accuracy
                          </span>
                          {rule.isUserCreated && (
                            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                              Custom
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800">
                          {rule.condition.field} {rule.condition.operator} "{String(rule.condition.value)}"
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Used {rule.usageCount} times • Priority {rule.priority}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={rule.isActive}
                            onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-600">Active</span>
                        </label>
                        {rule.isUserCreated && (
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create Rule Modal */}
              {showCreateRule && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
                    <div className="p-6">
                      <h3 className="text-lg font-medium mb-4">Create Categorization Rule</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rule Type
                          </label>
                          <select
                            value={newRule.type}
                            onChange={(e) => setNewRule(prev => ({ 
                              ...prev, 
                              type: e.target.value as any,
                              field: e.target.value === 'amount' ? 'amount' : e.target.value
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="merchant">Merchant</option>
                            <option value="description">Description</option>
                            <option value="amount">Amount</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Condition
                          </label>
                          <select
                            value={newRule.operator}
                            onChange={(e) => setNewRule(prev => ({ ...prev, operator: e.target.value as any }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {newRule.type === 'amount' ? (
                              <option value="range">Less than or equal to</option>
                            ) : (
                              <>
                                <option value="contains">Contains</option>
                                <option value="equals">Equals</option>
                                <option value="startsWith">Starts with</option>
                                <option value="endsWith">Ends with</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Value
                          </label>
                          <input
                            type={newRule.type === 'amount' ? 'number' : 'text'}
                            value={newRule.value}
                            onChange={(e) => setNewRule(prev => ({ ...prev, value: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={newRule.type === 'amount' ? '100' : 'Enter value...'}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category
                          </label>
                          <select
                            value={newRule.category}
                            onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value as ExpenseCategory }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.values(ExpenseCategory).map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Confidence
                          </label>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={newRule.confidence}
                            onChange={(e) => setNewRule(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="text-sm text-gray-600 text-center">
                            {formatPercentage(newRule.confidence)}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 mt-6">
                        <button
                          onClick={handleCreateRule}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                        >
                          Create Rule
                        </button>
                        <button
                          onClick={() => setShowCreateRule(false)}
                          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === 'patterns' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Learned Patterns</h3>
              
              <div className="grid grid-cols-1 gap-4">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(pattern.category)}`}>
                        {pattern.category}
                      </span>
                      <div className="text-sm text-gray-600">
                        {formatPercentage(pattern.confidence)} confidence
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-800 mb-2">
                      <strong>{pattern.type.replace('_', ' ')}:</strong> {pattern.examples[0]}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      {pattern.occurrences} occurrences • {formatPercentage(pattern.accuracy)} accuracy • 
                      Last seen: {new Date(pattern.lastSeen).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corrections Tab */}
          {activeTab === 'corrections' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Recent Corrections</h3>
                <button
                  onClick={handleClearLearningData}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Clear All Data
                </button>
              </div>
              
              <div className="space-y-3">
                {corrections.slice(-20).reverse().map((correction) => (
                  <div key={correction.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(correction.originalCategory)}`}>
                          {correction.originalCategory}
                        </span>
                        <span className="text-sm text-gray-400">→</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(correction.correctedCategory)}`}>
                          {correction.correctedCategory}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(correction.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-800">
                      <strong>{correction.expenseData.merchant || 'Unknown Merchant'}</strong> - 
                      ${correction.expenseData.amount.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {correction.expenseData.description}
                    </div>
                    
                    {correction.reason && (
                      <div className="text-sm text-blue-600 mt-1">
                        Reason: {correction.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};