import React, { useState } from 'react';
import type { DebtPayoffGoal, DebtPayment } from '../types/expense';

interface DebtPayoffTrackerProps {
  debtGoals: DebtPayoffGoal[];
  onAddDebtGoal: (goal: Omit<DebtPayoffGoal, 'id' | 'createdAt' | 'updatedAt' | 'paymentHistory'>) => void;
  onUpdateDebtGoal: (id: string, updates: Partial<DebtPayoffGoal>) => void;
  onDeleteDebtGoal: (id: string) => void;
  onAddPayment: (debtId: string, payment: Omit<DebtPayment, 'id'>) => void;
}

export const DebtPayoffTracker: React.FC<DebtPayoffTrackerProps> = ({
  debtGoals,
  onAddDebtGoal,
  onUpdateDebtGoal,
  onDeleteDebtGoal,
  onAddPayment
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'strategy'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<DebtPayoffGoal | null>(null);
  const [paymentForm, setPaymentForm] = useState<{debtId: string; amount: string} | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    totalAmount: '',
    currentBalance: '',
    interestRate: '',
    minimumPayment: '',
    targetDate: '',
    strategy: 'snowball' as const,
    priority: 1
  });

  const totalDebt = debtGoals.reduce((sum, goal) => sum + goal.currentBalance, 0);
  const totalPaid = debtGoals.reduce((sum, goal) => sum + (goal.totalAmount - goal.currentBalance), 0);
  const monthlyPayments = debtGoals.reduce((sum, goal) => sum + goal.minimumPayment, 0);

  const calculatePayoffOrder = (strategy: 'snowball' | 'avalanche') => {
    return [...debtGoals].sort((a, b) => {
      if (strategy === 'snowball') {
        return a.currentBalance - b.currentBalance;
      } else {
        return b.interestRate - a.interestRate;
      }
    });
  };

  const calculateTimeToPayoff = (goal: DebtPayoffGoal) => {
    const monthlyPayment = goal.minimumPayment;
    const monthlyRate = goal.interestRate / 100 / 12;
    
    if (monthlyRate === 0) {
      return Math.ceil(goal.currentBalance / monthlyPayment);
    }
    
    const months = Math.log(1 + (goal.currentBalance * monthlyRate) / monthlyPayment) / Math.log(1 + monthlyRate);
    return Math.ceil(months);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData = {
      name: formData.name,
      totalAmount: parseFloat(formData.totalAmount),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate),
      minimumPayment: parseFloat(formData.minimumPayment),
      targetDate: formData.targetDate || undefined,
      strategy: formData.strategy,
      priority: formData.priority,
      paymentHistory: []
    };

    if (editingGoal) {
      onUpdateDebtGoal(editingGoal.id, goalData);
    } else {
      onAddDebtGoal(goalData);
    }

    setShowForm(false);
    setEditingGoal(null);
    setFormData({
      name: '',
      totalAmount: '',
      currentBalance: '',
      interestRate: '',
      minimumPayment: '',
      targetDate: '',
      strategy: 'snowball',
      priority: 1
    });
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm) return;

    const amount = parseFloat(paymentForm.amount);
    const goal = debtGoals.find(g => g.id === paymentForm.debtId);
    if (!goal) return;

    const monthlyRate = goal.interestRate / 100 / 12;
    const interest = goal.currentBalance * monthlyRate;
    const principal = Math.max(0, amount - interest);
    const remainingBalance = Math.max(0, goal.currentBalance - principal);

    const payment: Omit<DebtPayment, 'id'> = {
      amount,
      date: new Date().toISOString().split('T')[0],
      principal,
      interest,
      remainingBalance
    };

    onAddPayment(paymentForm.debtId, payment);
    onUpdateDebtGoal(paymentForm.debtId, { currentBalance: remainingBalance });
    
    setPaymentForm(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Debt Payoff Tracker</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Debt Goal
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'goals', 'strategy'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md flex-1 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-sm font-medium text-red-800">Total Debt</h3>
              <p className="text-2xl font-bold text-red-900">₹{totalDebt.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Total Paid</h3>
              <p className="text-2xl font-bold text-green-900">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Monthly Payments</h3>
              <p className="text-2xl font-bold text-blue-900">₹{monthlyPayments.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Active Goals</h3>
              <p className="text-2xl font-bold text-purple-900">{debtGoals.length}</p>
            </div>
          </div>

          {/* Debt Goals List */}
          <div className="space-y-4">
            {debtGoals.map((goal) => {
              const progress = ((goal.totalAmount - goal.currentBalance) / goal.totalAmount) * 100;
              const timeToPayoff = calculateTimeToPayoff(goal);
              
              return (
                <div key={goal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{goal.name}</h3>
                      <p className="text-sm text-gray-600">{goal.interestRate}% APR</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setPaymentForm({debtId: goal.id, amount: ''})}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Add Payment
                      </button>
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setFormData({
                            name: goal.name,
                            totalAmount: goal.totalAmount.toString(),
                            currentBalance: goal.currentBalance.toString(),
                            interestRate: goal.interestRate.toString(),
                            minimumPayment: goal.minimumPayment.toString(),
                            targetDate: goal.targetDate || '',
                            strategy: goal.strategy,
                            priority: goal.priority
                          });
                          setShowForm(true);
                        }}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>₹{(goal.totalAmount - goal.currentBalance).toLocaleString()} paid</span>
                      <span>₹{goal.currentBalance.toLocaleString()} remaining</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{progress.toFixed(1)}% complete</span>
                      <span>{timeToPayoff} months to payoff</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Minimum Payment: ₹{goal.minimumPayment.toLocaleString()} | 
                    Strategy: {goal.strategy.charAt(0).toUpperCase() + goal.strategy.slice(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {debtGoals.map((goal) => (
            <div key={goal.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{goal.name}</h3>
                <button
                  onClick={() => onDeleteDebtGoal(goal.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
              
              {goal.paymentHistory.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Payment History</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {goal.paymentHistory.slice(-5).map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                        <span>{payment.date}</span>
                        <span>₹{payment.amount.toLocaleString()}</span>
                        <span className="text-gray-600">Balance: ₹{payment.remainingBalance.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Strategy Tab */}
      {activeTab === 'strategy' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Snowball Method</h3>
              <p className="text-sm text-gray-600 mb-4">Pay minimums on all debts, put extra toward smallest balance first.</p>
              <div className="space-y-2">
                {calculatePayoffOrder('snowball').map((goal, index) => (
                  <div key={goal.id} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                    <span className="font-medium">{index + 1}. {goal.name}</span>
                    <span className="text-sm">₹{goal.currentBalance.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Avalanche Method</h3>
              <p className="text-sm text-gray-600 mb-4">Pay minimums on all debts, put extra toward highest interest rate first.</p>
              <div className="space-y-2">
                {calculatePayoffOrder('avalanche').map((goal, index) => (
                  <div key={goal.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                    <span className="font-medium">{index + 1}. {goal.name}</span>
                    <span className="text-sm">{goal.interestRate}% APR</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Goal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingGoal ? 'Edit Debt Goal' : 'Add New Debt Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Debt Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <input
                    type="number"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Balance</label>
                  <input
                    type="number"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData({...formData, currentBalance: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payment</label>
                  <input
                    type="number"
                    value={formData.minimumPayment}
                    onChange={(e) => setFormData({...formData, minimumPayment: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strategy</label>
                <select
                  value={formData.strategy}
                  onChange={(e) => setFormData({...formData, strategy: e.target.value as 'snowball' | 'avalanche'})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="snowball">Snowball (Smallest Balance First)</option>
                  <option value="avalanche">Avalanche (Highest Interest First)</option>
                  <option value="custom">Custom Priority</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Form */}
      {paymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Add Payment</h3>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Add Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentForm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};