import React from 'react';
import { TaxModule } from './tax/TaxModule';
import type { Expense } from '../types';

interface TaxManagementProps {
  expenses: Expense[];
}

export const TaxManagement: React.FC<TaxManagementProps> = ({ expenses }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tax Management</h1>
      </div>
      
      <TaxModule expenses={expenses} mode="dashboard" />
    </div>
  );
};