import React, { useState } from 'react';
import type { FamilyBudget, FamilyMember, Budget } from '../types';

interface FamilyBudgetSharingProps {
  familyBudgets: FamilyBudget[];
  currentUserId: string;
  currentUsername: string;
  currentUserEmail: string;
  onCreateFamily: (name: string) => void;
  onJoinFamily: (inviteCode: string) => void;
  onInviteMember: (familyId: string, email: string, role: 'admin' | 'editor' | 'viewer') => void;
  onUpdateMemberRole: (familyId: string, memberId: string, role: 'admin' | 'editor' | 'viewer') => void;
  onRemoveMember: (familyId: string, memberId: string) => void;
  onLeaveFamily: (familyId: string) => void;
  onCreateSharedBudget: (familyId: string, budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateSharedBudget: (familyId: string, budgetId: string, updates: Partial<Budget>) => void;
  onDeleteSharedBudget: (familyId: string, budgetId: string) => void;
}

export const FamilyBudgetSharing: React.FC<FamilyBudgetSharingProps> = ({
  familyBudgets,
  currentUserId,
  currentUsername,
  currentUserEmail,
  onCreateFamily,
  onJoinFamily,
  onInviteMember,
  onUpdateMemberRole,
  onRemoveMember,
  onLeaveFamily,
  onCreateSharedBudget,
  onUpdateSharedBudget,
  onDeleteSharedBudget
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'families' | 'budgets' | 'members'>('overview');
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [showJoinFamily, setShowJoinFamily] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState<string | null>(null);
  const [showCreateBudget, setShowCreateBudget] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);

  const [createFamilyData, setCreateFamilyData] = useState({
    name: ''
  });

  const [joinFamilyData, setJoinFamilyData] = useState({
    inviteCode: ''
  });

  const [inviteMemberData, setInviteMemberData] = useState({
    email: '',
    role: 'viewer' as const
  });

  const [budgetFormData, setBudgetFormData] = useState({
    category: 'total',
    amount: '',
    period: 'monthly' as const,
    type: 'standard' as const,
    description: ''
  });

  const getCurrentUserRole = (family: FamilyBudget) => {
    const member = family.members.find(m => m.userId === currentUserId);
    return member?.role || 'viewer';
  };

  const canPerformAction = (family: FamilyBudget, action: string) => {
    const role = getCurrentUserRole(family);
    const permissions = family.permissions;
    
    switch (action) {
      case 'create_budget':
        return permissions.canCreateBudgets.includes(role);
      case 'edit_budget':
        return permissions.canEditBudgets.includes(role);
      case 'delete_budget':
        return permissions.canDeleteBudgets.includes(role);
      case 'invite_members':
        return permissions.canInviteMembers.includes(role);
      case 'manage_roles':
        return permissions.canManageRoles.includes(role);
      case 'view_reports':
        return permissions.canViewReports.includes(role);
      default:
        return false;
    }
  };

  const handleCreateFamily = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateFamily(createFamilyData.name);
    setShowCreateFamily(false);
    setCreateFamilyData({ name: '' });
  };

  const handleJoinFamily = (e: React.FormEvent) => {
    e.preventDefault();
    onJoinFamily(joinFamilyData.inviteCode);
    setShowJoinFamily(false);
    setJoinFamilyData({ inviteCode: '' });
  };

