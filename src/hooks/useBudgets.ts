import { useState, useEffect, useCallback } from 'react';
import type { Budget, BudgetStatus, Expense } from '../types/expense';
import { storage } from '../utils/localStorage';

export const useBudgets = (expenses: Expense[]) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBudgets = () => {
      setLoading(true);
      const storedBudgets = storage.getBudgets();
      setBudgets(storedBudgets);
      setLoading(false);
    };

    loadBudgets();
  }, []);

  const addBudget = useCallback((budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    storage.addBudget(newBudget);
    setBudgets(prev => [...prev, newBudget]);
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    const updatedBudget: Budget = {
      ...budgets.find(b => b.id === id)!,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    storage.updateBudget(id, updatedBudget);
    setBudgets(prev => prev.map(budget => 
      budget.id === id ? updatedBudget : budget
    ));
  }, [budgets]);

  const deleteBudget = useCallback((id: string) => {
    storage.deleteBudget(id);
    setBudgets(prev => prev.filter(budget => budget.id !== id));
  }, []);

  const getBudgetStatus = useCallback((budget: Budget): BudgetStatus => {
    const now = new Date();
    let periodStart: Date;
    
    if (budget.period === 'monthly') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    }

    const relevantExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= periodStart && expenseDate <= now;
    });

    const spent = budget.category === 'total' 
      ? relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      : relevantExpenses
          .filter(expense => expense.category === budget.category)
          .reduce((sum, expense) => sum + expense.amount, 0);

    const remaining = budget.amount - spent;
    const percentUsed = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const isOverBudget = spent > budget.amount;

    return {
      budget,
      spent,
      remaining,
      percentUsed,
      isOverBudget,
    };
  }, [expenses]);

  const getAllBudgetStatuses = useCallback((): BudgetStatus[] => {
    return budgets.map(budget => getBudgetStatus(budget));
  }, [budgets, getBudgetStatus]);

  const getBudgetAlert = useCallback((budgetStatus: BudgetStatus): string | null => {
    const { percentUsed, isOverBudget, budget } = budgetStatus;
    
    if (isOverBudget) {
      return `Budget exceeded for ${budget.category === 'total' ? 'Total' : budget.category}!`;
    }
    
    if (percentUsed >= 90) {
      return `90% of budget used for ${budget.category === 'total' ? 'Total' : budget.category}`;
    }
    
    if (percentUsed >= 75) {
      return `75% of budget used for ${budget.category === 'total' ? 'Total' : budget.category}`;
    }
    
    return null;
  }, []);

  const getActiveAlerts = useCallback((): string[] => {
    const budgetStatuses = getAllBudgetStatuses();
    return budgetStatuses
      .map(status => getBudgetAlert(status))
      .filter((alert): alert is string => alert !== null);
  }, [getAllBudgetStatuses, getBudgetAlert]);

  return {
    budgets,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetStatus,
    getAllBudgetStatuses,
    getActiveAlerts,
  };
};