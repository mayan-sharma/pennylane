import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { getStorageData, setStorageData, StorageOptions } from '../utils/localStorage';

export interface AppSettings {
  // UI Preferences
  theme: 'light' | 'dark' | 'auto';
  currency: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  language: string;
  compactMode: boolean;
  
  // Dashboard Settings
  dashboardLayout: 'grid' | 'list';
  defaultTab: 'dashboard' | 'expenses' | 'budgets' | 'analytics' | 'taxes' | 'settings';
  showQuickAdd: boolean;
  showNotifications: boolean;
  
  // Data Management
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  dataRetention: number; // days
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  
  // Export Settings
  defaultExportFormat: 'JSON' | 'CSV' | 'PDF';
  includeCharts: boolean;
  
  // Privacy & Security
  sessionTimeout: number; // minutes
  requireConfirmation: boolean;
  analyticsEnabled: boolean;
  
  // Keyboard Shortcuts
  keyboardShortcuts: Record<string, string>;
  
  // Custom Categories & Tags
  customCategories: Array<{ id: string; name: string; color: string; icon: string }>;
  tags: string[];
  
  // Advanced Features
  aiSuggestionsEnabled: boolean;
  smartCategorization: boolean;
  budgetAlerts: boolean;
  expenseReminders: boolean;
  
  // Experimental Features
  experimentalFeatures: string[];
  betaFeatures: string[];
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  language: 'en',
  compactMode: false,
  
  dashboardLayout: 'grid',
  defaultTab: 'dashboard',
  showQuickAdd: true,
  showNotifications: true,
  
  autoBackup: true,
  backupFrequency: 'weekly',
  dataRetention: 365,
  compressionEnabled: true,
  encryptionEnabled: false,
  
  defaultExportFormat: 'JSON',
  includeCharts: true,
  
  sessionTimeout: 60,
  requireConfirmation: true,
  analyticsEnabled: true,
  
  keyboardShortcuts: {
    'add-expense': 'Ctrl+N',
    'search': 'Ctrl+K',
    'dashboard': 'Ctrl+1',
    'expenses': 'Ctrl+2',
    'budgets': 'Ctrl+3',
    'analytics': 'Ctrl+4',
    'taxes': 'Ctrl+5',
    'settings': 'Ctrl+6',
    'backup': 'Ctrl+B',
    'export': 'Ctrl+E'
  },
  
  customCategories: [],
  tags: [],
  
  aiSuggestionsEnabled: true,
  smartCategorization: true,
  budgetAlerts: true,
  expenseReminders: true,
  
  experimentalFeatures: [],
  betaFeatures: []
};

const SETTINGS_KEY = 'app-settings';
const SETTINGS_VERSION = '1.0';

const storageOptions: StorageOptions = {
  version: SETTINGS_VERSION,
  compress: true,
  syncAcrossTabs: true
};

interface AppSettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsData: string) => { success: boolean; message: string };
  getStorageInfo: () => { size: number; lastModified: number };
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const loadSettings = () => {
      const storedSettings = getStorageData(SETTINGS_KEY, defaultSettings, storageOptions);
      
      // Merge with defaults to ensure all new settings are present
      const mergedSettings = { ...defaultSettings, ...storedSettings };
      setSettings(mergedSettings);
      
      // Apply theme immediately
      applyTheme(mergedSettings.theme);
    };

    loadSettings();
  }, []);

  const applyTheme = (theme: AppSettings['theme']) => {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      setStorageData(SETTINGS_KEY, updated, storageOptions);
      
      // Apply immediate effects for certain settings
      if (key === 'theme') {
        applyTheme(value as AppSettings['theme']);
      }
      
      return updated;
    });
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };
      setStorageData(SETTINGS_KEY, updated, storageOptions);
      
      // Apply theme if it was updated
      if ('theme' in updates) {
        applyTheme(updated.theme);
      }
      
      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    setStorageData(SETTINGS_KEY, defaultSettings, storageOptions);
    applyTheme(defaultSettings.theme);
  }, []);

  const exportSettings = useCallback(() => {
    const exportData = {
      version: SETTINGS_VERSION,
      timestamp: new Date().toISOString(),
      settings
    };
    return JSON.stringify(exportData, null, 2);
  }, [settings]);

  const importSettings = useCallback((settingsData: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(settingsData);
      
      if (!data.version || !data.settings) {
        return { success: false, message: 'Invalid settings format' };
      }
      
      // Validate settings structure
      const importedSettings = { ...defaultSettings, ...data.settings };
      updateSettings(importedSettings);
      
      return { success: true, message: 'Settings imported successfully' };
    } catch (error) {
      return { success: false, message: `Failed to import settings: ${error}` };
    }
  }, [updateSettings]);

  const getStorageInfo = useCallback(() => {
    const data = localStorage.getItem(SETTINGS_KEY);
    return {
      size: new Blob([data || '']).size,
      lastModified: Date.now()
    };
  }, []);

  const contextValue: AppSettingsContextType = {
    settings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
    getStorageInfo
  };

  return (
    React.createElement(AppSettingsContext.Provider, { value: contextValue },
      children
    )
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};

// Specialized hooks for common settings
export const useTheme = () => {
  const { settings, updateSetting } = useAppSettings();
  return {
    theme: settings.theme,
    setTheme: (theme: AppSettings['theme']) => updateSetting('theme', theme),
    isDark: settings.theme === 'dark' || (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  };
};

export const useCurrency = () => {
  const { settings, updateSetting } = useAppSettings();
  return {
    currency: settings.currency,
    setCurrency: (currency: string) => updateSetting('currency', currency)
  };
};

export const useKeyboardShortcuts = () => {
  const { settings, updateSetting } = useAppSettings();
  return {
    shortcuts: settings.keyboardShortcuts,
    updateShortcut: (action: string, shortcut: string) => {
      updateSetting('keyboardShortcuts', {
        ...settings.keyboardShortcuts,
        [action]: shortcut
      });
    }
  };
};

export const useExperimentalFeatures = () => {
  const { settings, updateSetting } = useAppSettings();
  return {
    experimentalFeatures: settings.experimentalFeatures,
    betaFeatures: settings.betaFeatures,
    isFeatureEnabled: (feature: string) => 
      settings.experimentalFeatures.includes(feature) || settings.betaFeatures.includes(feature),
    enableFeature: (feature: string, isBeta = false) => {
      const key = isBeta ? 'betaFeatures' : 'experimentalFeatures';
      const current = settings[key];
      if (!current.includes(feature)) {
        updateSetting(key, [...current, feature]);
      }
    },
    disableFeature: (feature: string) => {
      updateSetting('experimentalFeatures', settings.experimentalFeatures.filter(f => f !== feature));
      updateSetting('betaFeatures', settings.betaFeatures.filter(f => f !== feature));
    }
  };
};