export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'saving' | 'budgeting' | 'streak' | 'goal' | 'special';
  criteria: AchievementCriteria;
  rewardType: 'badge' | 'points' | 'milestone';
  points?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface AchievementCriteria {
  type: 'budget_adherence' | 'saving_streak' | 'goal_completion' | 'expense_reduction' | 'challenge_win';
  value: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
}

export interface UserProgress {
  id: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  badges: string[];
  challengesWon: number;
  challengesParticipated: number;
  lastActivityDate: string;
}

export interface BudgetChallenge {
  id: string;
  title: string;
  description: string;
  type: 'saving' | 'spending_limit' | 'category_focus' | 'streak' | 'social';
  startDate: string;
  endDate: string;
  participants: ChallengeParticipant[];
  rules: ChallengeRules;
  rewards: ChallengeReward[];
  leaderboard: LeaderboardEntry[];
  status: 'upcoming' | 'active' | 'completed';
  createdBy: string;
  isPublic: boolean;
}

export interface ChallengeParticipant {
  userId: string;
  username: string;
  joinedDate: string;
  progress: number;
  rank: number;
  isCompleted: boolean;
}

export interface ChallengeRules {
  targetAmount?: number;
  targetCategory?: string;
  streakDays?: number;
  spendingLimit?: number;
  customRules?: string[];
}

export interface ChallengeReward {
  type: 'points' | 'badge' | 'achievement' | 'custom';
  value: string | number;
  description: string;
  rank: number; // 1st, 2nd, 3rd place etc.
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  rank: number;
  progress: number;
  completedDate?: string;
}