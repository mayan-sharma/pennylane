import { useState, useEffect, useCallback } from 'react';
import { type Expense, type ExpenseStats } from '../types';

const STORAGE_KEY = 'pennylane-expenses';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Load expenses from localStorage
  useEffect(() => {
    setLoading(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpenses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
    setLoading(false);
  }, []);

  // Save expenses to localStorage
  const saveExpenses = useCallback((newExpenses: Expense[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newExpenses));
    } catch (error) {
      console.error('Failed to save expenses:', error);
    }
  }, []);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  }, [expenses, saveExpenses]);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const updatedExpenses = expenses.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    );
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  }, [expenses, saveExpenses]);

  const deleteExpense = useCallback((id: string) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== id);
    setExpenses(updatedExpenses);
    saveExpenses(updatedExpenses);
  }, [expenses, saveExpenses]);

  const getExpenseStats = useCallback((): ExpenseStats => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const monthlyTotal = expenses
      .filter(expense => new Date(expense.date) >= thisMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      monthlyTotal,
      categoryTotals,
      expenseCount: expenses.length,
    };
  }, [expenses]);

  const getRecentExpenses = useCallback((limit: number = 5) => {
    return expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }, [expenses]);

  const loadExpenses = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpenses(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  }, []);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseStats,
    getRecentExpenses,
    loadExpenses,
  };
};