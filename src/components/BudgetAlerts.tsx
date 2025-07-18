import React from 'react';

interface BudgetAlertsProps {
  alerts: string[];
  onDismiss?: (index: number) => void;
}

export const BudgetAlerts: React.FC<BudgetAlertsProps> = ({ alerts, onDismiss }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert, index) => (
        <div
          key={index}
          className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-orange-600 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L4.054 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-orange-800 font-medium">{alert}</span>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(index)}
              className="text-orange-600 hover:text-orange-800 ml-4"
              aria-label="Dismiss alert"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
};