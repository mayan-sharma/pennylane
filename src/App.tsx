import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { useExpenses } from './hooks/useExpenses';
import type { ExpenseFormData, Expense } from './types/expense';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseStats,
    getRecentExpenses
  } = useExpenses();

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleFormSubmit = (data: ExpenseFormData) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, {
        ...editingExpense,
        date: data.date,
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
      });
    } else {
      addExpense({
        date: data.date,
        amount: parseFloat(data.amount),
        category: data.category,
        description: data.description,
      });
    }
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && (
        <Dashboard
          stats={getExpenseStats()}
          recentExpenses={getRecentExpenses()}
          onAddExpense={handleAddExpense}
        />
      )}
      
      {activeTab === 'expenses' && (
        <ExpenseList
          expenses={expenses}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
        />
      )}

      {showForm && (
        <ExpenseForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          initialData={editingExpense || undefined}
          isEditing={!!editingExpense}
        />
      )}
    </Layout>
  );
}

export default App;