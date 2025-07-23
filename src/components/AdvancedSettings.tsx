import React, { useState, useEffect } from 'react';
import { useAppSettings, useTheme, useCurrency, useExperimentalFeatures } from '../hooks/useAppSettings';
import { stateManager } from '../utils/stateManager';
import { getStorageQuota } from '../utils/localStorage';

export const AdvancedSettings: React.FC = () => {
  const { settings, updateSetting, updateSettings, resetSettings, exportSettings, importSettings } = useAppSettings();
  const { theme, setTheme, isDark } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const { experimentalFeatures, betaFeatures, isFeatureEnabled, enableFeature, disableFeature } = useExperimentalFeatures();
  
  const [storageStats, setStorageStats] = useState<any>(null);
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const loadStorageStats = async () => {
      const stats = await stateManager.getStorageStats();
      setStorageStats(stats);
    };
    
    loadStorageStats();
    const interval = setInterval(loadStorageStats, 30000); // Update every 30s
    
    return () => clearInterval(interval);
  }, []);

  const handleExportSettings = () => {
    const data = exportSettings();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pennylane-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const result = importSettings(importData);
    alert(result.message);
    if (result.success) {
      setShowImport(false);
      setImportData('');
    }
  };

  const handleOptimizeStorage = async () => {
    const result = await stateManager.optimizeStorage();
    alert(`Storage optimized! Compressed: ${result.itemsCompressed}, Removed: ${result.itemsRemoved}, Space reclaimed: ${(result.spaceReclaimed / 1024).toFixed(1)}KB`);
    const stats = await stateManager.getStorageStats();
    setStorageStats(stats);
  };

  const handleCreateSnapshot = () => {
    const snapshot = stateManager.createSnapshot(`manual-${Date.now()}`);
    alert(`Snapshot created: ${snapshot.id}`);
  };

  const availableFeatures = [
    { id: 'ai-categorization', name: 'AI Smart Categorization', description: 'Use AI to automatically categorize expenses' },
    { id: 'predictive-budgets', name: 'Predictive Budgeting', description: 'AI-powered budget predictions' },
    { id: 'voice-input', name: 'Voice Input', description: 'Add expenses using voice commands' },
    { id: 'real-time-sync', name: 'Real-time Sync', description: 'Sync data across devices in real-time' },
    { id: 'advanced-analytics', name: 'Advanced Analytics', description: 'Enhanced charts and insights' }
  ];

  const currencyOptions = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Advanced Settings</h2>

        {/* Theme & Appearance */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Theme & Appearance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                {currencyOptions.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.symbol} {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select
                value={settings.dateFormat}
                onChange={(e) => updateSetting('dateFormat', e.target.value as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="compact-mode"
                checked={settings.compactMode}
                onChange={(e) => updateSetting('compactMode', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="compact-mode" className="text-sm font-medium">
                Compact Mode
              </label>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Data Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-backup"
                checked={settings.autoBackup}
                onChange={(e) => updateSetting('autoBackup', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="auto-backup" className="text-sm font-medium">
                Auto Backup
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="compression"
                checked={settings.compressionEnabled}
                onChange={(e) => updateSetting('compressionEnabled', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="compression" className="text-sm font-medium">
                Enable Compression
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Data Retention (days)</label>
              <input
                type="number"
                value={settings.dataRetention}
                onChange={(e) => updateSetting('dataRetention', parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
                min="30"
                max="3650"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                className="w-full p-2 border rounded-md"
                min="5"
                max="480"
              />
            </div>
          </div>
        </div>

        {/* Storage Information */}
        {storageStats && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Storage Information</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Total Size</div>
                  <div>{(storageStats.totalSize / 1024).toFixed(1)} KB</div>
                </div>
                <div>
                  <div className="font-medium">Items Count</div>
                  <div>{storageStats.itemCount}</div>
                </div>
                <div>
                  <div className="font-medium">Health Score</div>
                  <div className={`font-bold ${
                    storageStats.healthScore > 80 ? 'text-green-600' :
                    storageStats.healthScore > 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {storageStats.healthScore}%
                  </div>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={handleOptimizeStorage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Optimize Storage
                </button>
                <button
                  onClick={handleCreateSnapshot}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Create Snapshot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Experimental Features */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Experimental Features</h3>
          <div className="space-y-3">
            {availableFeatures.map(feature => (
              <div key={feature.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div>
                  <div className="font-medium">{feature.name}</div>
                  <div className="text-sm text-gray-600">{feature.description}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isFeatureEnabled(feature.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        enableFeature(feature.id);
                      } else {
                        disableFeature(feature.id);
                      }
                    }}
                    className="mr-2"
                  />
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    BETA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings Import/Export */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Settings Backup</h3>
          <div className="flex space-x-4">
            <button
              onClick={handleExportSettings}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Export Settings
            </button>
            <button
              onClick={() => setShowImport(!showImport)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Import Settings
            </button>
            <button
              onClick={resetSettings}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Reset to Defaults
            </button>
          </div>

          {showImport && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <label className="block text-sm font-medium mb-2">
                Paste settings JSON:
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full p-2 border rounded-md h-32"
                placeholder="Paste your exported settings JSON here..."
              />
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={handleImportSettings}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  disabled={!importData.trim()}
                >
                  Import
                </button>
                <button
                  onClick={() => {
                    setShowImport(false);
                    setImportData('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Debug Information */}
        <div className="pt-4 border-t">
          <button
            onClick={() => stateManager.debug()}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            🔍 Open Debug Console
          </button>
        </div>
      </div>
    </div>
  );
};