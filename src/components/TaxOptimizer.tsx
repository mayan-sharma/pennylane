import React from 'react';
import { TaxModule } from './tax/TaxModule';
import type { Expense } from '../types';

interface TaxOptimizerProps {
  expenses: Expense[];
  currentIncome: number;
  currentDeductions: Record<string, number>;
}

export const TaxOptimizer: React.FC<TaxOptimizerProps> = ({
  expenses,
  currentIncome,
  currentDeductions
}) => {
  return (
    <TaxModule 
      expenses={expenses} 
      mode="optimizer" 
      currentIncome={currentIncome}
      currentDeductions={currentDeductions}
    />
  );
};