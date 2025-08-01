import React, { useState } from 'react';
import type { SeasonalAdjustment, Budget } from '../types';

interface SeasonalBudgetsProps {
  seasonalAdjustments: SeasonalAdjustment[];
  budgets: Budget[];
  onCreateAdjustment: (adjustment: Omit<SeasonalAdjustment, 'id'>) => void;
  onUpdateAdjustment: (id: string, updates: Partial<SeasonalAdjustment>) => void;
  onDeleteAdjustment: (id: string) => void;
  onApplyAdjustment: (id: string) => void;
}

export const SeasonalBudgets: React.FC<SeasonalBudgetsProps> = ({
  seasonalAdjustments,
  budgets,
  onCreateAdjustment,
  onUpdateAdjustment,
  onDeleteAdjustment,
  onApplyAdjustment
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'adjustments' | 'calendar' | 'templates'>('overview');
  const [showForm, setShowForm] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<SeasonalAdjustment | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    budgetId: '',
    season: 'spring' as const,
    adjustmentType: 'percentage' as const,
    adjustmentValue: '',
    startDate: '',
    endDate: '',
    autoApply: false,
    description: ''
  });

  const activeAdjustments = seasonalAdjustments.filter(adj => adj.isActive);
  const upcomingAdjustments = seasonalAdjustments.filter(adj => {
    const startDate = new Date(adj.startDate);
    const today = new Date();
    return startDate > today;
  });

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const getSeasonIcon = (season: string) => {
    switch (season) {
      case 'spring': return '🌸';
      case 'summer': return '☀️';
      case 'fall': return '🍂';
      case 'winter': return '❄️';
      case 'holiday': return '🎄';
      case 'custom': return '📅';
      default: return '📅';
    }
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'spring': return 'bg-green-50 border-green-200 text-green-800';
      case 'summer': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'fall': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'winter': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'holiday': return 'bg-red-50 border-red-200 text-red-800';
      case 'custom': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const calculateAdjustedAmount = (budget: Budget, adjustment: SeasonalAdjustment) => {
    if (adjustment.adjustmentType === 'percentage') {
      return budget.amount * (1 + adjustment.adjustmentValue / 100);
    } else {
      return budget.amount + adjustment.adjustmentValue;
    }
  };

  const getPresetAdjustments = () => {
    return [
      {
        name: 'Holiday Season',
        season: 'holiday' as const,
        description: 'Increase budgets for holiday shopping and entertainment',
        categories: ['Shopping', 'Entertainment', 'Food'],
        adjustment: 50 // 50% increase
      },
      {
        name: 'Summer Vacation',
        season: 'summer' as const,
        description: 'Adjust for vacation expenses and outdoor activities',
        categories: ['Travel', 'Entertainment', 'Food'],
        adjustment: 75 // 75% increase
      },
      {
        name: 'Back to School',
        season: 'fall' as const,
        description: 'Prepare for education expenses and new supplies',
        categories: ['Education', 'Shopping'],
        adjustment: 40 // 40% increase
      },
      {
        name: 'Winter Utilities',
        season: 'winter' as const,
        description: 'Account for higher heating and utility costs',
        categories: ['Bills', 'Housing'],
        adjustment: 25 // 25% increase
      }
    ];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const adjustmentData = {
      name: formData.name,
      budgetId: formData.budgetId,
      season: formData.season,
      adjustmentType: formData.adjustmentType,
      adjustmentValue: parseFloat(formData.adjustmentValue),
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: false,
      autoApply: formData.autoApply,
      description: formData.description
    };

    if (editingAdjustment) {
      onUpdateAdjustment(editingAdjustment.id, adjustmentData);
    } else {
      onCreateAdjustment(adjustmentData);
    }

    setShowForm(false);
    setEditingAdjustment(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      budgetId: '',
      season: 'spring',
      adjustmentType: 'percentage',
      adjustmentValue: '',
      startDate: '',
      endDate: '',
      autoApply: false,
      description: ''
    });
  };

  const applyPresetAdjustment = (preset: any) => {
    const relevantBudgets = budgets.filter(budget => 
      preset.categories.some((cat: string) => 
        budget.category.toLowerCase().includes(cat.toLowerCase())
      )
    );

    relevantBudgets.forEach(budget => {
      const startDate = new Date();
      const endDate = new Date();
      
      // Set dates based on season
      switch (preset.season) {
        case 'holiday':
          startDate.setMonth(11, 1); // December 1st
          endDate.setMonth(11, 31); // December 31st
          break;
        case 'summer':
          startDate.setMonth(5, 1); // June 1st
          endDate.setMonth(7, 31); // August 31st
          break;
        case 'fall':
          startDate.setMonth(8, 1); // September 1st
          endDate.setMonth(10, 30); // November 30th
          break;
        case 'winter':
          startDate.setMonth(11, 1); // December 1st
          endDate.setMonth(2, 31); // March 31st (next year)
          break;
      }

      const adjustment = {
        name: `${preset.name} - ${budget.category}`,
        budgetId: budget.id,
        season: preset.season,
        adjustmentType: 'percentage' as const,
        adjustmentValue: preset.adjustment,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        isActive: false,
        autoApply: true,
        description: preset.description
      };

      onCreateAdjustment(adjustment);
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Seasonal Budget Adjustments</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Adjustment
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {(['overview', 'adjustments', 'calendar', 'templates'] as const).map((tab) => (
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
          {/* Current Season Info */}
          <div className={`p-4 rounded-lg border ${getSeasonColor(getCurrentSeason())}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="text-3xl">{getSeasonIcon(getCurrentSeason())}</div>
              <div>
                <h3 className="text-lg font-semibold">Current Season: {getCurrentSeason().charAt(0).toUpperCase() + getCurrentSeason().slice(1)}</h3>
                <p className="text-sm opacity-80">Active adjustments for this season will be applied automatically</p>
              </div>
            </div>
            
            {activeAdjustments.filter(adj => adj.season === getCurrentSeason()).length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium mb-2">Active Adjustments:</h4>
                <div className="space-y-1">
                  {activeAdjustments
                    .filter(adj => adj.season === getCurrentSeason())
                    .map(adj => {
                      const budget = budgets.find(b => b.id === adj.budgetId);
                      return (
                        <div key={adj.id} className="text-sm">
                          {budget?.category}: {adj.adjustmentType === 'percentage' ? `+${adj.adjustmentValue}%` : `+₹${adj.adjustmentValue}`}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Total Adjustments</h3>
              <p className="text-2xl font-bold text-blue-900">{seasonalAdjustments.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Active Now</h3>
              <p className="text-2xl font-bold text-green-900">{activeAdjustments.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-800">Upcoming</h3>
              <p className="text-2xl font-bold text-yellow-900">{upcomingAdjustments.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Auto-Apply</h3>
              <p className="text-2xl font-bold text-purple-900">
                {seasonalAdjustments.filter(adj => adj.autoApply).length}
              </p>
            </div>
          </div>

          {/* Upcoming Adjustments */}
          {upcomingAdjustments.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-yellow-800">Upcoming Adjustments</h3>
              <div className="space-y-3">
                {upcomingAdjustments.slice(0, 3).map((adjustment) => {
                  const budget = budgets.find(b => b.id === adjustment.budgetId);
                  const daysUntil = Math.ceil((new Date(adjustment.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={adjustment.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">{getSeasonIcon(adjustment.season)}</div>
                        <div>
                          <h4 className="font-medium">{adjustment.name}</h4>
                          <p className="text-sm text-gray-600">
                            {budget?.category} • Starts in {daysUntil} days
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {adjustment.adjustmentType === 'percentage' 
                            ? `+${adjustment.adjustmentValue}%` 
                            : `+₹${adjustment.adjustmentValue}`}
                        </p>
                        {adjustment.autoApply && (
                          <p className="text-xs text-green-600">Auto-apply enabled</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Budget Impact Preview */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Current Budget Impact</h3>
            <div className="space-y-3">
              {budgets.map(budget => {
                const activeAdj = activeAdjustments.find(adj => adj.budgetId === budget.id);
                if (!activeAdj) return null;
                
                const originalAmount = budget.amount;
                const adjustedAmount = calculateAdjustedAmount(budget, activeAdj);
                const difference = adjustedAmount - originalAmount;
                
                return (
                  <div key={budget.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium capitalize">{budget.category}</h4>
                      <p className="text-sm text-gray-600">{activeAdj.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ₹{originalAmount.toLocaleString()} → ₹{adjustedAmount.toLocaleString()}
                      </p>
                      <p className="text-sm text-green-600">+₹{difference.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Adjustments Tab */}
      {activeTab === 'adjustments' && (
        <div className="space-y-4">
          {seasonalAdjustments.map((adjustment) => {
            const budget = budgets.find(b => b.id === adjustment.budgetId);
            const isActive = adjustment.isActive;
            const startDate = new Date(adjustment.startDate);
            const endDate = new Date(adjustment.endDate);
            const today = new Date();
            
            return (
              <div key={adjustment.id} className={`border rounded-lg p-4 ${isActive ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getSeasonIcon(adjustment.season)}</div>
                    <div>
                      <h3 className="text-lg font-semibold">{adjustment.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {budget?.category} • {adjustment.season} season
                      </p>
                      {adjustment.description && (
                        <p className="text-sm text-gray-500 mt-1">{adjustment.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                    {adjustment.autoApply && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Auto-apply
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setEditingAdjustment(adjustment);
                        setFormData({
                          name: adjustment.name,
                          budgetId: adjustment.budgetId,
                          season: adjustment.season,
                          adjustmentType: adjustment.adjustmentType,
                          adjustmentValue: adjustment.adjustmentValue.toString(),
                          startDate: adjustment.startDate,
                          endDate: adjustment.endDate,
                          autoApply: adjustment.autoApply,
                          description: adjustment.description || ''
                        });
                        setShowForm(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteAdjustment(adjustment.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Adjustment:</span>
                    <p className="font-medium">
                      {adjustment.adjustmentType === 'percentage' 
                        ? `+${adjustment.adjustmentValue}%` 
                        : `+₹${adjustment.adjustmentValue}`}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Period:</span>
                    <p className="font-medium">
                      {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <p className="font-medium">
                      {today < startDate ? 'Upcoming' : today > endDate ? 'Expired' : 'Active'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Original Budget:</span>
                    <p className="font-medium">₹{budget?.amount.toLocaleString()}</p>
                  </div>
                </div>
                
                {budget && (
                  <div className="mt-3 p-3 bg-white rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Adjusted Amount:</span>
                      <span className="font-bold text-lg">
                        ₹{calculateAdjustedAmount(budget, adjustment).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                
                {!isActive && today >= startDate && today <= endDate && (
                  <div className="mt-3">
                    <button
                      onClick={() => onApplyAdjustment(adjustment.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                    >
                      Apply Adjustment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          {seasonalAdjustments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📅</div>
              <p className="text-lg font-medium">No seasonal adjustments yet</p>
              <p className="text-sm">Create adjustments to automatically modify your budgets for different seasons</p>
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['spring', 'summer', 'fall', 'winter'] as const).map(season => (
              <div key={season} className={`p-4 rounded-lg border ${getSeasonColor(season)}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <div className="text-2xl">{getSeasonIcon(season)}</div>
                  <h3 className="font-semibold capitalize">{season}</h3>
                </div>
                
                <div className="space-y-2">
                  {seasonalAdjustments
                    .filter(adj => adj.season === season)
                    .map(adj => {
                      const budget = budgets.find(b => b.id === adj.budgetId);
                      return (
                        <div key={adj.id} className="text-sm">
                          <p className="font-medium">{budget?.category}</p>
                          <p className="opacity-75">
                            {adj.adjustmentType === 'percentage' 
                              ? `+${adj.adjustmentValue}%` 
                              : `+₹${adj.adjustmentValue}`}
                          </p>
                        </div>
                      );
                    })}
                  
                  {seasonalAdjustments.filter(adj => adj.season === season).length === 0 && (
                    <p className="text-sm opacity-60 italic">No adjustments</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Holiday and Custom Seasons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border ${getSeasonColor('holiday')}`}>
              <div className="flex items-center space-x-2 mb-3">
                <div className="text-2xl">{getSeasonIcon('holiday')}</div>
                <h3 className="font-semibold">Holiday Season</h3>
              </div>
              
              <div className="space-y-2">
                {seasonalAdjustments
                  .filter(adj => adj.season === 'holiday')
                  .map(adj => {
                    const budget = budgets.find(b => b.id === adj.budgetId);
                    return (
                      <div key={adj.id} className="text-sm">
                        <p className="font-medium">{budget?.category}</p>
                        <p className="opacity-75">
                          {adj.adjustmentType === 'percentage' 
                            ? `+${adj.adjustmentValue}%` 
                            : `+₹${adj.adjustmentValue}`}
                        </p>
                      </div>
                    );
                  })}
                
                {seasonalAdjustments.filter(adj => adj.season === 'holiday').length === 0 && (
                  <p className="text-sm opacity-60 italic">No holiday adjustments</p>
                )}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${getSeasonColor('custom')}`}>
              <div className="flex items-center space-x-2 mb-3">
                <div className="text-2xl">{getSeasonIcon('custom')}</div>
                <h3 className="font-semibold">Custom Periods</h3>
              </div>
              
              <div className="space-y-2">
                {seasonalAdjustments
                  .filter(adj => adj.season === 'custom')
                  .map(adj => {
                    const budget = budgets.find(b => b.id === adj.budgetId);
                    return (
                      <div key={adj.id} className="text-sm">
                        <p className="font-medium">{budget?.category}</p>
                        <p className="opacity-75">{adj.name}</p>
                      </div>
                    );
                  })}
                
                {seasonalAdjustments.filter(adj => adj.season === 'custom').length === 0 && (
                  <p className="text-sm opacity-60 italic">No custom periods</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold mb-4 text-blue-800">Preset Adjustment Templates</h3>
            <p className="text-sm text-blue-700 mb-4">
              Apply common seasonal adjustments with one click. These templates will create adjustments for multiple relevant budgets.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getPresetAdjustments().map((preset, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="text-2xl">{getSeasonIcon(preset.season)}</div>
                    <div>
                      <h4 className="font-semibold">{preset.name}</h4>
                      <p className="text-sm text-gray-600">{preset.description}</p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Affects categories:</p>
                    <div className="flex flex-wrap gap-1">
                      {preset.categories.map(cat => (
                        <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Adjustment: +{preset.adjustment}%</span>
                    <button
                      onClick={() => applyPresetAdjustment(preset)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Apply Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Custom Template Ideas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Wedding Season (Spring/Summer)</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Shopping: +60% for gifts and attire</li>
                  <li>• Travel: +40% for wedding destinations</li>
                  <li>• Entertainment: +30% for celebrations</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tax Season (Spring)</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Professional services: +100% for tax prep</li>
                  <li>• Reduce other categories by 10%</li>
                  <li>• Create emergency fund for tax payments</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Festival Season (Fall)</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Food: +40% for special meals</li>
                  <li>• Shopping: +70% for gifts and decorations</li>
                  <li>• Entertainment: +50% for events</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Health Focus (New Year)</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Healthcare: +50% for checkups</li>
                  <li>• Food: +20% for healthy options</li>
                  <li>• Entertainment: Include gym memberships</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Adjustment Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingAdjustment ? 'Edit Seasonal Adjustment' : 'Add Seasonal Adjustment'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="e.g., Holiday Shopping Increase"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                <select
                  value={formData.budgetId}
                  onChange={(e) => setFormData({...formData, budgetId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a budget</option>
                  {budgets.map(budget => (
                    <option key={budget.id} value={budget.id}>
                      {budget.category} - ₹{budget.amount.toLocaleString()}/{budget.period}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
                  <select
                    value={formData.season}
                    onChange={(e) => setFormData({...formData, season: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="spring">Spring 🌸</option>
                    <option value="summer">Summer ☀️</option>
                    <option value="fall">Fall 🍂</option>
                    <option value="winter">Winter ❄️</option>
                    <option value="holiday">Holiday 🎄</option>
                    <option value="custom">Custom 📅</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                  <select
                    value={formData.adjustmentType}
                    onChange={(e) => setFormData({...formData, adjustmentType: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adjustment Value {formData.adjustmentType === 'percentage' ? '(%)' : '(₹)'}
                </label>
                <input
                  type="number"
                  value={formData.adjustmentValue}
                  onChange={(e) => setFormData({...formData, adjustmentValue: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder={formData.adjustmentType === 'percentage' ? '25' : '5000'}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Describe why this adjustment is needed..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApply"
                  checked={formData.autoApply}
                  onChange={(e) => setFormData({...formData, autoApply: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoApply" className="ml-2 block text-sm text-gray-900">
                  Automatically apply this adjustment during the specified period
                </label>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  {editingAdjustment ? 'Update Adjustment' : 'Create Adjustment'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAdjustment(null);
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
    </div>
  );
};