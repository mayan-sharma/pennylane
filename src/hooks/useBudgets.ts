import { useState, useEffect, useCallback } from 'react';
import type { Budget, BudgetStatus, BudgetAnalytics, BudgetTemplate, Expense, CustomCategory } from '../types';
import { storage } from '../utils/localStorage';

export const useBudgets = (expenses: Expense[]) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      const storedBudgets = storage.getBudgets();
      const storedCategories = storage.getCustomCategories();
      const storedTemplates = storage.getBudgetTemplates();
      
      setBudgets(storedBudgets.map(budget => ({
        ...budget,
        type: budget.type || 'standard',
        alertThresholds: budget.alertThresholds || [75, 90, 100],
        rolloverEnabled: budget.rolloverEnabled || false
      })));
      setCustomCategories(storedCategories);
      setBudgetTemplates(storedTemplates);
      
      setLoading(false);
    };

    loadData();
  }, []);

  const addBudget = useCallback((budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: budgetData.type || 'standard',
      alertThresholds: budgetData.alertThresholds || [75, 90, 100],
      rolloverEnabled: budgetData.rolloverEnabled || false
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
    let periodEnd: Date = now;
    
    switch (budget.period) {
      case 'monthly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'weekly':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        periodEnd = new Date(periodStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      case 'yearly':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
      case 'daily':
        periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodEnd = new Date(periodStart.getTime() + 24 * 60 * 60 * 1000);
        break;
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
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

    const baseAmount = budget.rolloverEnabled && budget.rolloverAmount ? 
      budget.amount + budget.rolloverAmount : budget.amount;
    
    const remaining = baseAmount - spent;
    const percentUsed = baseAmount > 0 ? (spent / baseAmount) * 100 : 0;
    const isOverBudget = spent > baseAmount;
    
    const daysInPeriod = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, daysInPeriod - daysPassed);
    
    const averageDailySpending = daysPassed > 0 ? spent / daysPassed : 0;
    const projectedSpending = averageDailySpending * daysInPeriod;
    
    const previousPeriodStart = new Date(periodStart);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    const previousPeriodEnd = new Date(periodStart);
    
    const previousPeriodExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= previousPeriodStart && expenseDate < previousPeriodEnd;
    });
    
    const previousPeriodSpent = budget.category === 'total'
      ? previousPeriodExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      : previousPeriodExpenses
          .filter(expense => expense.category === budget.category)
          .reduce((sum, expense) => sum + expense.amount, 0);
    
    const change = spent - previousPeriodSpent;
    const changePercent = previousPeriodSpent > 0 ? (change / previousPeriodSpent) * 100 : 0;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 10) {
      trend = changePercent > 0 ? 'increasing' : 'decreasing';
    }

    return {
      budget,
      spent,
      remaining,
      percentUsed,
      isOverBudget,
      projectedSpending,
      daysRemaining,
      averageDailySpending,
      trend,
      previousPeriodComparison: {
        spent: previousPeriodSpent,
        change,
        changePercent
      }
    };
  }, [expenses]);

  const getAllBudgetStatuses = useCallback((): BudgetStatus[] => {
    return budgets.map(budget => getBudgetStatus(budget));
  }, [budgets, getBudgetStatus]);

  const getBudgetAlert = useCallback((budgetStatus: BudgetStatus): string | null => {
    const { percentUsed, isOverBudget, budget, projectedSpending, daysRemaining } = budgetStatus;
    
    if (isOverBudget) {
      return `Budget exceeded for ${budget.category === 'total' ? 'Total' : budget.category}!`;
    }
    
    if (projectedSpending > budget.amount && daysRemaining > 0) {
      return `Projected to exceed budget for ${budget.category === 'total' ? 'Total' : budget.category} by ${((projectedSpending - budget.amount) / budget.amount * 100).toFixed(1)}%`;
    }
    
    for (const threshold of budget.alertThresholds.sort((a, b) => b - a)) {
      if (percentUsed >= threshold) {
        return `${threshold}% of budget used for ${budget.category === 'total' ? 'Total' : budget.category}`;
      }
    }
    
    return null;
  }, []);

  const getActiveAlerts = useCallback((): string[] => {
    const budgetStatuses = getAllBudgetStatuses();
    return budgetStatuses
      .map(status => getBudgetAlert(status))
      .filter((alert): alert is string => alert !== null);
  }, [getAllBudgetStatuses, getBudgetAlert]);

  const getBudgetAnalytics = useCallback((): BudgetAnalytics => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    }).reverse();

    const monthlyTrends = last12Months.map(month => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });
      
      const spent = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const budgeted = budgets
        .filter(budget => budget.period === 'monthly')
        .reduce((sum, budget) => sum + budget.amount, 0);
      
      return {
        month: month.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        budgeted,
        spent,
        saved: Math.max(0, budgeted - spent)
      };
    });

    const categoryPerformance = Array.from(new Set([...budgets.map(b => b.category), 'total'])).
      map(category => {
        const categoryBudgets = budgets.filter(b => b.category === category);
        const usageData = categoryBudgets.map(budget => {
          const status = getBudgetStatus(budget);
          return status.percentUsed;
        });
        
        const averageUsage = usageData.reduce((sum, usage) => sum + usage, 0) / usageData.length || 0;
        const consistency = 100 - (usageData.reduce((sum, usage) => sum + Math.abs(usage - averageUsage), 0) / usageData.length || 0);
        
        const trend: 'improving' | 'declining' | 'stable' = averageUsage < 80 ? 'improving' : averageUsage > 95 ? 'declining' : 'stable';
        
        return {
          category: category === 'total' ? 'Total' : category,
          averageUsage,
          consistency: Math.max(0, consistency),
          trend
        };
      });

    const lastMonth = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      const lastMonthStart = new Date();
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1, 1);
      const lastMonthEnd = new Date();
      lastMonthEnd.setDate(0);
      return expenseDate >= lastMonthStart && expenseDate <= lastMonthEnd;
    });

    const dailySpending = Array.from({ length: 7 }, (_, i) => {
      const dayExpenses = lastMonth.filter(expense => new Date(expense.date).getDay() === i);
      return {
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        average: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0) / Math.max(1, dayExpenses.length)
      };
    });

    const weeklySpending = Array.from({ length: 4 }, (_, i) => {
      const weekStart = 1 + i * 7;
      const weekEnd = Math.min(31, weekStart + 6);
      const weekExpenses = lastMonth.filter(expense => {
        const day = new Date(expense.date).getDate();
        return day >= weekStart && day <= weekEnd;
      });
      return {
        week: i + 1,
        average: weekExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      };
    });

    const recentSpending = expenses.slice(-30).reduce((sum, expense) => sum + expense.amount, 0);
    const nextMonthPrediction = recentSpending * 1.1;

    return {
      monthlyTrends,
      categoryPerformance,
      spendingPatterns: {
        dayOfWeek: dailySpending,
        weekOfMonth: weeklySpending
      },
      forecasting: {
        nextMonthPrediction,
        confidence: 75,
        factors: ['Recent spending patterns', 'Seasonal trends', 'Budget allocations']
      }
    };
  }, [budgets, expenses, getBudgetStatus]);

  const addCustomCategory = useCallback((category: Omit<CustomCategory, 'id'>) => {
    const newCategory: CustomCategory = {
      ...category,
      id: crypto.randomUUID()
    };
    storage.addCustomCategory(newCategory);
    setCustomCategories(prev => [...prev, newCategory]);
  }, []);

  const deleteCustomCategory = useCallback((id: string) => {
    storage.deleteCustomCategory(id);
    setCustomCategories(prev => prev.filter(cat => cat.id !== id));
  }, []);

  const addBudgetTemplate = useCallback((template: Omit<BudgetTemplate, 'id'>) => {
    const newTemplate: BudgetTemplate = {
      ...template,
      id: crypto.randomUUID()
    };
    storage.addBudgetTemplate(newTemplate);
    setBudgetTemplates(prev => [...prev, newTemplate]);
  }, []);

  const applyBudgetTemplate = useCallback((templateId: string) => {
    const template = budgetTemplates.find(t => t.id === templateId);
    if (!template) return;

    template.budgets.forEach(budgetData => {
      addBudget({
        ...budgetData,
        templateId
      });
    });
  }, [budgetTemplates, addBudget]);

  const exportBudgetData = useCallback(() => {
    const data = {
      budgets,
      customCategories,
      budgetTemplates,
      analytics: getBudgetAnalytics(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pennylane-budgets-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [budgets, customCategories, budgetTemplates, getBudgetAnalytics]);

  const adjustBudgetForRollover = useCallback((budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget || !budget.rolloverEnabled) return;

    const status = getBudgetStatus(budget);
    if (status.remaining > 0) {
      updateBudget(budgetId, {
        rolloverAmount: status.remaining
      });
    }
  }, [budgets, getBudgetStatus, updateBudget]);

  return {
    budgets,
    customCategories,
    budgetTemplates,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    getBudgetStatus,
    getAllBudgetStatuses,
    getActiveAlerts,
    getBudgetAnalytics,
    addCustomCategory,
    deleteCustomCategory,
    addBudgetTemplate,
    applyBudgetTemplate,
    exportBudgetData,
    adjustBudgetForRollover
  };
};