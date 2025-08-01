import React from 'react';
import { type BudgetStatus } from '../types';

interface BudgetAlertsProps {
  budgetStatuses: BudgetStatus[];
  onDismiss?: (alertId: string) => void;
  onSnooze?: (alertId: string, hours: number) => void;
}

export const BudgetAlerts: React.FC<BudgetAlertsProps> = ({
  budgetStatuses,
  onDismiss,
  onSnooze
}) => {
  const alertBudgets = budgetStatuses.filter(status => status.percentUsed >= 80);

  if (alertBudgets.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">Budget Alerts</h3>
      <div className="space-y-2">
        {alertBudgets.map(status => (
          <div key={status.budget.id} className="flex items-center justify-between text-sm text-yellow-700">
            <span>
              {status.budget.category} budget is {status.percentUsed.toFixed(1)}% used
            </span>
            <div className="flex space-x-2">
              {onSnooze && (
                <button
                  onClick={() => onSnooze(status.budget.id, 24)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  Snooze
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={() => onDismiss(status.budget.id)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};