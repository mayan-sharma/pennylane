import React from 'react';

export type BudgetTab = 
  | 'budgets' 
  | 'analytics' 
  | 'templates' 
  | 'calendar' 
  | 'debt' 
  | 'investments' 
  | 'achievements' 
  | 'family' 
  | 'partners' 
  | 'suggestions' 
  | 'seasonal' 
  | 'scenarios' 
  | 'challenges';

interface BudgetTabsProps {
  activeTab: BudgetTab;
  onTabChange: (tab: BudgetTab) => void;
}

const tabs: { id: BudgetTab; label: string; icon?: string }[] = [
  { id: 'budgets', label: 'Budgets', icon: '💰' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'templates', label: 'Templates', icon: '📋' },
  { id: 'calendar', label: 'Calendar', icon: '📅' },
  { id: 'debt', label: 'Debt Tracker', icon: '💳' },
  { id: 'investments', label: 'Investments', icon: '📈' },
  { id: 'achievements', label: 'Achievements', icon: '🏆' },
  { id: 'family', label: 'Family Budget', icon: '👨‍👩‍👧‍👦' },
  { id: 'partners', label: 'Partners', icon: '🤝' },
  { id: 'suggestions', label: 'Smart Tips', icon: '💡' },
  { id: 'seasonal', label: 'Seasonal', icon: '🌱' },
  { id: 'scenarios', label: 'Scenarios', icon: '🎯' },
  { id: 'challenges', label: 'Challenges', icon: '🎮' }
];

export const BudgetTabs: React.FC<BudgetTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};