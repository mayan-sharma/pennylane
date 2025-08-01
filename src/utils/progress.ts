/**
 * Shared progress calculation utilities
 * Consolidates duplicate progress bar logic across components
 */

export interface ProgressData {
  current: number;
  total: number;
  percentage: number;
  isOverBudget: boolean;
  status: 'good' | 'warning' | 'danger' | 'over';
}

export const calculateProgress = (current: number, total: number): ProgressData => {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const isOverBudget = current > total;
  
  let status: ProgressData['status'] = 'good';
  if (isOverBudget) {
    status = 'over';
  } else if (percentage >= 90) {
    status = 'danger';
  } else if (percentage >= 75) {
    status = 'warning';
  }
  
  return {
    current,
    total,
    percentage,
    isOverBudget,
    status
  };
};

export const getProgressWidth = (percentage: number, maxWidth: number = 100): number => {
  return Math.min(percentage, maxWidth);
};

export const getProgressMessage = (progress: ProgressData): string => {
  const { percentage, isOverBudget, current, total } = progress;
  
  if (isOverBudget) {
    const overage = current - total;
    return `Over budget by ${overage.toFixed(0)}`;
  }
  
  const remaining = total - current;
  if (percentage >= 90) {
    return `${remaining.toFixed(0)} remaining`;
  } else if (percentage >= 75) {
    return `${remaining.toFixed(0)} left`;
  } else {
    return `${percentage.toFixed(1)}% used`;
  }
};