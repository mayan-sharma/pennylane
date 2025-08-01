import React, { useState } from 'react';
import type { BudgetStatus, Expense } from '../types';

interface BudgetCalendarProps {
  budgetStatuses: BudgetStatus[];
  expenses: Expense[];
}

export const BudgetCalendar: React.FC<BudgetCalendarProps> = ({
  budgetStatuses,
  expenses
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getExpensesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return expenses.filter(expense => expense.date === dateStr);
  };

  const getTotalSpendingForDate = (date: Date) => {
    const dayExpenses = getExpensesForDate(date);
    return dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getBudgetStatusForDate = (date: Date) => {
    const daySpending = getTotalSpendingForDate(date);
    const monthlyBudgets = budgetStatuses.filter(status => status.budget.period === 'monthly');
    const totalMonthlyBudget = monthlyBudgets.reduce((sum, status) => sum + status.budget.amount, 0);
    
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const dailyBudgetTarget = totalMonthlyBudget / daysInMonth;
    
    if (daySpending === 0) return 'no-spending';
    if (daySpending <= dailyBudgetTarget * 0.5) return 'under-budget';
    if (daySpending <= dailyBudgetTarget) return 'on-budget';
    if (daySpending <= dailyBudgetTarget * 1.5) return 'over-budget';
    return 'way-over-budget';
  };

  const getDateColorClass = (date: Date) => {
    const status = getBudgetStatusForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
    
    let baseClass = 'w-full h-full flex flex-col items-center justify-center p-1 rounded cursor-pointer transition-colors ';
    
    if (isSelected) {
      baseClass += 'ring-2 ring-blue-500 ';
    }
    
    if (isToday) {
      baseClass += 'font-bold border-2 border-blue-600 ';
    }
    
    switch (status) {
      case 'no-spending':
        return baseClass + 'bg-gray-100 text-gray-400 hover:bg-gray-200';
      case 'under-budget':
        return baseClass + 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'on-budget':
        return baseClass + 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'over-budget':
        return baseClass + 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'way-over-budget':
        return baseClass + 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return baseClass + 'hover:bg-gray-100';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getWeeklySpending = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    const weekExpenses = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekExpenses.push(...getExpensesForDate(day));
    }
    
    return weekExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getMonthlyProgress = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    });
    
    const totalSpent = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalBudget = budgetStatuses
      .filter(status => status.budget.period === 'monthly')
      .reduce((sum, status) => sum + status.budget.amount, 0);
    
    return {
      spent: totalSpent,
      budget: totalBudget,
      percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    };
  };

  const days = getDaysInMonth(currentDate);
  const monthProgress = getMonthlyProgress();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Budget Calendar</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <h3 className="text-lg font-medium">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              →
            </button>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Monthly Progress</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(monthProgress.spent)} / {formatCurrency(monthProgress.budget)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                monthProgress.percentage > 100 ? 'bg-red-500' :
                monthProgress.percentage > 90 ? 'bg-orange-500' :
                monthProgress.percentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, monthProgress.percentage)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {monthProgress.percentage.toFixed(1)}% of monthly budget used
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <div key={index} className="aspect-square">
              {date ? (
                <div
                  className={getDateColorClass(date)}
                  onClick={() => setSelectedDate(date)}
                >
                  <span className="text-sm">{date.getDate()}</span>
                  <span className="text-xs">
                    {formatCurrency(getTotalSpendingForDate(date)).replace('₹', '₹')}
                  </span>
                </div>
              ) : (
                <div className="w-full h-full"></div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-4 space-x-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-100 rounded mr-1"></div>
            <span>No spending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
            <span>Under budget</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 rounded mr-1"></div>
            <span>On budget</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 rounded mr-1"></div>
            <span>Over budget</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 rounded mr-1"></div>
            <span>Way over</span>
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Daily Expenses</h4>
              <div className="space-y-2">
                {getExpensesForDate(selectedDate).length > 0 ? (
                  getExpensesForDate(selectedDate).map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium text-sm">{expense.description}</span>
                        <span className="text-xs text-gray-500 block">{expense.category}</span>
                      </div>
                      <span className="font-medium">{formatCurrency(expense.amount)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No expenses on this day</p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center font-medium">
                  <span>Total Daily Spending:</span>
                  <span className="text-lg">{formatCurrency(getTotalSpendingForDate(selectedDate))}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Weekly Context</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Week total:</span>
                  <span>{formatCurrency(getWeeklySpending(selectedDate))}</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily average this week:</span>
                  <span>{formatCurrency(getWeeklySpending(selectedDate) / 7)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Monthly target per day:</span>
                  <span>{formatCurrency(monthProgress.budget / new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate())}</span>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded">
                <h5 className="font-medium text-blue-800 mb-1">Budget Insight</h5>
                <p className="text-sm text-blue-700">
                  {getBudgetStatusForDate(selectedDate) === 'no-spending' && 'Great job on a no-spend day!'}
                  {getBudgetStatusForDate(selectedDate) === 'under-budget' && 'Excellent! You\'re under your daily budget target.'}
                  {getBudgetStatusForDate(selectedDate) === 'on-budget' && 'Right on track with your daily budget target.'}
                  {getBudgetStatusForDate(selectedDate) === 'over-budget' && 'Slightly over your daily target. Consider adjusting tomorrow.'}
                  {getBudgetStatusForDate(selectedDate) === 'way-over-budget' && 'Significantly over budget. Review your spending patterns.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};