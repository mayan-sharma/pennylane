/**
 * Shared color utilities and schemes
 * Consolidates duplicate color mappings across components
 */

import { ExpenseCategory } from '../types/expense/base';

export const getCategoryColor = (category: ExpenseCategory) => {
  const colors = {
    [ExpenseCategory.FOOD]: 'bg-orange-100 text-orange-800',
    [ExpenseCategory.TRANSPORT]: 'bg-blue-100 text-blue-800',
    [ExpenseCategory.BILLS]: 'bg-red-100 text-red-800',
    [ExpenseCategory.ENTERTAINMENT]: 'bg-purple-100 text-purple-800',
    [ExpenseCategory.SHOPPING]: 'bg-pink-100 text-pink-800',
    [ExpenseCategory.HEALTHCARE]: 'bg-green-100 text-green-800',
    [ExpenseCategory.EDUCATION]: 'bg-indigo-100 text-indigo-800',
    [ExpenseCategory.TRAVEL]: 'bg-teal-100 text-teal-800',
    [ExpenseCategory.HOUSING]: 'bg-yellow-100 text-yellow-800',
    [ExpenseCategory.OTHER]: 'bg-gray-100 text-gray-800',
  };
  
  return colors[category] || colors[ExpenseCategory.OTHER];
};

export const getProgressBarColor = (percentUsed: number, isOverBudget: boolean = false) => {
  if (isOverBudget || percentUsed > 100) return 'bg-red-500';
  if (percentUsed >= 90) return 'bg-orange-500';
  if (percentUsed >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

export const getProgressBarBgColor = (percentUsed: number, isOverBudget: boolean = false) => {
  if (isOverBudget || percentUsed > 100) return 'bg-red-100';
  if (percentUsed >= 90) return 'bg-orange-100';
  if (percentUsed >= 75) return 'bg-yellow-100';
  return 'bg-green-100';
};

export const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
  switch (trend) {
    case 'up': return 'text-red-600';
    case 'down': return 'text-green-600';
    case 'stable': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

export const getStatusColor = (status: 'active' | 'inactive' | 'warning' | 'error') => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-gray-100 text-gray-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'error': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};