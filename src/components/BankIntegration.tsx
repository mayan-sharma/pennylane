import React, { useState, useEffect, useCallback } from 'react';
import { 
  bankIntegrationService, 
  type BankConnection, 
  type BankTransaction, 
  type TransactionMatchResult,
  type SyncResult 
} from '../services/bankIntegrationService';
import { type Expense } from '../types';
import { formatCurrency } from '../utils/formatters';

interface BankIntegrationProps {
  expenses: Expense[];
  onExpensesCreated: (expenses: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
  onExpenseUpdated: (expenseId: string, updates: Partial<Expense>) => void;
}

export const BankIntegration: React.FC<BankIntegrationProps> = ({
  expenses,
  onExpensesCreated,
  onExpenseUpdated
}) => {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);
  const [matchResults, setMatchResults] = useState<TransactionMatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showMatchReview, setShowMatchReview] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = useCallback(() => {
    const bankConnections = bankIntegrationService.getConnections();
    setConnections(bankConnections);
  }, []);

  const handleConnectBank = async (provider: 'plaid' | 'yodlee' | 'open_banking') => {
    setLoading(true);
    try {
      await bankIntegrationService.connectBank(provider);
      loadConnections();
    } catch (error) {
      console.error('Failed to connect bank:', error);
      alert(`Failed to connect to ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectBank = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect this bank? This will remove all account information.')) {
      return;
    }

    try {
      await bankIntegrationService.disconnectBank(connectionId);
      loadConnections();
    } catch (error) {
      console.error('Failed to disconnect bank:', error);
      alert('Failed to disconnect bank');
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const results = await bankIntegrationService.syncAllAccounts();
      setSyncResults(results);
      
      // Get all new transactions
      const allTransactions = results.flatMap(r => r.transactions);
      
      if (allTransactions.length > 0) {
        // Match transactions to existing expenses
        const matches = await bankIntegrationService.matchTransactionsToExpenses(
          allTransactions,
          expenses
        );
        setMatchResults(matches);
        setShowMatchReview(true);
      } else {
        alert('No new transactions found');
      }
      
      loadConnections();
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleApproveMatches = async () => {
    const selectedMatches = matchResults.filter(m => 
      selectedTransactions.has(m.transaction.id) && m.suggestedAction === 'create'
    );

    if (selectedMatches.length === 0) {
      alert('No transactions selected for import');
      return;
    }

    try {
      const newExpenses = await bankIntegrationService.createExpensesFromTransactions(selectedMatches);
      onExpensesCreated(newExpenses);
      
      // Update merge suggestions
      const mergeMatches = matchResults.filter(m => 
        selectedTransactions.has(m.transaction.id) && m.suggestedAction === 'merge' && m.existingExpense
      );

      for (const match of mergeMatches) {
        if (match.existingExpense) {
          onExpenseUpdated(match.existingExpense.id, {
            tags: [...(match.existingExpense.tags || []), 'bank-verified'],
            notes: (match.existingExpense.notes || '') + '\nVerified with bank transaction',
          });
        }
      }

      setShowMatchReview(false);
      setSelectedTransactions(new Set());
      setMatchResults([]);
      
      alert(`Successfully imported ${newExpenses.length} expenses and updated ${mergeMatches.length} existing expenses`);
    } catch (error) {
      console.error('Failed to create expenses:', error);
      alert('Failed to import expenses');
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getConnectionStatusColor = (status: BankConnection['status']) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      case 'requires_auth': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getActionColor = (action: TransactionMatchResult['suggestedAction']) => {
    switch (action) {
      case 'create': return 'text-blue-600 bg-blue-100';
      case 'merge': return 'text-green-600 bg-green-100';
      case 'ignore': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleTransactionSelection = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const selectAllTransactions = () => {
    const allIds = matchResults.map(m => m.transaction.id);
    setSelectedTransactions(new Set(allIds));
  };

  const deselectAllTransactions = () => {
    setSelectedTransactions(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Bank Connections</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => handleConnectBank('plaid')}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Connecting...' : 'Connect Bank'}
            </button>
            <button
              onClick={handleSyncAll}
              disabled={syncing || connections.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync All'}
            </button>
          </div>
        </div>

        {/* Connected Banks */}
        {connections.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Connections</h3>
            <p className="text-gray-500 mb-4">
              Connect your bank accounts to automatically import transactions and create expenses.
            </p>
            <button
              onClick={() => handleConnectBank('plaid')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Connect Your First Bank
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{connection.institutionName}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getConnectionStatusColor(connection.status)}`}>
                        {connection.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {connection.provider.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnectBank(connection.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Disconnect
                  </button>
                </div>

                {connection.errorMessage && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{connection.errorMessage}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connection.accounts.map((account) => (
                    <div key={account.id} className="bg-gray-50 rounded-md p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{account.name}</h4>
                        <span className="text-xs text-gray-500">•••• {account.mask}</span>
                      </div>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(account.balance.current, account.balance.currency)}
                      </p>
                      {account.balance.available !== null && (
                        <p className="text-sm text-gray-600">
                          Available: {formatCurrency(account.balance.available, account.balance.currency)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Last sync: {account.lastSyncDate ? formatDate(account.lastSyncDate) : 'Never'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Results */}
      {syncResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Last Sync Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {syncResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {result.success ? '✅ Success' : '❌ Failed'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatDate(result.lastSyncDate)}
                  </span>
                </div>
                {result.success ? (
                  <div className="space-y-1 text-sm">
                    <p>New: {result.newTransactionsCount}</p>
                    <p>Duplicates: {result.duplicateCount}</p>
                  </div>
                ) : (
                  <div className="text-sm text-red-700">
                    {result.errors.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction Matching Review */}
      {showMatchReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Review Bank Transactions</h2>
                <div className="flex space-x-3">
                  <button
                    onClick={selectAllTransactions}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllTransactions}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => setShowMatchReview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Review {matchResults.length} transactions and select which ones to import or merge.
              </p>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.size === matchResults.length}
                        onChange={() => selectedTransactions.size === matchResults.length ? deselectAllTransactions() : selectAllTransactions()}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Match</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {matchResults.map((match) => (
                    <tr key={match.transaction.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTransactions.has(match.transaction.id)}
                          onChange={() => toggleTransactionSelection(match.transaction.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {formatDate(match.transaction.date)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {formatCurrency(match.transaction.amount, match.transaction.currency)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {match.transaction.merchantName || '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 max-w-xs truncate">
                        {match.transaction.description}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(match.suggestedAction)}`}>
                          {match.suggestedAction}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {match.matchType === 'exact' && (
                          <span className="text-green-600 font-medium">Exact match</span>
                        )}
                        {match.matchType === 'fuzzy' && (
                          <span className="text-yellow-600">
                            {Math.round(match.confidence * 100)}% match
                          </span>
                        )}
                        {match.matchType === 'none' && (
                          <span className="text-gray-500">New transaction</span>
                        )}
                        {match.existingExpense && (
                          <div className="text-xs text-gray-500 mt-1">
                            {match.existingExpense.description}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {selectedTransactions.size} of {matchResults.length} transactions selected
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowMatchReview(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApproveMatches}
                    disabled={selectedTransactions.size === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Import Selected ({selectedTransactions.size})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg className="w-6 h-6 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">Bank Integration Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Automatic Import</h4>
                <ul className="space-y-1">
                  <li>• Real-time transaction syncing</li>
                  <li>• Smart duplicate detection</li>
                  <li>• Automatic categorization</li>
                  <li>• Merchant name cleanup</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Smart Matching</h4>
                <ul className="space-y-1">
                  <li>• Fuzzy matching with existing expenses</li>
                  <li>• Confidence scoring</li>
                  <li>• Manual review and approval</li>
                  <li>• Bulk import capabilities</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 rounded-md">
              <p className="text-sm text-blue-700">
                <strong>Security:</strong> All bank connections use bank-level encryption and are processed through secure, 
                regulated financial data providers. Your login credentials are never stored on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};