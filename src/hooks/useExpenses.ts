import { useState, useEffect, useCallback } from 'react';
import { ExpenseCategory, type Expense, type ExpenseFilters, type ExpenseStats } from '../types/expense';
import { storage } from '../utils/localStorage';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpenses = () => {
      setLoading(true);
      const storedExpenses = storage.getExpenses();
      setExpenses(storedExpenses);
      setLoading(false);
    };

    loadExpenses();
  }, []);

  const addExpense = useCallback((expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.addExpense(newExpense);
    setExpenses(prev => [...prev, newExpense]);
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<Expense>) => {
    const updatedExpense: Expense = {
      ...expenses.find(e => e.id === id)!,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    storage.updateExpense(id, updatedExpense);
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? updatedExpense : expense
    ));
  }, [expenses]);

  const deleteExpense = useCallback((id: string) => {
    storage.deleteExpense(id);
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  }, []);

  const getFilteredExpenses = useCallback((filters: ExpenseFilters) => {
    return expenses.filter(expense => {
      if (filters.category && expense.category !== filters.category) return false;
      if (filters.dateFrom && expense.date < filters.dateFrom) return false;
      if (filters.dateTo && expense.date > filters.dateTo) return false;
      if (filters.searchTerm && !expense.description.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [expenses]);

  const getExpenseStats = useCallback((): ExpenseStats => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisWeek = new Date(now.setDate(now.getDate() - now.getDay()));

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const thisMonthTotal = expenses
      .filter(expense => new Date(expense.date) >= thisMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const thisWeekTotal = expenses
      .filter(expense => new Date(expense.date) >= thisWeek)
      .reduce((sum, expense) => sum + expense.amount, 0);

    const byCategory = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<ExpenseCategory, number>);

    return {
      total,
      byCategory,
      thisMonth: thisMonthTotal,
      thisWeek: thisWeekTotal,
      count: expenses.length,
    };
  }, [expenses]);

  const getRecentExpenses = useCallback((limit: number = 5) => {
    return expenses
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }, [expenses]);

  return {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    getFilteredExpenses,
    getExpenseStats,
    getRecentExpenses,
  };
};