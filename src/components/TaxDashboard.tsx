import React from 'react';
import { TaxModule } from './tax/TaxModule';
import type { Expense } from '../types';

interface TaxDashboardProps {
  expenses: Expense[];
}

export const TaxDashboard: React.FC<TaxDashboardProps> = ({ expenses }) => {
  return <TaxModule expenses={expenses} mode="dashboard" />;
};