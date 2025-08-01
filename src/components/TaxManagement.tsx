import React, { useState } from 'react';
import { TaxCalculator } from './TaxCalculator';
import { TaxDeductions } from './TaxDeductions';
import { TaxReports } from './TaxReports';
import { TaxRegimeComparison } from './TaxRegimeComparison';
import { InvestmentTracker } from './InvestmentTracker';
import { TaxNotifications } from './TaxNotifications';
import { TaxDashboard } from './TaxDashboard';
import { useTax } from '../hooks/useTax';
import { useNotifications } from '../hooks/useNotifications';
import type { Expense } from '../types';

interface TaxManagementProps {
  expenses: Expense[];
}

export const TaxManagement: React.FC<TaxManagementProps> = ({ expenses }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'comparison' | 'investments' | 'deductions' | 'notifications' | 'reports'>('dashboard');
  
  const {
    deductions,
    loading,
    addDeduction,
    updateDeduction,
    deleteDeduction,
    generateTaxReport
  } = useTax(expenses);

  const { getUnreadCount } = useNotifications();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unreadCount = getUnreadCount();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📈' },
    { id: 'calculator', label: 'Calculator', icon: '🧮' },
    { id: 'comparison', label: 'Regime Comparison', icon: '⚖️' },
    { id: 'investments', label: 'Investments', icon: '💰' },
    { id: 'deductions', label: 'Deductions', icon: '📋' },
    { id: 'notifications', label: `Notifications${unreadCount > 0 ? ` (${unreadCount})` : ''}`, icon: '🔔' },
    { id: 'reports', label: 'Reports', icon: '📊' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tax Management</h1>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && <TaxDashboard expenses={expenses} />}
        
        {activeTab === 'calculator' && <TaxCalculator />}
        
        {activeTab === 'comparison' && <TaxRegimeComparison />}
        
        {activeTab === 'investments' && <InvestmentTracker />}
        
        {activeTab === 'deductions' && (
          <TaxDeductions
            deductions={deductions}
            onAddDeduction={addDeduction}
            onUpdateDeduction={updateDeduction}
            onDeleteDeduction={deleteDeduction}
          />
        )}
        
        {activeTab === 'notifications' && <TaxNotifications />}
        
        {activeTab === 'reports' && (
          <TaxReports onGenerateReport={generateTaxReport} />
        )}
      </div>
    </div>
  );
};