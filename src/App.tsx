import { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BackupRestore } from './components/BackupRestore';
import { BudgetManagement } from './components/BudgetManagement';
import { SmartAnalytics } from './components/SmartAnalytics';
import { useExpenses } from './hooks/useExpenses';
import { useBudgets } from './hooks/useBudgets';
import type { ExpenseFormData, Expense } from './types/expense';

function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'budgets' | 'analytics' | 'settings'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseStats,
    getRecentExpenses,
    loadExpenses
  } = useExpenses();

  const {
    loading: budgetsLoading,
    addBudget,
    updateBudget,
    deleteBudget,
    getAllBudgetStatuses,
    getActiveAlerts,
  } = useBudgets(expenses);

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

  if (loading || budgetsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        <ErrorBoundary>
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={getExpenseStats()}
              recentExpenses={getRecentExpenses()}
              budgetStatuses={getAllBudgetStatuses()}
              budgetAlerts={getActiveAlerts()}
              onAddExpense={handleAddExpense}
            />
          )}
        </ErrorBoundary>
        
        <ErrorBoundary>
          {activeTab === 'expenses' && (
            <ExpenseList
              expenses={expenses}
              onEditExpense={handleEditExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}
        </ErrorBoundary>

        <ErrorBoundary>
          {activeTab === 'budgets' && (
            <BudgetManagement
              budgetStatuses={getAllBudgetStatuses()}
              onAddBudget={addBudget}
              onUpdateBudget={updateBudget}
              onDeleteBudget={deleteBudget}
            />
          )}
        </ErrorBoundary>

        <ErrorBoundary>
          {activeTab === 'analytics' && <SmartAnalytics />}
        </ErrorBoundary>

        <ErrorBoundary>
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <BackupRestore onRestore={loadExpenses} />
            </div>
          )}
        </ErrorBoundary>

        <ErrorBoundary>
          {showForm && (
            <ExpenseForm
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              initialData={editingExpense || undefined}
              isEditing={!!editingExpense}
            />
          )}
        </ErrorBoundary>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;