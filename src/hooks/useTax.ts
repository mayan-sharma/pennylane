import { useState, useEffect, useCallback } from 'react';
import type { TaxDeduction, TaxableExpense, TaxReport } from '../types/tax';
import { getStorageData, setStorageData } from '../utils/localStorage';
import { calculateIncomeTax, getFinancialYear, isExpenseDeductible } from '../utils/taxCalculation';
import type { Expense } from '../types/expense';

const TAX_DEDUCTIONS_KEY = 'tax_deductions';
const TAXABLE_EXPENSES_KEY = 'taxable_expenses';

export const useTax = (expenses: Expense[] = []) => {
  const [deductions, setDeductions] = useState<TaxDeduction[]>([]);
  const [taxableExpenses, setTaxableExpenses] = useState<TaxableExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const savedDeductions = getStorageData(TAX_DEDUCTIONS_KEY, []);
        const savedTaxableExpenses = getStorageData(TAXABLE_EXPENSES_KEY, []);
        setDeductions(savedDeductions);
        setTaxableExpenses(savedTaxableExpenses);
      } catch (error) {
        console.error('Error loading tax data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addDeduction = useCallback((deductionData: Omit<TaxDeduction, 'id' | 'createdAt'>) => {
    const newDeduction: TaxDeduction = {
      ...deductionData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    const updatedDeductions = [...deductions, newDeduction];
    setDeductions(updatedDeductions);
    setStorageData(TAX_DEDUCTIONS_KEY, updatedDeductions);
  }, [deductions]);

  const updateDeduction = useCallback((id: string, updates: Partial<TaxDeduction>) => {
    const updatedDeductions = deductions.map(deduction =>
      deduction.id === id ? { ...deduction, ...updates } : deduction
    );
    setDeductions(updatedDeductions);
    setStorageData(TAX_DEDUCTIONS_KEY, updatedDeductions);
  }, [deductions]);

  const deleteDeduction = useCallback((id: string) => {
    const updatedDeductions = deductions.filter(deduction => deduction.id !== id);
    setDeductions(updatedDeductions);
    setStorageData(TAX_DEDUCTIONS_KEY, updatedDeductions);
  }, [deductions]);

  const updateExpenseTaxInfo = useCallback((expenseId: string, taxInfo: Omit<TaxableExpense, 'expenseId'>) => {
    const existingIndex = taxableExpenses.findIndex(te => te.expenseId === expenseId);
    let updatedTaxableExpenses;

    if (existingIndex >= 0) {
      updatedTaxableExpenses = taxableExpenses.map(te =>
        te.expenseId === expenseId ? { ...te, ...taxInfo } : te
      );
    } else {
      updatedTaxableExpenses = [...taxableExpenses, { expenseId, ...taxInfo }];
    }

    setTaxableExpenses(updatedTaxableExpenses);
    setStorageData(TAXABLE_EXPENSES_KEY, updatedTaxableExpenses);
  }, [taxableExpenses]);

  const calculateTotalDeductions = useCallback((financialYear?: string) => {
    const currentFY = financialYear || getFinancialYear();
    const fyDeductions = deductions.filter(d => d.financialYear === currentFY);
    
    return fyDeductions.reduce((total, deduction) => {
      switch (deduction.type) {
        case '80C':
          return total + Math.min(deduction.amount, 150000);
        case 'MEDICAL_INSURANCE':
          return total + Math.min(deduction.amount, 25000);
        case 'HRA':
        case 'OTHER':
          return total + deduction.amount;
        default:
          return total;
      }
    }, 0);
  }, [deductions]);

  const getDeductibleExpenses = useCallback((financialYear?: string) => {
    const currentFY = financialYear || getFinancialYear();
    const fyStartDate = new Date(`${currentFY.split('-')[0]}-04-01`);
    const fyEndDate = new Date(`${currentFY.split('-')[1]}-03-31`);

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const isInFY = expenseDate >= fyStartDate && expenseDate <= fyEndDate;
      const taxInfo = taxableExpenses.find(te => te.expenseId === expense.id);
      
      return isInFY && (
        taxInfo?.isDeductible || 
        isExpenseDeductible(expense.category, expense.description)
      );
    });
  }, [expenses, taxableExpenses]);

  const generateTaxReport = useCallback((totalIncome: number, financialYear?: string): TaxReport => {
    const currentFY = financialYear || getFinancialYear();
    const totalDeductions = calculateTotalDeductions(currentFY);
    const deductibleExpenses = getDeductibleExpenses(currentFY);
    const expenseDeductions = deductibleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    const finalDeductions = totalDeductions + expenseDeductions;
    const taxCalculation = calculateIncomeTax(totalIncome, finalDeductions);
    
    const gstSummary = taxableExpenses.reduce(
      (acc, te) => ({
        collected: acc.collected + te.gstAmount,
        paid: acc.paid + te.gstAmount
      }),
      { collected: 0, paid: 0 }
    );

    const deductionSummary = Object.entries(
      deductions
        .filter(d => d.financialYear === currentFY)
        .reduce((acc, d) => {
          acc[d.type] = (acc[d.type] || 0) + d.amount;
          return acc;
        }, {} as Record<string, number>)
    ).map(([type, amount]) => ({ type, amount }));

    return {
      financialYear: currentFY,
      totalIncome,
      totalDeductions: finalDeductions,
      taxableIncome: taxCalculation.taxableIncome,
      totalTax: taxCalculation.totalTax,
      gstCollected: gstSummary.collected,
      gstPaid: gstSummary.paid,
      deductionSummary,
      generatedAt: new Date().toISOString()
    };
  }, [deductions, taxableExpenses, calculateTotalDeductions, getDeductibleExpenses]);

  return {
    deductions,
    taxableExpenses,
    loading,
    addDeduction,
    updateDeduction,
    deleteDeduction,
    updateExpenseTaxInfo,
    calculateTotalDeductions,
    getDeductibleExpenses,
    generateTaxReport
  };
};