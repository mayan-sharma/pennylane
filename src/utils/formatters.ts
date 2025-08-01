/**
 * Shared formatting utilities
 * Consolidates duplicate formatting functions across components
 */

export const formatCurrency = (amount: number, currency: string = 'INR', locale: string = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatCompactCurrency = (amount: number, currency: string = 'INR', locale: string = 'en-IN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amount);
};

export const formatDate = (dateString: string | Date, locale: string = 'en-IN') => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString(locale);
};

export const formatDateTime = (dateString: string | Date, locale: string = 'en-IN') => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString(locale);
};

export const formatPercentage = (value: number, decimals: number = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, locale: string = 'en-IN') => {
  return new Intl.NumberFormat(locale).format(value);
};