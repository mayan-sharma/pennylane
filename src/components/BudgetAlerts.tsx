import React, { useState } from 'react';
import type { BudgetStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

type AlertType = 'warning' | 'critical' | 'info' | 'success';

interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  timestamp: Date;
  category?: string;
  actionable?: boolean;
  dismissed?: boolean;
}

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
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [showSnoozeMenu, setShowSnoozeMenu] = useState<string | null>(null);

  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];
    const now = new Date();

    budgetStatuses.forEach((status) => {
      const { budget, percentUsed, isOverBudget, projectedSpending, daysRemaining } = status;
      const categoryName = budget.category === 'total' ? 'Total Budget' : budget.category;

      // Over budget alerts
      if (isOverBudget) {
        alerts.push({
          id: `over-budget-${budget.id}`,
          type: 'critical',
          title: 'Budget Exceeded!',
          message: `${categoryName} has exceeded its ${budget.period} budget by ${formatCurrency(status.spent - budget.amount)}`,
          timestamp: now,
          category: budget.category,
          actionable: true
        });
      }

      // Custom threshold alerts
      budget.alertThresholds.forEach(threshold => {
        if (percentUsed >= threshold && !isOverBudget) {
          const alertType: AlertType = 
            threshold >= 90 ? 'critical' : 
            threshold >= 75 ? 'warning' : 'info';
          
          alerts.push({
            id: `threshold-${budget.id}-${threshold}`,
            type: alertType,
            title: `${threshold}% Budget Alert`,
            message: `${categoryName} has used ${percentUsed.toFixed(1)}% of its ${budget.period} budget`,
            timestamp: now,
            category: budget.category,
            actionable: threshold >= 90
          });
        }
      });

      // Projection alerts
      if (projectedSpending > budget.amount && daysRemaining > 0 && !isOverBudget) {
        const overage = ((projectedSpending - budget.amount) / budget.amount * 100).toFixed(1);
        alerts.push({
          id: `projection-${budget.id}`,
          type: 'warning',
          title: 'Budget Projection Alert',
          message: `${categoryName} is projected to exceed budget by ${overage}% based on current spending`,
          timestamp: now,
          category: budget.category,
          actionable: true
        });
      }

      // Positive alerts for good budget management
      if (percentUsed <= 50 && budget.period === 'monthly' && now.getDate() > 15) {
        alerts.push({
          id: `good-progress-${budget.id}`,
          type: 'success',
          title: 'Great Budget Management!',
          message: `${categoryName} is only at ${percentUsed.toFixed(1)}% usage - excellent control!`,
          timestamp: now,
          category: budget.category,
          actionable: false
        });
      }

      // Rollover opportunity alerts
      if (budget.rolloverEnabled && status.remaining > 0 && daysRemaining <= 3) {
        alerts.push({
          id: `rollover-${budget.id}`,
          type: 'info',
          title: 'Rollover Opportunity',
          message: `${formatCurrency(status.remaining)} can be rolled over to next ${budget.period}`,
          timestamp: now,
          category: budget.category,
          actionable: true
        });
      }
    });

    return alerts.filter(alert => !dismissedAlerts.has(alert.id));
  };


  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          button: 'text-red-600 hover:text-red-800'
        };
      case 'warning':
        return {
          container: 'bg-orange-50 border-orange-200 text-orange-800',
          icon: 'text-orange-600',
          button: 'text-orange-600 hover:text-orange-800'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-800',
          icon: 'text-green-600',
          button: 'text-green-600 hover:text-green-800'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          button: 'text-blue-600 hover:text-blue-800'
        };
    }
  };

  const getAlertIcon = (type: AlertType) => {
    switch (type) {
      case 'critical':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L4.054 16.5c-.77.833.192 2.5 1.732 2.5z" />
        );
      case 'warning':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L4.054 16.5c-.77.833.192 2.5 1.732 2.5z" />
        );
      case 'success':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        );
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        );
    }
  };

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismiss?.(alertId);
  };

  const handleSnooze = (alertId: string, hours: number) => {
    onSnooze?.(alertId, hours);
    setShowSnoozeMenu(null);
  };

  const alerts = generateAlerts();
  
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Budget Alerts</h3>
        <span className="text-sm text-gray-500">{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</span>
      </div>
      
      {alerts.map((alert) => {
        const styles = getAlertStyles(alert.type);
        return (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${styles.container} transition-all duration-200 hover:shadow-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <svg
                  className={`w-5 h-5 ${styles.icon} mr-3 mt-0.5 flex-shrink-0`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {getAlertIcon(alert.type)}
                </svg>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-sm">{alert.title}</h4>
                  <p className="text-sm mt-1">{alert.message}</p>
                  <div className="flex items-center mt-2 text-xs opacity-75">
                    <span>{alert.timestamp.toLocaleTimeString()}</span>
                    {alert.category && alert.category !== 'total' && (
                      <span className="ml-2 px-2 py-1 bg-white bg-opacity-50 rounded">
                        {alert.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {alert.actionable && onSnooze && (
                  <div className="relative">
                    <button
                      onClick={() => setShowSnoozeMenu(showSnoozeMenu === alert.id ? null : alert.id)}
                      className={`${styles.button} p-1 hover:bg-white hover:bg-opacity-20 rounded`}
                      title="Snooze alert"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    
                    {showSnoozeMenu === alert.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        <button
                          onClick={() => handleSnooze(alert.id, 1)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          1 hour
                        </button>
                        <button
                          onClick={() => handleSnooze(alert.id, 4)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          4 hours
                        </button>
                        <button
                          onClick={() => handleSnooze(alert.id, 24)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          1 day
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className={`${styles.button} p-1 hover:bg-white hover:bg-opacity-20 rounded`}
                  title="Dismiss alert"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};