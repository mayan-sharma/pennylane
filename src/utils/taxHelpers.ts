/**
 * Shared tax calculation helpers and utilities
 * Consolidates duplicate tax logic across components
 */

import { formatCurrency } from './formatters';

export const formatCompactCurrency = (amount: number) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return formatCurrency(amount);
};

export const getTaxStatusColor = (percentage: number) => {
  if (percentage <= 5) return 'text-green-600 bg-green-50';
  if (percentage <= 15) return 'text-yellow-600 bg-yellow-50';
  if (percentage <= 30) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

export const getTaxStatusIcon = (percentage: number) => {
  if (percentage <= 5) return '✅';
  if (percentage <= 15) return '⚡';
  if (percentage <= 30) return '⚠️';
  return '🚨';
};

export const validateTaxInput = (value: string): { isValid: boolean; numValue: number } => {
  const numValue = parseFloat(value) || 0;
  return {
    isValid: !isNaN(numValue) && numValue >= 0 && numValue <= 100000000,
    numValue
  };
};

export const getFinancialYearDates = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const isAfterMarch = currentDate.getMonth() >= 3;
  
  const fyStart = new Date(isAfterMarch ? currentYear : currentYear - 1, 3, 1);
  const fyEnd = new Date(isAfterMarch ? currentYear + 1 : currentYear, 2, 31);
  
  return { fyStart, fyEnd };
};

export const calculateMonthsElapsed = () => {
  const { fyStart } = getFinancialYearDates();
  const currentDate = new Date();
  const monthsDiff = (currentDate.getFullYear() - fyStart.getFullYear()) * 12 + 
                    (currentDate.getMonth() - fyStart.getMonth());
  return Math.max(0, Math.min(12, monthsDiff));
};