  const handleInviteMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showInviteMember) return;
    
    onInviteMember(showInviteMember, inviteMemberData.email, inviteMemberData.role);
    setShowInviteMember(null);
    setInviteMemberData({ email: '', role: 'viewer' });
  };

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCreateBudget) return;

    const budget = {
      category: budgetFormData.category,
      amount: parseFloat(budgetFormData.amount),
      period: budgetFormData.period,
      type: budgetFormData.type,
      alertThresholds: [75, 90, 100],
      rolloverEnabled: false,
      description: budgetFormData.description
    };

    onCreateSharedBudget(showCreateBudget, budget);
    setShowCreateBudget(null);
    setBudgetFormData({
      category: 'total',
      amount: '',
      period: 'monthly',
      type: 'standard',
      description: ''
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'editor': return '✏️';
      case 'viewer': return '👁️';
      default: return '👤';
    }
  };

  const totalSharedBudgets = familyBudgets.reduce((sum, family) => sum + family.sharedBudgets.length, 0);
  const totalMembers = familyBudgets.reduce((sum, family) => sum + family.members.length, 0);

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Family Budget Sharing</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateFamily(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Family
          </button>
          <button
            onClick={() => setShowJoinFamily(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Join Family
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'families', 'budgets', 'members'] as const).map((tab) => (
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
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Families Joined</h3>
              <p className="text-2xl font-bold text-blue-900">{familyBudgets.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Shared Budgets</h3>
              <p className="text-2xl font-bold text-green-900">{totalSharedBudgets}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Family Members</h3>
              <p className="text-2xl font-bold text-purple-900">{totalMembers}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800">Admin Roles</h3>
              <p className="text-2xl font-bold text-yellow-900">
                {familyBudgets.filter(f => getCurrentUserRole(f) === 'admin').length}
              </p>
            </div>
          </div>

          {/* Family Overview */}
          <div className="space-y-4">
            {familyBudgets.map((family) => {
              const userRole = getCurrentUserRole(family);
              const totalBudgetAmount = family.sharedBudgets.reduce((sum, budget) => sum + budget.amount, 0);
              
              return (
                <div key={family.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{family.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userRole)}`}>
                          {getRoleIcon(userRole)} {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </span>
                        <span className="text-sm text-gray-600">{family.members.length} members</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">₹{totalBudgetAmount.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{family.sharedBudgets.length} budgets</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <span>Invite Code: <code className="bg-gray-100 px-2 py-1 rounded">{family.inviteCode}</code></span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedFamily(family.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                      {family.createdBy !== currentUserId && (
                        <button
                          onClick={() => onLeaveFamily(family.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Families Tab */}
      {activeTab === 'families' && (
        <div className="space-y-4">
          {familyBudgets.map((family) => (
            <div key={family.id} className="border rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{family.name}</h3>
                {canPerformAction(family, 'invite_members') && (
                  <button
                    onClick={() => setShowInviteMember(family.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  >
                    Invite Member
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Family Information</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Created By:</strong> {family.createdBy === currentUserId ? 'You' : 'Admin'}</div>
                    <div><strong>Members:</strong> {family.members.length}</div>
                    <div><strong>Shared Budgets:</strong> {family.sharedBudgets.length}</div>
                    <div><strong>Invite Code:</strong> <code className="bg-gray-100 px-2 py-1 rounded">{family.inviteCode}</code></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Your Role & Permissions</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Role:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getRoleColor(getCurrentUserRole(family))}`}>
                        {getCurrentUserRole(family)}
                      </span>
                    </div>
                    <div><strong>Can Create Budgets:</strong> {canPerformAction(family, 'create_budget') ? '✅' : '❌'}</div>
                    <div><strong>Can Edit Budgets:</strong> {canPerformAction(family, 'edit_budget') ? '✅' : '❌'}</div>
                    <div><strong>Can Invite Members:</strong> {canPerformAction(family, 'invite_members') ? '✅' : '❌'}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div className="space-y-6">
          {familyBudgets.map((family) => (
            <div key={family.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{family.name} - Shared Budgets</h3>
                {canPerformAction(family, 'create_budget') && (
                  <button
                    onClick={() => setShowCreateBudget(family.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Add Budget
                  </button>
                )}
              </div>
              
              {family.sharedBudgets.length > 0 ? (
                <div className="space-y-3">
                  {family.sharedBudgets.map((budget) => (
                    <div key={budget.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium">{budget.category}</h4>
                        <p className="text-sm text-gray-600">
                          ₹{budget.amount.toLocaleString()} / {budget.period}
                        </p>
                        {budget.description && (
                          <p className="text-xs text-gray-500">{budget.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {canPerformAction(family, 'edit_budget') && (
                          <button className="text-blue-600 hover:text-blue-800 text-sm">
                            Edit
                          </button>
                        )}
                        {canPerformAction(family, 'delete_budget') && (
                          <button
                            onClick={() => onDeleteSharedBudget(family.id, budget.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No shared budgets yet.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {familyBudgets.map((family) => (
            <div key={family.id} className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">{family.name} - Members</h3>
              
              <div className="space-y-3">
                {family.members.map((member) => (
                  <div key={member.userId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {member.username} {member.userId === currentUserId && '(You)'}
                        </h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(member.joinedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                        {getRoleIcon(member.role)} {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </span>
                      
                      {member.userId !== currentUserId && canPerformAction(family, 'manage_roles') && (
                        <div className="flex space-x-1">
                          <select
                            value={member.role}
                            onChange={(e) => onUpdateMemberRole(family.id, member.userId, e.target.value as any)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => onRemoveMember(family.id, member.userId)}
                            className="text-red-600 hover:text-red-800 text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Family Modal */}
      {showCreateFamily && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Family Budget</h3>
            <form onSubmit={handleCreateFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family Name</label>
                <input
                  type="text"
                  value={createFamilyData.name}
                  onChange={(e) => setCreateFamilyData({...createFamilyData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Smith Family Budget"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Create Family
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateFamily(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Family Modal */}
      {showJoinFamily && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Join Family Budget</h3>
            <form onSubmit={handleJoinFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invite Code</label>
                <input
                  type="text"
                  value={joinFamilyData.inviteCode}
                  onChange={(e) => setJoinFamilyData({...joinFamilyData, inviteCode: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  placeholder="Enter 6-character invite code"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Join Family
                </button>
                <button
                  type="button"
                  onClick={() => setShowJoinFamily(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Invite Family Member</h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteMemberData.email}
                  onChange={(e) => setInviteMemberData({...inviteMemberData, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteMemberData.role}
                  onChange={(e) => setInviteMemberData({...inviteMemberData, role: e.target.value as any})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="viewer">Viewer (View only)</option>
                  <option value="editor">Editor (Can edit budgets)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteMember(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Budget Modal */}
      {showCreateBudget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create Shared Budget</h3>
            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={budgetFormData.category}
                  onChange={(e) => setBudgetFormData({...budgetFormData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={budgetFormData.amount}
                    onChange={(e) => setBudgetFormData({...budgetFormData, amount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={budgetFormData.period}
                    onChange={(e) => setBudgetFormData({...budgetFormData, period: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={budgetFormData.description}
                  onChange={(e) => setBudgetFormData({...budgetFormData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Create Budget
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateBudget(null)}
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