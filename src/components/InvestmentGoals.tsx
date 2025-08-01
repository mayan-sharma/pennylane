import React, { useState } from 'react';
import type { InvestmentGoal, InvestmentMilestone } from '../types';

interface InvestmentGoalsProps {
  investmentGoals: InvestmentGoal[];
  onAddGoal: (goal: Omit<InvestmentGoal, 'id' | 'createdAt' | 'updatedAt' | 'milestones'>) => void;
  onUpdateGoal: (id: string, updates: Partial<InvestmentGoal>) => void;
  onDeleteGoal: (id: string) => void;
  onAddMilestone: (goalId: string, milestone: Omit<InvestmentMilestone, 'id'>) => void;
  onUpdateContribution: (goalId: string, amount: number) => void;
}

export const InvestmentGoals: React.FC<InvestmentGoalsProps> = ({
  investmentGoals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onAddMilestone,
  onUpdateContribution
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'milestones'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<InvestmentGoal | null>(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState<string | null>(null);
  const [contributionForm, setContributionForm] = useState<{goalId: string; amount: string} | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    monthlyContribution: '',
    riskTolerance: 'moderate' as const,
    category: 'retirement' as const,
    autoInvest: false,
    linkedBudgetId: ''
  });

  const [milestoneData, setMilestoneData] = useState({
    targetAmount: '',
    targetDate: '',
    description: '',
    reward: ''
  });

  const totalInvestmentTarget = investmentGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = investmentGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalMonthlyContributions = investmentGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0);

  const calculateTimeToGoal = (goal: InvestmentGoal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    if (goal.monthlyContribution <= 0) return 'N/A';
    
    // Simple calculation without compound interest for now
    const months = Math.ceil(remaining / goal.monthlyContribution);
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years > 0) {
      return `${years}y ${remainingMonths}m`;
    }
    return `${months}m`;
  };

  const calculateProjectedGrowth = (goal: InvestmentGoal) => {
    // Simple compound interest calculation
    const annualReturn = goal.riskTolerance === 'conservative' ? 0.06 : 
                        goal.riskTolerance === 'moderate' ? 0.08 : 0.10;
    const monthlyReturn = annualReturn / 12;
    const targetDate = new Date(goal.targetDate);
    const monthsToTarget = Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
    
    let projectedAmount = goal.currentAmount;
    for (let i = 0; i < monthsToTarget; i++) {
      projectedAmount = (projectedAmount + goal.monthlyContribution) * (1 + monthlyReturn);
    }
    
    return projectedAmount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData = {
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      targetDate: formData.targetDate,
      monthlyContribution: parseFloat(formData.monthlyContribution) || 0,
      riskTolerance: formData.riskTolerance,
      category: formData.category,
      autoInvest: formData.autoInvest,
      linkedBudgetId: formData.linkedBudgetId || undefined,
      milestones: []
    };

    if (editingGoal) {
      onUpdateGoal(editingGoal.id, goalData);
    } else {
      onAddGoal(goalData);
    }

    setShowForm(false);
    setEditingGoal(null);
    resetForm();
  };

  const handleMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMilestoneForm) return;

    const milestone = {
      targetAmount: parseFloat(milestoneData.targetAmount),
      targetDate: milestoneData.targetDate,
      description: milestoneData.description,
      achieved: false,
      reward: milestoneData.reward || undefined
    };

    onAddMilestone(showMilestoneForm, milestone);
    setShowMilestoneForm(null);
    setMilestoneData({
      targetAmount: '',
      targetDate: '',
      description: '',
      reward: ''
    });
  };

  const handleContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributionForm) return;

    const amount = parseFloat(contributionForm.amount);
    onUpdateContribution(contributionForm.goalId, amount);
    setContributionForm(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      targetDate: '',
      monthlyContribution: '',
      riskTolerance: 'moderate',
      category: 'retirement',
      autoInvest: false,
      linkedBudgetId: ''
    });
  };

  const getRiskColor = (riskTolerance: string) => {
    switch (riskTolerance) {
      case 'conservative': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'aggressive': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Investment Goals</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Add Investment Goal
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'goals', 'milestones'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md flex-1 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-green-600 shadow-sm'
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
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Total Target</h3>
              <p className="text-2xl font-bold text-green-900">₹{totalInvestmentTarget.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Current Value</h3>
              <p className="text-2xl font-bold text-blue-900">₹{totalCurrentAmount.toLocaleString()}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Monthly Contributions</h3>
              <p className="text-2xl font-bold text-purple-900">₹{totalMonthlyContributions.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800">Active Goals</h3>
              <p className="text-2xl font-bold text-yellow-900">{investmentGoals.length}</p>
            </div>
          </div>

          {/* Investment Goals List */}
          <div className="space-y-4">
            {investmentGoals.map((goal) => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const projectedGrowth = calculateProjectedGrowth(goal);
              const timeToGoal = calculateTimeToGoal(goal);
              const nextMilestone = goal.milestones.find(m => !m.achieved && m.targetAmount > goal.currentAmount);
              
              return (
                <div key={goal.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{goal.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(goal.riskTolerance)}`}>
                          {goal.riskTolerance.charAt(0).toUpperCase() + goal.riskTolerance.slice(1)} Risk
                        </span>
                        <span className="text-sm text-gray-600 capitalize">{goal.category}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setContributionForm({goalId: goal.id, amount: ''})}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Add Contribution
                      </button>
                      <button
                        onClick={() => setShowMilestoneForm(goal.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Add Milestone
                      </button>
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setFormData({
                            name: goal.name,
                            targetAmount: goal.targetAmount.toString(),
                            currentAmount: goal.currentAmount.toString(),
                            targetDate: goal.targetDate,
                            monthlyContribution: goal.monthlyContribution.toString(),
                            riskTolerance: goal.riskTolerance,
                            category: goal.category,
                            autoInvest: goal.autoInvest,
                            linkedBudgetId: goal.linkedBudgetId || ''
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
                      <span>₹{goal.currentAmount.toLocaleString()} invested</span>
                      <span>₹{(goal.targetAmount - goal.currentAmount).toLocaleString()} remaining</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{progress.toFixed(1)}% complete</span>
                      <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Monthly:</span>
                      <span className="font-medium ml-1">₹{goal.monthlyContribution.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Time to Goal:</span>
                      <span className="font-medium ml-1">{timeToGoal}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Projected:</span>
                      <span className="font-medium ml-1">₹{projectedGrowth.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Auto-Invest:</span>
                      <span className="font-medium ml-1">{goal.autoInvest ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  {nextMilestone && (
                    <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                      <span className="text-sm text-blue-800">
                        Next Milestone: {nextMilestone.description} (₹{nextMilestone.targetAmount.toLocaleString()})
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          {investmentGoals.map((goal) => (
            <div key={goal.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{goal.name}</h3>
                <button
                  onClick={() => onDeleteGoal(goal.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Target Amount:</span>
                  <p className="font-medium">₹{goal.targetAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Current Amount:</span>
                  <p className="font-medium">₹{goal.currentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Target Date:</span>
                  <p className="font-medium">{new Date(goal.targetDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Monthly Contribution:</span>
                  <p className="font-medium">₹{goal.monthlyContribution.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Risk Tolerance:</span>
                  <p className="font-medium capitalize">{goal.riskTolerance}</p>
                </div>
                <div>
                  <span className="text-gray-600">Category:</span>
                  <p className="font-medium capitalize">{goal.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <div className="space-y-6">
          {investmentGoals.map((goal) => (
            <div key={goal.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">{goal.name} - Milestones</h3>
              {goal.milestones.length > 0 ? (
                <div className="space-y-2">
                  {goal.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        milestone.achieved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      } border`}
                    >
                      <div>
                        <p className="font-medium">{milestone.description}</p>
                        <p className="text-sm text-gray-600">
                          ₹{milestone.targetAmount.toLocaleString()} by {new Date(milestone.targetDate).toLocaleDateString()}
                        </p>
                        {milestone.reward && (
                          <p className="text-sm text-blue-600">Reward: {milestone.reward}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {milestone.achieved ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Achieved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No milestones set yet.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Goal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingGoal ? 'Edit Investment Goal' : 'Add New Investment Goal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount</label>
                  <input
                    type="number"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({...formData, currentAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Contribution</label>
                  <input
                    type="number"
                    value={formData.monthlyContribution}
                    onChange={(e) => setFormData({...formData, monthlyContribution: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Risk Tolerance</label>
                  <select
                    value={formData.riskTolerance}
                    onChange={(e) => setFormData({...formData, riskTolerance: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="retirement">Retirement</option>
                    <option value="emergency">Emergency Fund</option>
                    <option value="education">Education</option>
                    <option value="house">House</option>
                    <option value="vacation">Vacation</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoInvest"
                  checked={formData.autoInvest}
                  onChange={(e) => setFormData({...formData, autoInvest: e.target.checked})}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="autoInvest" className="ml-2 block text-sm text-gray-900">
                  Enable auto-invest
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  {editingGoal ? 'Update Goal' : 'Add Goal'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                    resetForm();
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

      {/* Add Milestone Form */}
      {showMilestoneForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Milestone</h3>
            <form onSubmit={handleMilestoneSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={milestoneData.description}
                  onChange={(e) => setMilestoneData({...milestoneData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount</label>
                  <input
                    type="number"
                    value={milestoneData.targetAmount}
                    onChange={(e) => setMilestoneData({...milestoneData, targetAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={milestoneData.targetDate}
                    onChange={(e) => setMilestoneData({...milestoneData, targetDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reward (Optional)</label>
                <input
                  type="text"
                  value={milestoneData.reward}
                  onChange={(e) => setMilestoneData({...milestoneData, reward: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dinner at favorite restaurant"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Add Milestone
                </button>
                <button
                  type="button"
                  onClick={() => setShowMilestoneForm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution Form */}
      {contributionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Add Contribution</h3>
            <form onSubmit={handleContribution} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contribution Amount</label>
                <input
                  type="number"
                  value={contributionForm.amount}
                  onChange={(e) => setContributionForm({...contributionForm, amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Add Contribution
                </button>
                <button
                  type="button"
                  onClick={() => setContributionForm(null)}
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