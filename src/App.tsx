import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseForm } from './components/ExpenseForm';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BackupRestore } from './components/BackupRestore';
import { BudgetManagement } from './components/budget';
import { useExpenses } from './hooks/useExpenses';
import { useBudgets } from './hooks/useBudgets';
import { AppSettingsProvider, useAppSettings } from './hooks/useAppSettings';
import { usePersistentState, useSessionState } from './hooks/usePersistentState';
import { stateManager } from './utils/stateManager';
import type { Expense } from './types';

// Internal App component that uses settings
function AppContent() {
  const { settings } = useAppSettings();
  
  // Use persistent state for UI state
  const [activeTab, setActiveTab] = usePersistentState('active-tab', settings.defaultTab, {
    syncAcrossTabs: true
  });
  
  // Use session state for temporary form state
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
    loadExpenses
  } = useExpenses();

  const {
    budgets,
    customCategories,
    budgetTemplates,
    loading: budgetsLoading,
    addBudget,
    updateBudget,
    deleteBudget,
    getAllBudgetStatuses,
    getBudgetAnalytics,
    addCustomCategory,
    addBudgetTemplate,
    applyBudgetTemplate,
    exportBudgetData
  } = useBudgets(expenses);

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
      description: data.description,
      merchant: data.merchant,
      tags: data.tags,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      currency: data.currency,
      receipts: data.receipts
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        ...editingExpense,
        ...expenseData
      });
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

  // Initialize state manager and cleanup
  useEffect(() => {
    // Create initial snapshot
    stateManager.createSnapshot('app-start');
    
    // Cleanup expired data on app start
    const cleanedItems = stateManager.cleanup();
    if (cleanedItems > 0) {
      console.log(`Cleaned up ${cleanedItems} expired items`);
    }
    
    // Optimize storage if needed
    stateManager.optimizeStorage().then(result => {
      if (result.itemsCompressed > 0 || result.itemsRemoved > 0) {
        console.log('Storage optimized:', result);
      }
    });
  }, []);

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
              allExpenses={expenses}
              budgetStatuses={getAllBudgetStatuses()}
              onAddExpense={handleAddExpense}
              onDismissAlert={(alertId) => console.log('Dismiss alert:', alertId)}
              onSnoozeAlert={(alertId, hours) => console.log('Snooze alert:', alertId, 'for', hours, 'hours')}
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
              budgetTemplates={budgetTemplates}
              customCategories={customCategories}
              analytics={getBudgetAnalytics()}
              expenses={expenses}
              onAddBudget={addBudget}
              onUpdateBudget={updateBudget}
              onDeleteBudget={deleteBudget}
              onApplyTemplate={applyBudgetTemplate}
              onCreateTemplate={addBudgetTemplate}
              onAddCustomCategory={addCustomCategory}
              onExportData={exportBudgetData}
              onBulkOperation={(operation, budgetIds, adjustment) => {
                if (operation === 'delete') {
                  budgetIds.forEach(id => deleteBudget(id));
                } else if (operation === 'adjust' && adjustment) {
                  budgetIds.forEach(id => {
                    const budget = budgets.find(b => b.id === id);
                    if (budget) {
                      updateBudget(id, {
                        amount: budget.amount * (1 + adjustment / 100)
                      });
                    }
                  });
                }
              }}
            />
          )}
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

// Main App component with settings provider
function App() {
  return (
    <AppSettingsProvider>
      <AppContent />
    </AppSettingsProvider>
  );
}

export default App;