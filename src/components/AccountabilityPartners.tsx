import React, { useState } from 'react';
import type { AccountabilityPartner, PartnerCheckIn } from '../types/expense';

interface AccountabilityPartnersProps {
  partners: AccountabilityPartner[];
  checkIns: PartnerCheckIn[];
  currentUserId: string;
  onSendPartnerRequest: (email: string) => void;
  onAcceptPartnerRequest: (partnerId: string) => void;
  onDeclinePartnerRequest: (partnerId: string) => void;
  onUpdatePartnerSettings: (partnerId: string, settings: Partial<AccountabilityPartner>) => void;
  onCreateCheckIn: (checkIn: Omit<PartnerCheckIn, 'id'>) => void;
  onSendEncouragement: (partnerId: string, message: string) => void;
  onPausePartnership: (partnerId: string) => void;
  onResumePartnership: (partnerId: string) => void;
  onEndPartnership: (partnerId: string) => void;
}

export const AccountabilityPartners: React.FC<AccountabilityPartnersProps> = ({
  partners,
  checkIns,
  currentUserId,
  onSendPartnerRequest,
  onAcceptPartnerRequest,
  onDeclinePartnerRequest,
  onUpdatePartnerSettings,
  onCreateCheckIn,
  onSendEncouragement,
  onPausePartnership,
  onResumePartnership,
  onEndPartnership
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'checkins' | 'settings'>('overview');
  const [showAddPartner, setShowAddPartner] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState<string | null>(null);
  const [showEncouragement, setShowEncouragement] = useState<string | null>(null);

  const [addPartnerData, setAddPartnerData] = useState({
    email: ''
  });

  const [checkInData, setCheckInData] = useState({
    mood: 'good' as const,
    achievements: [''],
    challenges: [''],
    message: ''
  });

  const [encouragementData, setEncouragementData] = useState({
    message: ''
  });

  const activePartners = partners.filter(p => p.status === 'active');
  const pendingRequests = partners.filter(p => p.status === 'pending');
  const pausedPartners = partners.filter(p => p.status === 'paused');

  const getRecentCheckIns = (partnerId?: string) => {
    return checkIns
      .filter(ci => !partnerId || ci.partnershipId === partnerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  };

  const getNextCheckInDate = (partner: AccountabilityPartner) => {
    const lastCheckIn = new Date(partner.lastCheckIn);
    const frequency = partner.checkInFrequency;
    
    const nextDate = new Date(lastCheckIn);
    switch (frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
    }
    return nextDate;
  };

  const isCheckInDue = (partner: AccountabilityPartner) => {
    const nextCheckIn = getNextCheckInDate(partner);
    return new Date() >= nextCheckIn;
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'great': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'okay': return 'bg-yellow-100 text-yellow-800';
      case 'struggling': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'great': return '😄';
      case 'good': return '😊';
      case 'okay': return '😐';
      case 'struggling': return '😟';
      default: return '🤔';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    onSendPartnerRequest(addPartnerData.email);
    setShowAddPartner(false);
    setAddPartnerData({ email: '' });
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCheckIn) return;

    const checkIn = {
      partnershipId: showCheckIn,
      date: new Date().toISOString().split('T')[0],
      mood: checkInData.mood,
      achievements: checkInData.achievements.filter(a => a.trim()),
      challenges: checkInData.challenges.filter(c => c.trim()),
      message: checkInData.message,
      encouragementSent: false
    };

    onCreateCheckIn(checkIn);
    setShowCheckIn(null);
    setCheckInData({
      mood: 'good',
      achievements: [''],
      challenges: [''],
      message: ''
    });
  };

  const handleSendEncouragement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEncouragement) return;

    onSendEncouragement(showEncouragement, encouragementData.message);
    setShowEncouragement(null);
    setEncouragementData({ message: '' });
  };

  const addAchievementField = () => {
    setCheckInData({
      ...checkInData,
      achievements: [...checkInData.achievements, '']
    });
  };

  const addChallengeField = () => {
    setCheckInData({
      ...checkInData,
      challenges: [...checkInData.challenges, '']
    });
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...checkInData.achievements];
    newAchievements[index] = value;
    setCheckInData({
      ...checkInData,
      achievements: newAchievements
    });
  };

  const updateChallenge = (index: number, value: string) => {
    const newChallenges = [...checkInData.challenges];
    newChallenges[index] = value;
    setCheckInData({
      ...checkInData,
      challenges: newChallenges
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Accountability Partners</h2>
        <button
          onClick={() => setShowAddPartner(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Partner
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'partners', 'checkins', 'settings'] as const).map((tab) => (
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
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Active Partners</h3>
              <p className="text-2xl font-bold text-green-900">{activePartners.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800">Pending Requests</h3>
              <p className="text-2xl font-bold text-yellow-900">{pendingRequests.length}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Check-ins Due</h3>
              <p className="text-2xl font-bold text-blue-900">
                {activePartners.filter(p => isCheckInDue(p)).length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Total Check-ins</h3>
              <p className="text-2xl font-bold text-purple-900">{checkIns.length}</p>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-yellow-800">Pending Partner Requests</h3>
              <div className="space-y-2">
                {pendingRequests.map((partner) => (
                  <div key={partner.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                    <div>
                      <p className="font-medium">{partner.partnerUsername}</p>
                      <p className="text-sm text-gray-600">{partner.partnerEmail}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onAcceptPartnerRequest(partner.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onDeclinePartnerRequest(partner.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Partners Overview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Active Partners</h3>
            {activePartners.map((partner) => {
              const recentCheckIn = getRecentCheckIns(partner.id)[0];
              const isDue = isCheckInDue(partner);
              
              return (
                <div key={partner.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {partner.partnerUsername.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{partner.partnerUsername}</h4>
                        <p className="text-sm text-gray-600">{partner.partnerEmail}</p>
                        <p className="text-xs text-gray-500">
                          Check-in frequency: {partner.checkInFrequency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isDue && (
                        <button
                          onClick={() => setShowCheckIn(partner.id)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          Check In
                        </button>
                      )}
                      <button
                        onClick={() => setShowEncouragement(partner.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Encourage
                      </button>
                    </div>
                  </div>
                  
                  {recentCheckIn && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Last Check-in</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(recentCheckIn.mood)}`}>
                          {getMoodIcon(recentCheckIn.mood)} {recentCheckIn.mood}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{new Date(recentCheckIn.date).toLocaleDateString()}</p>
                      {recentCheckIn.message && (
                        <p className="text-sm text-gray-700 mt-1">"{recentCheckIn.message}"</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-3 text-sm">
                    <span className="text-gray-600">
                      Next check-in: {getNextCheckInDate(partner).toLocaleDateString()}
                    </span>
                    {isDue && (
                      <span className="text-red-600 font-medium">Check-in due!</span>
                    )}
                  </div>
                </div>
              );
            })}
            
            {activePartners.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No active accountability partners yet.</p>
                <p className="text-sm">Add a partner to start your accountability journey!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Partners Tab */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          {partners.map((partner) => (
            <div key={partner.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {partner.partnerUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold">{partner.partnerUsername}</h4>
                    <p className="text-sm text-gray-600">{partner.partnerEmail}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(partner.status)} mt-1`}>
                      {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {partner.status === 'active' && (
                    <>
                      <button
                        onClick={() => onPausePartnership(partner.id)}
                        className="text-yellow-600 hover:text-yellow-800 text-sm"
                      >
                        Pause
                      </button>
                      <button
                        onClick={() => onEndPartnership(partner.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        End Partnership
                      </button>
                    </>
                  )}
                  {partner.status === 'paused' && (
                    <button
                      onClick={() => onResumePartnership(partner.id)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Partnership Started:</strong> {new Date(partner.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Check-in Frequency:</strong> {partner.checkInFrequency}
                </div>
                <div>
                  <strong>Last Check-in:</strong> {new Date(partner.lastCheckIn).toLocaleDateString()}
                </div>
                <div>
                  <strong>Next Check-in:</strong> {partner.nextCheckIn}
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="font-medium mb-2">Settings</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>Share Progress: {partner.settings.shareProgress ? '✅' : '❌'}</div>
                  <div>Share Goals: {partner.settings.shareGoals ? '✅' : '❌'}</div>
                  <div>Allow Encouragement: {partner.settings.allowEncouragement ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Check-ins Tab */}
      {activeTab === 'checkins' && (
        <div className="space-y-4">
          {getRecentCheckIns().map((checkIn) => {
            const partner = partners.find(p => p.id === checkIn.partnershipId);
            
            return (
              <div key={checkIn.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">Check-in with {partner?.partnerUsername || 'Unknown'}</h4>
                    <p className="text-sm text-gray-600">{new Date(checkIn.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMoodColor(checkIn.mood)}`}>
                    {getMoodIcon(checkIn.mood)} {checkIn.mood}
                  </span>
                </div>
                
                {checkIn.achievements.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-green-800 mb-1">Achievements:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {checkIn.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {checkIn.challenges.length > 0 && (
                  <div className="mb-3">
                    <h5 className="font-medium text-red-800 mb-1">Challenges:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {checkIn.challenges.map((challenge, index) => (
                        <li key={index}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {checkIn.message && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-900">"{checkIn.message}"</p>
                  </div>
                )}
              </div>
            );
          })}
          
          {checkIns.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No check-ins yet.</p>
              <p className="text-sm">Start checking in with your accountability partners!</p>
            </div>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4">Global Settings</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span>Enable all partnership notifications</span>
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Toggle</button>
              </div>
              <div className="flex justify-between items-center">
                <span>Auto check-in reminders</span>
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Toggle</button>
              </div>
              <div className="flex justify-between items-center">
                <span>Share achievements automatically</span>
                <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">Toggle</button>
              </div>
            </div>
          </div>
          
          {activePartners.map((partner) => (
            <div key={partner.id} className="border rounded-lg p-4">
              <h4 className="font-semibold mb-3">Settings for {partner.partnerUsername}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Share Progress</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                      {partner.settings.shareProgress ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Share Goals</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                      {partner.settings.shareGoals ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Allow Encouragement</span>
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-xs">
                      {partner.settings.allowEncouragement ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Frequency</label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notification Frequency</label>
                    <select className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm">
                      <option value="immediate">Immediate</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddPartner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Accountability Partner</h3>
            <form onSubmit={handleAddPartner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Partner's Email</label>
                <input
                  type="email"
                  value={addPartnerData.email}
                  onChange={(e) => setAddPartnerData({...addPartnerData, email: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="partner@example.com"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Your partner will receive an invitation to become your accountability partner. They'll need to accept before you can start sharing check-ins.</p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Send Invitation
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPartner(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      {showCheckIn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Daily Check-in</h3>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How are you feeling today?</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['great', 'good', 'okay', 'struggling'] as const).map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => setCheckInData({...checkInData, mood})}
                      className={`p-2 rounded-lg border text-sm font-medium transition-colors ${
                        checkInData.mood === mood
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {getMoodIcon(mood)} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Achievements Today</label>
                  <button
                    type="button"
                    onClick={addAchievementField}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    + Add
                  </button>
                </div>
                {checkInData.achievements.map((achievement, index) => (
                  <input
                    key={index}
                    type="text"
                    value={achievement}
                    onChange={(e) => updateAchievement(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What did you accomplish today?"
                  />
                ))}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Challenges Faced</label>
                  <button
                    type="button"
                    onClick={addChallengeField}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    + Add
                  </button>
                </div>
                {checkInData.challenges.map((challenge, index) => (
                  <input
                    key={index}
                    type="text"
                    value={challenge}
                    onChange={(e) => updateChallenge(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What challenges did you face?"
                  />
                ))}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Message (Optional)</label>
                <textarea
                  value={checkInData.message}
                  onChange={(e) => setCheckInData({...checkInData, message: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any additional thoughts or updates for your partner..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Submit Check-in
                </button>
                <button
                  type="button"
                  onClick={() => setShowCheckIn(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Encouragement Modal */}
      {showEncouragement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Send Encouragement</h3>
            <form onSubmit={handleSendEncouragement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Encouragement Message</label>
                <textarea
                  value={encouragementData.message}
                  onChange={(e) => setEncouragementData({...encouragementData, message: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={4}
                  required
                  placeholder="Write an encouraging message for your partner..."
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Send Encouragement
                </button>
                <button
                  type="button"
                  onClick={() => setShowEncouragement(null)}
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