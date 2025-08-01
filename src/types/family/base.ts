import type { Budget } from '../budget/base';

export interface FamilyBudget {
  id: string;
  name: string;
  members: FamilyMember[];
  sharedBudgets: Budget[];
  permissions: FamilyPermissions;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedDate: string;
  permissions: string[];
  allocatedBudgets: string[];
}

export interface FamilyPermissions {
  canCreateBudgets: string[];
  canEditBudgets: string[];
  canDeleteBudgets: string[];
  canViewReports: string[];
  canInviteMembers: string[];
  canManageRoles: string[];
}

export interface AccountabilityPartner {
  id: string;
  partnerId: string;
  partnerUsername: string;
  partnerEmail: string;
  status: 'pending' | 'active' | 'paused';
  sharedGoals: string[];
  checkInFrequency: 'daily' | 'weekly' | 'monthly';
  lastCheckIn: string;
  nextCheckIn: string;
  settings: PartnershipSettings;
  createdAt: string;
}

export interface PartnershipSettings {
  shareProgress: boolean;
  shareGoals: boolean;
  allowEncouragement: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  autoCheckIn: boolean;
}

export interface PartnerCheckIn {
  id: string;
  partnershipId: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'struggling';
  achievements: string[];
  challenges: string[];
  message?: string;
  encouragementSent: boolean;
}