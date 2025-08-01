import React, { useState } from 'react';
import type { 
  Budget, 
  BudgetFormData, 
  BudgetStatus, 
  BudgetTemplate, 
  CustomCategory,
  BudgetAnalytics as BudgetAnalyticsType,
  Expense,
  DebtPayoffGoal,
  InvestmentGoal,
  Achievement,
  UserProgress,
  FamilyBudget,
  AccountabilityPartner,
  SmartSuggestion,
  SeasonalAdjustment,
  BudgetScenario,
  BudgetChallenge,
  PartnerCheckIn
} from '../../types';

import { BudgetTabs, type BudgetTab } from './BudgetTabs';
import { BudgetOverview } from './BudgetOverview';
import { BudgetForm } from './BudgetForm';

// Import existing components that will be used as-is for now
import { BudgetAnalytics } from '../BudgetAnalytics';
import { BudgetTemplates } from '../BudgetTemplates';
import { BudgetCalendar } from '../BudgetCalendar';
import { DebtPayoffTracker } from '../DebtPayoffTracker';
import { InvestmentGoals } from '../InvestmentGoals';
import { AchievementSystem } from '../AchievementSystem';
import { FamilyBudgetSharing } from '../FamilyBudgetSharing';
import { AccountabilityPartners } from '../AccountabilityPartners';
import { SmartSuggestions } from '../SmartSuggestions';
import { SeasonalBudgets } from '../SeasonalBudgets';
import { BudgetScenarioPlanning } from '../BudgetScenarioPlanning';
import { BudgetChallenges } from '../BudgetChallenges';

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
  onAddCustomCategory,
  onExportData,
  onBulkOperation
}) => {
  const [activeTab, setActiveTab] = useState<BudgetTab>('budgets');
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedBudgets, setSelectedBudgets] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  const handleAddBudget = () => {
    setEditingBudget(null);
    setShowForm(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleFormSubmit = (data: BudgetFormData) => {
    const budgetData = {
      category: data.category,
      amount: parseFloat(data.amount),
      period: data.period,
      type: data.type,
      alertThresholds: data.alertThresholds,
      rolloverEnabled: data.rolloverEnabled,
      ...(data.targetDate && { targetDate: data.targetDate }),
      ...(data.description && { description: data.description }),
      ...(data.autoAdjustSettings && { autoAdjustSettings: data.autoAdjustSettings })
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
  };

  const handleBudgetSelect = (budgetId: string) => {
    const newSelected = new Set(selectedBudgets);
    if (newSelected.has(budgetId)) {
      newSelected.delete(budgetId);
    } else {
      newSelected.add(budgetId);
    }
    setSelectedBudgets(newSelected);
    
    if (newSelected.size === 0) {
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = () => {
    onBulkOperation('delete', Array.from(selectedBudgets));
    setSelectedBudgets(new Set());
    setShowBulkActions(false);
  };

  const handleBulkAdjust = (percentage: number) => {
    onBulkOperation('adjust', Array.from(selectedBudgets), percentage);
    setSelectedBudgets(new Set());
    setShowBulkActions(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'budgets':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
              <button
                onClick={handleAddBudget}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Budget
              </button>
            </div>
            
            <BudgetOverview
              budgetStatuses={budgetStatuses}
              selectedBudgets={selectedBudgets}
              onBudgetSelect={handleBudgetSelect}
              onEditBudget={handleEditBudget}
              onDeleteBudget={onDeleteBudget}
              onBulkDelete={handleBulkDelete}
              onBulkAdjust={handleBulkAdjust}
              showBulkActions={showBulkActions}
              setShowBulkActions={setShowBulkActions}
            />
          </div>
        );

      case 'analytics':
        return <BudgetAnalytics analytics={analytics} />;

      case 'templates':
        return (
          <BudgetTemplates
            templates={budgetTemplates}
            customCategories={customCategories}
            onApplyTemplate={onApplyTemplate}
            onCreateTemplate={onCreateTemplate}
          />
        );

      case 'calendar':
        return <BudgetCalendar budgetStatuses={budgetStatuses} />;

      case 'debt':
        return <DebtPayoffTracker />;

      case 'investments':
        return <InvestmentGoals />;

      case 'achievements':
        return <AchievementSystem />;

      case 'family':
        return <FamilyBudgetSharing />;

      case 'partners':
        return <AccountabilityPartners />;

      case 'suggestions':
        return <SmartSuggestions expenses={expenses} budgets={budgetStatuses.map(s => s.budget)} />;

      case 'seasonal':
        return <SeasonalBudgets budgets={budgetStatuses.map(s => s.budget)} />;

      case 'scenarios':
        return <BudgetScenarioPlanning budgets={budgetStatuses.map(s => s.budget)} />;

      case 'challenges':
        return <BudgetChallenges />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <BudgetTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      {renderTabContent()}

      {showForm && (
        <BudgetForm
          editingBudget={editingBudget}
          customCategories={customCategories}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </div>
  );
};