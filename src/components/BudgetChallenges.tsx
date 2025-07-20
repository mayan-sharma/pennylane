import React, { useState } from 'react';
import type { BudgetChallenge, ChallengeParticipant, LeaderboardEntry } from '../types/expense';

interface BudgetChallengesProps {
  challenges: BudgetChallenge[];
  currentUserId: string;
  currentUsername: string;
  onCreateChallenge: (challenge: Omit<BudgetChallenge, 'id' | 'participants' | 'leaderboard'>) => void;
  onJoinChallenge: (challengeId: string) => void;
  onLeaveChallenge: (challengeId: string) => void;
  onUpdateProgress: (challengeId: string, progress: number) => void;
}

export const BudgetChallenges: React.FC<BudgetChallengesProps> = ({
  challenges,
  currentUserId,
  currentUsername,
  onCreateChallenge,
  onJoinChallenge,
  onLeaveChallenge,
  onUpdateProgress
}) => {
  const [activeTab, setActiveTab] = useState<'discover' | 'participating' | 'completed' | 'leaderboard'>('discover');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'saving' as const,
    startDate: '',
    endDate: '',
    targetAmount: '',
    targetCategory: '',
    streakDays: '',
    spendingLimit: '',
    customRules: [''],
    rewards: [{ type: 'points' as const, value: 100, description: 'Winner gets 100 points', rank: 1 }],
    isPublic: true
  });

  const availableChallenges = challenges.filter(c => 
    c.status === 'active' && 
    !c.participants.some(p => p.userId === currentUserId)
  );
  
  const participatingChallenges = challenges.filter(c => 
    c.participants.some(p => p.userId === currentUserId) && 
    c.status === 'active'
  );
  
  const completedChallenges = challenges.filter(c => 
    c.participants.some(p => p.userId === currentUserId) && 
    c.status === 'completed'
  );

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'saving': return '💰';
      case 'spending_limit': return '🎯';
      case 'category_focus': return '📊';
      case 'streak': return '🔥';
      case 'social': return '👥';
      default: return '🏆';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getUserRank = (challenge: BudgetChallenge) => {
    const participant = challenge.participants.find(p => p.userId === currentUserId);
    return participant?.rank || challenge.participants.length + 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const challengeData = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      rules: {
        targetAmount: formData.targetAmount ? parseFloat(formData.targetAmount) : undefined,
        targetCategory: formData.targetCategory || undefined,
        streakDays: formData.streakDays ? parseInt(formData.streakDays) : undefined,
        spendingLimit: formData.spendingLimit ? parseFloat(formData.spendingLimit) : undefined,
        customRules: formData.customRules.filter(rule => rule.trim())
      },
      rewards: formData.rewards,
      status: 'upcoming' as const,
      createdBy: currentUserId,
      isPublic: formData.isPublic
    };

    onCreateChallenge(challengeData);
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'saving',
      startDate: '',
      endDate: '',
      targetAmount: '',
      targetCategory: '',
      streakDays: '',
      spendingLimit: '',
      customRules: [''],
      rewards: [{ type: 'points', value: 100, description: 'Winner gets 100 points', rank: 1 }],
      isPublic: true
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Budget Challenges</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          Create Challenge
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['discover', 'participating', 'completed', 'leaderboard'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md flex-1 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Discover Tab */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold mb-2 text-purple-800">Featured Challenges</h3>
            <p className="text-sm text-purple-700">Join challenges to compete with friends and stay motivated!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableChallenges.map((challenge) => (
              <div key={challenge.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="text-2xl">{getChallengeIcon(challenge.type)}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{challenge.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium capitalize">{challenge.type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Participants:</span>
                    <span className="font-medium">{challenge.participants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{getDaysRemaining(challenge.endDate)} days left</span>
                  </div>
                  {challenge.rules.targetAmount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium">₹{challenge.rules.targetAmount.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Rewards: {challenge.rewards.length} prize{challenge.rewards.length !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => onJoinChallenge(challenge.id)}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                    >
                      Join Challenge
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {availableChallenges.length === 0 && (
              <div className="col-span-full text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🎯</div>
                <p className="text-lg font-medium">No available challenges</p>
                <p className="text-sm">Create your own challenge to get started!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participating Tab */}
      {activeTab === 'participating' && (
        <div className="space-y-4">
          {participatingChallenges.map((challenge) => {
            const participant = challenge.participants.find(p => p.userId === currentUserId);
            const daysLeft = getDaysRemaining(challenge.endDate);
            const rank = getUserRank(challenge);
            
            return (
              <div key={challenge.id} className="border rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getChallengeIcon(challenge.type)}</div>
                    <div>
                      <h3 className="text-lg font-semibold">{challenge.title}</h3>
                      <p className="text-gray-600">{challenge.description}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(challenge.status)}`}>
                          {challenge.status}
                        </span>
                        <span className="text-sm text-gray-600">{daysLeft} days left</span>
                        <span className="text-sm text-gray-600">Rank #{rank}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onLeaveChallenge(challenge.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Leave Challenge
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Your Progress</span>
                    <span>{participant?.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(participant?.progress || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Challenge Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {challenge.rules.targetAmount && (
                    <div>
                      <span className="text-gray-600">Target Amount:</span>
                      <p className="font-medium">₹{challenge.rules.targetAmount.toLocaleString()}</p>
                    </div>
                  )}
                  {challenge.rules.targetCategory && (
                    <div>
                      <span className="text-gray-600">Category:</span>
                      <p className="font-medium capitalize">{challenge.rules.targetCategory}</p>
                    </div>
                  )}
                  {challenge.rules.streakDays && (
                    <div>
                      <span className="text-gray-600">Streak Target:</span>
                      <p className="font-medium">{challenge.rules.streakDays} days</p>
                    </div>
                  )}
                  {challenge.rules.spendingLimit && (
                    <div>
                      <span className="text-gray-600">Spending Limit:</span>
                      <p className="font-medium">₹{challenge.rules.spendingLimit.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Leaderboard Preview */}
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-3">Top Participants</h4>
                  <div className="space-y-2">
                    {challenge.leaderboard.slice(0, 3).map((entry, index) => (
                      <div key={entry.userId} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            #{entry.rank} {entry.username}
                            {entry.userId === currentUserId && ' (You)'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">{entry.progress}% • {entry.score} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          
          {participatingChallenges.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-lg font-medium">You're not participating in any challenges</p>
              <p className="text-sm">Join a challenge from the Discover tab!</p>
            </div>
          )}
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedChallenges.map((challenge) => {
            const participant = challenge.participants.find(p => p.userId === currentUserId);
            const finalRank = participant?.rank || challenge.participants.length + 1;
            const isWinner = finalRank <= 3;
            
            return (
              <div key={challenge.id} className={`border rounded-lg p-6 ${isWinner ? 'border-yellow-300 bg-yellow-50' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getChallengeIcon(challenge.type)}</div>
                    <div>
                      <h3 className="text-lg font-semibold">{challenge.title}</h3>
                      <p className="text-gray-600">{challenge.description}</p>
                    </div>
                  </div>
                  
                  {isWinner && (
                    <div className="text-right">
                      <div className="text-2xl">🏆</div>
                      <p className="text-sm font-medium text-yellow-800">
                        {finalRank === 1 ? '1st Place!' : finalRank === 2 ? '2nd Place!' : '3rd Place!'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Final Rank:</span>
                    <p className="font-medium">#{finalRank} of {challenge.participants.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Completion:</span>
                    <p className="font-medium">{participant?.progress || 0}%</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <p className="font-medium">
                      {Math.ceil((new Date(challenge.endDate).getTime() - new Date(challenge.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Participants:</span>
                    <p className="font-medium">{challenge.participants.length}</p>
                  </div>
                </div>

                {isWinner && (
                  <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Rewards Earned</h4>
                    <div className="space-y-1">
                      {challenge.rewards
                        .filter(reward => reward.rank >= finalRank)
                        .map((reward, index) => (
                          <div key={index} className="text-sm text-yellow-700">
                            {reward.description}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {completedChallenges.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🏁</div>
              <p className="text-lg font-medium">No completed challenges yet</p>
              <p className="text-sm">Complete your first challenge to see your achievements!</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          {challenges.filter(c => c.status === 'active').map((challenge) => (
            <div key={challenge.id} className="border rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-2xl">{getChallengeIcon(challenge.type)}</div>
                <div>
                  <h3 className="text-lg font-semibold">{challenge.title}</h3>
                  <p className="text-sm text-gray-600">{getDaysRemaining(challenge.endDate)} days remaining</p>
                </div>
              </div>

              <div className="space-y-3">
                {challenge.leaderboard.map((entry, index) => (
                  <div key={entry.userId} className={`flex justify-between items-center p-3 rounded-lg ${
                    entry.userId === currentUserId ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        entry.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                        entry.rank === 2 ? 'bg-gray-400 text-gray-900' :
                        entry.rank === 3 ? 'bg-orange-400 text-orange-900' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : entry.rank}
                      </div>
                      <div>
                        <p className="font-medium">
                          {entry.username}
                          {entry.userId === currentUserId && ' (You)'}
                        </p>
                        <p className="text-sm text-gray-600">Progress: {entry.progress}%</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">{entry.score} pts</p>
                      {entry.completedDate && (
                        <p className="text-xs text-green-600">Completed!</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {challenges.filter(c => c.status === 'active').length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-lg font-medium">No active challenges</p>
              <p className="text-sm">Join or create a challenge to see leaderboards!</p>
            </div>
          )}
        </div>
      )}

      {/* Create Challenge Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Challenge</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Challenge Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                    placeholder="30-Day Savings Challenge"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Challenge Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="saving">Saving Challenge</option>
                    <option value="spending_limit">Spending Limit</option>
                    <option value="category_focus">Category Focus</option>
                    <option value="streak">Streak Challenge</option>
                    <option value="social">Social Challenge</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Describe your challenge and its goals..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Challenge-specific fields */}
              {(formData.type === 'saving' || formData.type === 'spending_limit') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'saving' ? 'Target Savings Amount' : 'Spending Limit'}
                  </label>
                  <input
                    type="number"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="10000"
                  />
                </div>
              )}

              {formData.type === 'category_focus' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Category</label>
                  <input
                    type="text"
                    value={formData.targetCategory}
                    onChange={(e) => setFormData({...formData, targetCategory: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Food, Entertainment, etc."
                  />
                </div>
              )}

              {formData.type === 'streak' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Streak Target (Days)</label>
                  <input
                    type="number"
                    value={formData.streakDays}
                    onChange={(e) => setFormData({...formData, streakDays: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="30"
                  />
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                  Make this challenge public (others can discover and join)
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700"
                >
                  Create Challenge
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
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