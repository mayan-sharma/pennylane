import { useState, useEffect, useCallback } from 'react';
import type { Investment } from '../types/tax';
import { getStorageData, setStorageData } from '../utils/localStorage';
import { getFinancialYear } from '../utils/taxCalculation';

const INVESTMENTS_KEY = 'tax_investments';

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvestments = () => {
      try {
        const savedInvestments = getStorageData(INVESTMENTS_KEY, []);
        setInvestments(savedInvestments);
      } catch (error) {
        console.error('Error loading investments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvestments();
  }, []);

  const addInvestment = useCallback((investmentData: Omit<Investment, 'id' | 'createdAt'>) => {
    const newInvestment: Investment = {
      ...investmentData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const updatedInvestments = [...investments, newInvestment];
    setInvestments(updatedInvestments);
    setStorageData(INVESTMENTS_KEY, updatedInvestments);
  }, [investments]);

  const updateInvestment = useCallback((id: string, updates: Partial<Investment>) => {
    const updatedInvestments = investments.map(investment =>
      investment.id === id ? { ...investment, ...updates } : investment
    );
    setInvestments(updatedInvestments);
    setStorageData(INVESTMENTS_KEY, updatedInvestments);
  }, [investments]);

  const deleteInvestment = useCallback((id: string) => {
    const updatedInvestments = investments.filter(investment => investment.id !== id);
    setInvestments(updatedInvestments);
    setStorageData(INVESTMENTS_KEY, updatedInvestments);
  }, [investments]);

  const getInvestmentsBySection = useCallback((section: string, financialYear?: string) => {
    const currentFY = financialYear || getFinancialYear();
    return investments.filter(inv => 
      inv.taxSection === section && 
      inv.financialYear === currentFY &&
      inv.isActive
    );
  }, [investments]);

  const getTotalInvestmentBySection = useCallback((section: string, financialYear?: string) => {
    const sectionInvestments = getInvestmentsBySection(section, financialYear);
    return sectionInvestments.reduce((total, inv) => total + inv.amount, 0);
  }, [getInvestmentsBySection]);

  const getInvestmentSummary = useCallback((financialYear?: string) => {
    const currentFY = financialYear || getFinancialYear();
    const fyInvestments = investments.filter(inv => 
      inv.financialYear === currentFY && inv.isActive
    );

    const summary = fyInvestments.reduce((acc, inv) => {
      acc[inv.taxSection] = (acc[inv.taxSection] || 0) + inv.amount;
      acc.total += inv.amount;
      return acc;
    }, { total: 0 } as Record<string, number>);

    return summary;
  }, [investments]);

  const getMaturingInvestments = useCallback((daysAhead: number = 90) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return investments.filter(inv => {
      if (!inv.maturityDate || !inv.isActive) return false;
      const maturityDate = new Date(inv.maturityDate);
      return maturityDate <= futureDate && maturityDate >= new Date();
    });
  }, [investments]);

  return {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getInvestmentsBySection,
    getTotalInvestmentBySection,
    getInvestmentSummary,
    getMaturingInvestments
  };
};