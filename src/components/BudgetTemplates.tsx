import React, { useState } from 'react';
import type { BudgetTemplate, Budget } from '../types';
import { ExpenseCategory } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BudgetTemplatesProps {
  templates: BudgetTemplate[];
  onApplyTemplate: (templateId: string) => void;
  onCreateTemplate: (template: Omit<BudgetTemplate, 'id'>) => void;
}

export const BudgetTemplates: React.FC<BudgetTemplatesProps> = ({
  templates,
  onApplyTemplate,
  onCreateTemplate
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Omit<BudgetTemplate, 'id'>>({
    name: '',
    description: '',
    category: 'custom',
    budgets: []
  });
  const [newBudget, setNewBudget] = useState<Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>>({
    category: 'Food',
    amount: 0,
    period: 'monthly',
    type: 'standard',
    alertThresholds: [75, 90, 100],
    rolloverEnabled: false
  });


  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      student: '🎓',
      family: '👨‍👩‍👧‍👦',
      professional: '💼',
      custom: '⚙️'
    };
    return icons[category] || '📊';
  };

  const handleAddBudgetToTemplate = () => {
    if (newBudget.amount > 0) {
      setNewTemplate(prev => ({
        ...prev,
        budgets: [...prev.budgets, { ...newBudget }]
      }));
      setNewBudget({
        category: 'Food',
        amount: 0,
        period: 'monthly',
        type: 'standard',
        alertThresholds: [75, 90, 100],
        rolloverEnabled: false
      });
    }
  };

  const handleRemoveBudgetFromTemplate = (index: number) => {
    setNewTemplate(prev => ({
      ...prev,
      budgets: prev.budgets.filter((_, i) => i !== index)
    }));
  };

  const handleCreateTemplate = () => {
    if (newTemplate.name && newTemplate.budgets.length > 0) {
      onCreateTemplate(newTemplate);
      setNewTemplate({
        name: '',
        description: '',
        category: 'custom',
        budgets: []
      });
      setShowCreateForm(false);
    }
  };

  const getTotalBudgetAmount = (template: BudgetTemplate | Omit<BudgetTemplate, 'id'>) => {
    return template.budgets.reduce((sum, budget) => sum + budget.amount, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Budget Templates</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + Create Template
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create Budget Template</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., My Custom Budget"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe your budget template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="custom">Custom</option>
                  <option value="student">Student</option>
                  <option value="family">Family</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4 mb-4">
              <h4 className="font-semibold mb-3">Add Budgets to Template</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <select
                  value={newBudget.category}
                  onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="total">Total (All Categories)</option>
                  {Object.values(ExpenseCategory).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                <input
                  type="number"
                  value={newBudget.amount || ''}
                  onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Amount (₹)"
                />
                
                <select
                  value={newBudget.period}
                  onChange={(e) => setNewBudget({ ...newBudget, period: e.target.value as any })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              
              <div className="flex gap-3 mb-3">
                <select
                  value={newBudget.type}
                  onChange={(e) => setNewBudget({ ...newBudget, type: e.target.value as any })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="savings">Savings Goal</option>
                  <option value="envelope">Envelope</option>
                  <option value="auto-adjusting">Auto-Adjusting</option>
                </select>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newBudget.rolloverEnabled}
                    onChange={(e) => setNewBudget({ ...newBudget, rolloverEnabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Rollover</span>
                </label>
                
                <button
                  onClick={handleAddBudgetToTemplate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            </div>

            {newTemplate.budgets.length > 0 && (
              <div className="border-t pt-4 mb-4">
                <h4 className="font-semibold mb-3">Template Budgets</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {newTemplate.budgets.map((budget, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">
                        {budget.category === 'total' ? 'Total' : budget.category} - {formatCurrency(budget.amount)} ({budget.period})
                        {budget.type !== 'standard' && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {budget.type}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => handleRemoveBudgetFromTemplate(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-700">
                  Total Budget: {formatCurrency(getTotalBudgetAmount(newTemplate))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleCreateTemplate}
                disabled={!newTemplate.name || newTemplate.budgets.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Template
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewTemplate({ name: '', description: '', category: 'custom', budgets: [] });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getCategoryIcon(template.category)}</span>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">{template.description}</p>

            <div className="space-y-2 mb-4">
              <h4 className="font-medium text-sm text-gray-700">Included Budgets:</h4>
              {template.budgets.slice(0, 3).map((budget, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {budget.category === 'total' ? 'Total' : budget.category}
                  </span>
                  <span className="font-medium">{formatCurrency(budget.amount)}</span>
                </div>
              ))}
              {template.budgets.length > 3 && (
                <div className="text-sm text-gray-500">
                  +{template.budgets.length - 3} more budgets
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">Total Budget:</span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(getTotalBudgetAmount(template))}
                </span>
              </div>
              
              <button
                onClick={() => onApplyTemplate(template.id)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply Template
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Templates</h3>
          <p className="text-gray-600 mb-4">Create your first budget template to get started</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Template
          </button>
        </div>
      )}
    </div>
  );
};