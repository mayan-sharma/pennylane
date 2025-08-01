/**
 * Shared validation utilities
 * Consolidates duplicate validation logic across components
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateAmount = (amount: number | string): ValidationResult => {
  const errors: string[] = [];
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    errors.push('Amount must be a valid number');
  } else if (numAmount < 0) {
    errors.push('Amount cannot be negative');
  } else if (numAmount > 10000000) {
    errors.push('Amount cannot exceed ₹1,00,00,000');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    errors.push('Email is required');
  } else if (!emailRegex.test(email)) {
    errors.push('Please enter a valid email address');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateRequired = (value: string | number | null | undefined, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (value === null || value === undefined || value === '') {
    errors.push(`${fieldName} is required`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateDateRange = (startDate: string | Date, endDate: string | Date): ValidationResult => {
  const errors: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime())) {
    errors.push('Start date is invalid');
  }
  
  if (isNaN(end.getTime())) {
    errors.push('End date is invalid');
  }
  
  if (start > end) {
    errors.push('Start date must be before end date');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};