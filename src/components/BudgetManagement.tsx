import React, { useState } from 'react';
import { ExpenseCategory, type Budget, type BudgetFormData, type BudgetStatus, type BudgetTemplate, type CustomCategory } from '../types/expense';
import { BudgetAnalytics } from './BudgetAnalytics';
import { BudgetTemplates } from './BudgetTemplates';
import { BudgetCalendar } from './BudgetCalendar';
import { DebtPayoffTracker } from './DebtPayoffTracker';
import { InvestmentGoals } from './InvestmentGoals';
import { AchievementSystem } from './AchievementSystem';
import { FamilyBudgetSharing } from './FamilyBudgetSharing';
import { AccountabilityPartners } from './AccountabilityPartners';
import { SmartSuggestions } from './SmartSuggestions';
import { SeasonalBudgets } from './SeasonalBudgets';
import { BudgetScenarioPlanning } from './BudgetScenarioPlanning';
import { BudgetChallenges } from './BudgetChallenges';
import type { BudgetAnalytics as BudgetAnalyticsType, Expense, DebtPayoffGoal, InvestmentGoal, Achievement, UserProgress, FamilyBudget, AccountabilityPartner, SmartSuggestion, SeasonalAdjustment, BudgetScenario, BudgetChallenge, PartnerCheckIn } from '../types/expense';

interface BudgetManagementProps {
  budgetStatuses: BudgetStatus[];
  budgetTemplates: BudgetTemplate[];
  customCategories: CustomCategory[];
  analytics: BudgetAnalyticsType;
  expenses: Expense[];
  onAddBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateBudget: (id: string, updates: Partial<Budget>) => void;
  onDeleteBudget: (id: string) => void;
  onApplyTemplate: (templateId: string) => void;
  onCreateTemplate: (template: Omit<BudgetTemplate, 'id'>) => void;
  onAddCustomCategory: (category: Omit<CustomCategory, 'id'>) => void;
  onExportData: () => void;
  onBulkOperation: (operation: 'delete' | 'adjust', budgetIds: string[], adjustment?: number) => void;
}

