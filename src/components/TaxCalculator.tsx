import React from 'react';
import { TaxModule } from './tax/TaxModule';

export const TaxCalculator: React.FC = () => {
  return <TaxModule expenses={[]} mode="calculator" />;
};