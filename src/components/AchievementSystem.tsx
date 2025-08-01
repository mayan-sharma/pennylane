import React, { useState } from 'react';
import type { Achievement, UserProgress } from '../types';

interface AchievementSystemProps {
  userProgress: UserProgress;
  availableAchievements: Achievement[];
  onClaimReward: (achievementId: string) => void;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({
  userProgress,
  availableAchievements,
  onClaimReward
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'badges' | 'stats'>('overview');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const unlockedAchievements = userProgress.achievements;
  const availableCategories = ['all', ...new Set(availableAchievements.map(a => a.category))];

  const filteredAchievements = availableAchievements.filter(achievement => 
    filterCategory === 'all' || achievement.category === filterCategory
  );

  const getLevelFromPoints = (points: number) => {
    return Math.floor(points / 1000) + 1;
  };

  const getPointsForNextLevel = (points: number) => {
    const currentLevel = getLevelFromPoints(points);
    return currentLevel * 1000 - points;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return '🥉';
      case 'rare': return '🥈';
      case 'epic': return '🥇';
      case 'legendary': return '👑';
      default: return '⭐';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'saving': return '💰';
      case 'budgeting': return '📊';
      case 'streak': return '🔥';
      case 'goal': return '🎯';
      case 'special': return '✨';
      default: return '🏆';
    }
  };

  const getRecentUnlocks = () => {
    return unlockedAchievements
      .filter(a => a.unlockedAt)
      .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())
      .slice(0, 5);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Achievement System</h2>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Level {userProgress.level}</p>
            <p className="font-bold text-lg">{userProgress.totalPoints.toLocaleString()} points</p>
          </div>
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {userProgress.level}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'achievements', 'badges', 'stats'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md flex-1 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-yellow-600 shadow-sm'
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
          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800">Total Points</h3>
              <p className="text-2xl font-bold text-yellow-900">{userProgress.totalPoints.toLocaleString()}</p>
              <p className="text-xs text-yellow-700">{getPointsForNextLevel(userProgress.totalPoints)} to next level</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Current Streak</h3>
              <p className="text-2xl font-bold text-blue-900">{userProgress.currentStreak} days</p>
              <p className="text-xs text-blue-700">Longest: {userProgress.longestStreak} days</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Achievements</h3>
              <p className="text-2xl font-bold text-green-900">{unlockedAchievements.length}</p>
              <p className="text-xs text-green-700">of {availableAchievements.length} total</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Challenges Won</h3>
              <p className="text-2xl font-bold text-purple-900">{userProgress.challengesWon}</p>
              <p className="text-xs text-purple-700">{userProgress.challengesParticipated} participated</p>
            </div>
          </div>

          {/* Level Progress */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Level Progress</h3>
              <span className="text-sm text-gray-600">Level {userProgress.level}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-4 rounded-full transition-all duration-300"
                style={{ 
                  width: `${((userProgress.totalPoints % 1000) / 1000) * 100}%` 
                }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>{userProgress.totalPoints % 1000} / 1000 points</span>
              <span>{getPointsForNextLevel(userProgress.totalPoints)} points to Level {userProgress.level + 1}</span>
            </div>
          </div>

          {/* Recent Achievements */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getRecentUnlocks().map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 ${getRarityColor(achievement.rarity)} relative overflow-hidden`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{achievement.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 capitalize">{achievement.category}</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">{getRarityIcon(achievement.rarity)}</span>
                          {achievement.points && (
                            <span className="text-xs font-medium">{achievement.points}pts</span>
                          )}
                        </div>
                      </div>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterCategory === category
                    ? 'bg-yellow-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getCategoryIcon(category)} {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Achievements Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = unlockedAchievements.some(ua => ua.id === achievement.id);
              const progress = Math.min((achievement.progress / achievement.maxProgress) * 100, 100);
              
              return (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    isUnlocked 
                      ? getRarityColor(achievement.rarity)
                      : 'border-gray-200 bg-gray-50 opacity-75'
                  } relative`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`text-2xl ${isUnlocked ? '' : 'grayscale'}`}>
                      {isUnlocked ? achievement.icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}`}>
                        {achievement.title}
                      </h4>
                      <p className={`text-sm mb-2 ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>
                      
                      {/* Progress Bar */}
                      {!isUnlocked && achievement.maxProgress > 1 && (
                        <div className="mb-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {achievement.progress} / {achievement.maxProgress}
                          </p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className={`text-xs capitalize ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                          {achievement.category}
                        </span>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs">{getRarityIcon(achievement.rarity)}</span>
                          {achievement.points && (
                            <span className={`text-xs font-medium ${isUnlocked ? 'text-gray-700' : 'text-gray-400'}`}>
                              {achievement.points}pts
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {userProgress.badges.map((badge, index) => (
              <div key={index} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="text-4xl mb-2">🏆</div>
                <p className="text-sm font-medium text-gray-800">{badge}</p>
              </div>
            ))}
            
            {/* Placeholder badges */}
            {Array.from({ length: Math.max(0, 12 - userProgress.badges.length) }).map((_, index) => (
              <div key={`placeholder-${index}`} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 opacity-50">
                <div className="text-4xl mb-2 grayscale">🏆</div>
                <p className="text-sm text-gray-400">Locked</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Achievement Stats */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Achievement Progress</h3>
              <div className="space-y-4">
                {availableCategories.filter(cat => cat !== 'all').map((category) => {
                  const totalInCategory = availableAchievements.filter(a => a.category === category).length;
                  const unlockedInCategory = unlockedAchievements.filter(a => a.category === category).length;
                  const percentage = totalInCategory > 0 ? (unlockedInCategory / totalInCategory) * 100 : 0;
                  
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{getCategoryIcon(category)} {category}</span>
                        <span>{unlockedInCategory} / {totalInCategory}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rarity Distribution */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Achievement Rarity</h3>
              <div className="space-y-3">
                {['common', 'rare', 'epic', 'legendary'].map((rarity) => {
                  const totalInRarity = availableAchievements.filter(a => a.rarity === rarity).length;
                  const unlockedInRarity = unlockedAchievements.filter(a => a.rarity === rarity).length;
                  
                  return (
                    <div key={rarity} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{getRarityIcon(rarity)}</span>
                        <span className="capitalize font-medium">{rarity}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {unlockedInRarity} / {totalInRarity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak Stats */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Streak Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Streak</span>
                  <span className="font-bold text-blue-600">{userProgress.currentStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Longest Streak</span>
                  <span className="font-bold text-green-600">{userProgress.longestStreak} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Activity</span>
                  <span className="text-sm text-gray-500">
                    {new Date(userProgress.lastActivityDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Challenge Stats */}
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Challenge Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Challenges Won</span>
                  <span className="font-bold text-purple-600">{userProgress.challengesWon}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Challenges Participated</span>
                  <span className="font-bold text-blue-600">{userProgress.challengesParticipated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Win Rate</span>
                  <span className="font-bold text-green-600">
                    {userProgress.challengesParticipated > 0 
                      ? Math.round((userProgress.challengesWon / userProgress.challengesParticipated) * 100)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};