export const BudgetManagement: React.FC<BudgetManagementProps> = ({
  budgetStatuses,
  budgetTemplates,
  customCategories,
  analytics,
  expenses,
  onAddBudget,
  onUpdateBudget,
  onDeleteBudget,
  onApplyTemplate,
  onCreateTemplate,
  onExportData,
  onBulkOperation
}) => {
  const [activeTab, setActiveTab] = useState<'budgets' | 'analytics' | 'templates' | 'calendar' | 'debt' | 'investments' | 'achievements' | 'family' | 'partners' | 'suggestions' | 'seasonal' | 'scenarios' | 'challenges'>('budgets');
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedBudgets, setSelectedBudgets] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [draggedBudget, setDraggedBudget] = useState<string | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    category: 'total',
    amount: '',
    period: 'monthly',
    type: 'standard',
    alertThresholds: [75, 90, 100],
    rolloverEnabled: false
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const budgetData = {
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      type: formData.type,
      alertThresholds: formData.alertThresholds,
      rolloverEnabled: formData.rolloverEnabled,
      ...(formData.targetDate && { targetDate: formData.targetDate }),
      ...(formData.description && { description: formData.description }),
      ...(formData.autoAdjustSettings && { autoAdjustSettings: formData.autoAdjustSettings })
    };
    
    if (editingBudget) {
      onUpdateBudget(editingBudget.id, budgetData);
    } else {
      onAddBudget(budgetData);
    }
    
    handleFormCancel();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingBudget(null);
    setFormData({
      category: 'total',
      amount: '',
      period: 'monthly',
      type: 'standard',
      alertThresholds: [75, 90, 100],
      rolloverEnabled: false
    });
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      type: budget.type || 'standard',
      alertThresholds: budget.alertThresholds || [75, 90, 100],
      rolloverEnabled: budget.rolloverEnabled || false,
      targetDate: budget.targetDate,
      description: budget.description,
      autoAdjustSettings: budget.autoAdjustSettings
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      onDeleteBudget(id);
    }
  };

  const getProgressBarColor = (percentUsed: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'bg-red-500';
    if (percentUsed >= 90) return 'bg-orange-500';
    if (percentUsed >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (percentUsed: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'text-red-600 bg-red-50';
    if (percentUsed >= 90) return 'text-orange-600 bg-orange-50';
    if (percentUsed >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const handleBulkDelete = () => {
    selectedBudgets.forEach(budgetId => onDeleteBudget(budgetId));
    setSelectedBudgets(new Set());
    setShowBulkActions(false);
  };

  const handleBulkAdjust = (percentage: number) => {
    onBulkOperation('adjust', Array.from(selectedBudgets), percentage);
    setSelectedBudgets(new Set());
    setShowBulkActions(false);
  };

  const handleBudgetSelect = (budgetId: string) => {
    const newSelected = new Set(selectedBudgets);
    if (newSelected.has(budgetId)) {
      newSelected.delete(budgetId);
    } else {
      newSelected.add(budgetId);
    }
    setSelectedBudgets(newSelected);
  };

  const handleDragStart = (budgetId: string) => {
    setDraggedBudget(budgetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetBudgetId: string) => {
    e.preventDefault();
    if (draggedBudget && draggedBudget !== targetBudgetId) {
      // Implement budget reordering logic here
      console.log('Reorder budget:', draggedBudget, 'before', targetBudgetId);
    }
    setDraggedBudget(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <BudgetAnalytics
            analytics={analytics}
            budgetStatuses={budgetStatuses}
            onExportData={onExportData}
          />
        );
      case 'templates':
        return (
          <BudgetTemplates
            templates={budgetTemplates}
            onApplyTemplate={onApplyTemplate}
            onCreateTemplate={onCreateTemplate}
          />
        );
      case 'calendar':
        return (
          <BudgetCalendar
            budgetStatuses={budgetStatuses}
            expenses={expenses}
          />
        );
      case 'debt':
        return (
          <DebtPayoffTracker
            goals={[]}
            onCreateGoal={() => {}}
            onUpdateGoal={() => {}}
            onDeleteGoal={() => {}}
          />
        );
      case 'investments':
        return (
          <InvestmentGoals
            goals={[]}
            onCreateGoal={() => {}}
            onUpdateGoal={() => {}}
            onDeleteGoal={() => {}}
          />
        );
      case 'achievements':
        return (
          <AchievementSystem
            achievements={[]}
            userProgress={{
              totalPoints: 0,
              level: 1,
              streaks: {},
              completedAchievements: [],
              nextLevelPoints: 100
            }}
            onClaimReward={() => {}}
          />
        );
      case 'family':
        return (
          <FamilyBudgetSharing
            familyBudgets={[]}
            currentUserId="user-1"
            onCreateFamily={() => {}}
            onInviteMember={() => {}}
            onUpdatePermissions={() => {}}
            onLeaveFamily={() => {}}
          />
        );
      case 'partners':
        return (
          <AccountabilityPartners
            partners={[]}
            checkIns={[]}
            currentUserId="user-1"
            onAddPartner={() => {}}
            onRemovePartner={() => {}}
            onSubmitCheckIn={() => {}}
            onUpdateGoal={() => {}}
          />
        );
      case 'suggestions':
        return (
          <SmartSuggestions
            suggestions={[]}
            onAcceptSuggestion={() => {}}
            onDismissSuggestion={() => {}}
            onRefreshSuggestions={() => {}}
          />
        );
      case 'seasonal':
        return (
          <SeasonalBudgets
            seasonalAdjustments={[]}
            budgets={budgetStatuses.map(status => status.budget)}
            onCreateAdjustment={() => {}}
            onUpdateAdjustment={() => {}}
            onDeleteAdjustment={() => {}}
            onApplyAdjustment={() => {}}
          />
        );
      case 'scenarios':
        return (
          <BudgetScenarioPlanning
            scenarios={[]}
            budgets={budgetStatuses.map(status => status.budget)}
            onCreateScenario={() => {}}
            onUpdateScenario={() => {}}
            onDeleteScenario={() => {}}
            onCalculateScenario={() => {}}
          />
        );
      case 'challenges':
        return (
          <BudgetChallenges
            challenges={[]}
            currentUserId="user-1"
            currentUsername="User"
            onCreateChallenge={() => {}}
            onJoinChallenge={() => {}}
            onLeaveChallenge={() => {}}
            onUpdateProgress={() => {}}
          />
        );
      default:
        return renderBudgetsTab();
    }
  };

  const renderBudgetsTab = () => (
    <>
      {showBulkActions && selectedBudgets.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedBudgets.size} budget{selectedBudgets.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAdjust(10)}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                +10%
              </button>
              <button
                onClick={() => handleBulkAdjust(-10)}
                className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
              >
                -10%
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setSelectedBudgets(new Set());
                  setShowBulkActions(false);
                }}
                className="text-sm bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {budgetStatuses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No budgets set. Click "Add Budget" to get started.
          </div>
        ) : (
          budgetStatuses.map((status) => (
            <div 
              key={status.budget.id} 
              className={`bg-white p-6 rounded-lg shadow-sm border transition-all duration-200 ${
                selectedBudgets.has(status.budget.id) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md'
              }`}
              draggable
              onDragStart={() => handleDragStart(status.budget.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.budget.id)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedBudgets.has(status.budget.id)}
                    onChange={() => handleBudgetSelect(status.budget.id)}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {status.budget.category === 'total' ? 'Total Budget' : status.budget.category}
                      </h3>
                      {status.budget.type !== 'standard' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {status.budget.type}
                        </span>
                      )}
                      {status.budget.rolloverEnabled && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Rollover
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">
                      {status.budget.period} • {formatCurrency(status.budget.amount)}
                    </p>
                    {status.budget.description && (
                      <p className="text-sm text-gray-600 mt-1">{status.budget.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(status.budget)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(status.budget.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Spent: {formatCurrency(status.spent)}</span>
                  <span>Remaining: {formatCurrency(Math.max(0, status.remaining))}</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(status.percentUsed, status.isOverBudget)}`}
                    style={{ width: `${Math.min(100, status.percentUsed)}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      {status.percentUsed.toFixed(1)}% used
                    </span>
                    <span className="text-sm text-gray-600">
                      {getTrendIcon(status.trend)} {status.previousPeriodComparison.changePercent.toFixed(1)}% vs last period
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status.percentUsed, status.isOverBudget)}`}>
                    {status.isOverBudget ? 'Over Budget' : 
                     status.percentUsed >= 90 ? 'Critical' :
                     status.percentUsed >= 75 ? 'Warning' : 'On Track'}
                  </span>
                </div>

                {status.projectedSpending > status.budget.amount && status.daysRemaining > 0 && (
                  <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                    Projected to exceed budget by {formatCurrency(status.projectedSpending - status.budget.amount)} ({status.daysRemaining} days remaining)
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '↗️';
      case 'decreasing': return '↘️';
      default: return '➡️';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Budget Management</h2>
        <div className="flex gap-2">
          {selectedBudgets.size > 0 && (
            <button
              onClick={() => setShowBulkActions(!showBulkActions)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Bulk Actions ({selectedBudgets.size})
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + Add Budget
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 overflow-x-auto">
          {[
            { id: 'budgets', label: 'Budgets' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'templates', label: 'Templates' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'debt', label: 'Debt Tracker' },
            { id: 'investments', label: 'Investments' },
            { id: 'achievements', label: 'Achievements' },
            { id: 'family', label: 'Family' },
            { id: 'partners', label: 'Partners' },
            { id: 'suggestions', label: 'Suggestions' },
            { id: 'seasonal', label: 'Seasonal' },
            { id: 'scenarios', label: 'Scenarios' },
            { id: 'challenges', label: 'Challenges' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
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

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingBudget ? 'Edit Budget' : 'Add New Budget'}
            </h3>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory | 'total' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="total">Total (All Categories)</option>
                    {Object.values(ExpenseCategory).map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                    {customCategories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Period
                  </label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="savings">Savings Goal</option>
                    <option value="envelope">Envelope</option>
                    <option value="auto-adjusting">Auto-Adjusting</option>
                  </select>
                </div>
              </div>

              {formData.type === 'savings' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate || ''}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Add a description for this budget..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Alert Thresholds (%)
                </label>
                <div className="flex gap-2">
                  {[50, 75, 90, 100].map(threshold => (
                    <label key={threshold} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.alertThresholds.includes(threshold)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              alertThresholds: [...formData.alertThresholds, threshold].sort((a, b) => a - b)
                            });
                          } else {
                            setFormData({
                              ...formData,
                              alertThresholds: formData.alertThresholds.filter(t => t !== threshold)
                            });
                          }
                        }}
                        className="mr-1"
                      />
                      <span className="text-sm">{threshold}%</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.rolloverEnabled}
                    onChange={(e) => setFormData({ ...formData, rolloverEnabled: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable Budget Rollover</span>
                </label>
              </div>

              {formData.type === 'auto-adjusting' && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Auto-Adjustment Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Baseline Months
                      </label>
                      <input
                        type="number"
                        value={formData.autoAdjustSettings?.baselineMonths || 3}
                        onChange={(e) => setFormData({
                          ...formData,
                          autoAdjustSettings: {
                            ...formData.autoAdjustSettings,
                            enabled: true,
                            baselineMonths: parseInt(e.target.value),
                            adjustmentFactor: formData.autoAdjustSettings?.adjustmentFactor || 0.1
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="1"
                        max="12"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adjustment Factor
                      </label>
                      <input
                        type="number"
                        value={formData.autoAdjustSettings?.adjustmentFactor || 0.1}
                        onChange={(e) => setFormData({
                          ...formData,
                          autoAdjustSettings: {
                            ...formData.autoAdjustSettings,
                            enabled: true,
                            baselineMonths: formData.autoAdjustSettings?.baselineMonths || 3,
                            adjustmentFactor: parseFloat(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0.01"
                        max="1"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingBudget ? 'Update Budget' : 'Add Budget'}
                </button>
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renderTabContent()}

    </div>
  );
};