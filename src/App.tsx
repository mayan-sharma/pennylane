import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useExpenses } from './hooks/useExpenses';
import { AppSettingsProvider, useAppSettings } from './hooks/useAppSettings';
import { usePersistentState, useSessionState } from './hooks/usePersistentState';
import type { Expense } from './types';

function AppContent() {
  const { settings } = useAppSettings();
  
  const [activeTab, setActiveTab] = usePersistentState('active-tab', settings.defaultTab, {
    syncAcrossTabs: true
  });
  
  const [showForm, setShowForm] = useSessionState('show-form', false);
  const [editingExpense, setEditingExpense] = useSessionState<Expense | null>('editing-expense', null);

  const {
    expenses,
    loading,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpenseStats,
    getRecentExpenses,
  } = useExpenses();

  const handleAddExpense = () => {
    setEditingExpense(null);
    setShowForm(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleFormSubmit = (data: any) => {
    const expenseData = {
      date: data.date,
      amount: parseFloat(data.amount),
      category: data.category,
      description: data.description
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    const confirmDelete = settings.requireConfirmation ? 
      window.confirm('Are you sure you want to delete this expense?') : true;
    
    if (confirmDelete) {
      deleteExpense(id);
    }
  };

  if (loading) {
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
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <div className="bg-white p-6 rounded-lg shadow-sm border">
                <p className="text-gray-600">Settings functionality coming soon...</p>
              </div>
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

function App() {
  return (
    <AppSettingsProvider>
      <AppContent />
    </AppSettingsProvider>
  );
}

export default App;