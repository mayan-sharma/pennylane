import { useEffect, useCallback, useState } from 'react';

interface KeyboardShortcutsConfig {
  onNewExpense?: () => void;
  onSearch?: () => void;
  onToggleFilters?: () => void;
  onExport?: () => void;
  onBulkSelect?: () => void;
  onRefresh?: () => void;
  onHelp?: () => void;
  onQuickAdd?: () => void;
  onNavigateUp?: () => void;
  onNavigateDown?: () => void;
  onNavigateLeft?: () => void;
  onNavigateRight?: () => void;
  onSelectItem?: () => void;
  onDeleteSelected?: () => void;
  onEditSelected?: () => void;
  onDuplicate?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

interface ShortcutInfo {
  key: string;
  description: string;
  action: string;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    const modKey = ctrlKey || metaKey; // Use Cmd on Mac, Ctrl on PC

    // Prevent default browser shortcuts that we're overriding
    const shouldPreventDefault = () => {
      if (modKey && key === 'n') return true; // New expense
      if (modKey && key === 'f') return true; // Search
      if (modKey && key === 'r') return true; // Refresh
      if (modKey && key === 'e') return true; // Export
      if (modKey && key === 'a') return true; // Select all
      if (key === '?' || (shiftKey && key === '/')) return true; // Help
      return false;
    };

    if (shouldPreventDefault()) {
      event.preventDefault();
    }

    // Handle shortcuts
    try {
      // Global shortcuts
      if (modKey && key === 'n') {
        config.onNewExpense?.();
      } else if (modKey && key === 'f') {
        config.onSearch?.();
      } else if (modKey && shiftKey && key === 'F') {
        config.onToggleFilters?.();
      } else if (modKey && key === 'e') {
        config.onExport?.();
      } else if (modKey && key === 'a') {
        config.onBulkSelect?.();
      } else if (modKey && key === 'r') {
        config.onRefresh?.();
      } else if (key === '?' || (shiftKey && key === '/')) {
        config.onHelp?.();
      } else if (key === 'q' && !modKey) {
        config.onQuickAdd?.();
      }

      // Navigation shortcuts (when not in input)
      else if (key === 'ArrowUp' && !modKey) {
        config.onNavigateUp?.();
        event.preventDefault();
      } else if (key === 'ArrowDown' && !modKey) {
        config.onNavigateDown?.();
        event.preventDefault();
      } else if (key === 'ArrowLeft' && !modKey) {
        config.onNavigateLeft?.();
        event.preventDefault();
      } else if (key === 'ArrowRight' && !modKey) {
        config.onNavigateRight?.();
        event.preventDefault();
      } else if (key === 'Enter' && !modKey) {
        config.onSelectItem?.();
      } else if (key === ' ' && !modKey) {
        config.onSelectItem?.();
        event.preventDefault();
      }

      // Item action shortcuts
      else if (key === 'Delete' || key === 'Backspace') {
        if (!modKey) {
          config.onDeleteSelected?.();
          event.preventDefault();
        }
      } else if (key === 'Enter' && modKey) {
        config.onEditSelected?.();
      } else if (key === 'd' && modKey) {
        config.onDuplicate?.();
      }

      // Form shortcuts
      else if (key === 'Enter' && modKey) {
        config.onSave?.();
      } else if (key === 'Escape') {
        config.onCancel?.();
      }

    } catch (error) {
      console.error('Error handling keyboard shortcut:', error);
    }
  }, [config]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return available shortcuts for help display
  const shortcuts: ShortcutInfo[] = [
    { key: 'Ctrl+N', description: 'Add new expense', action: 'new' },
    { key: 'Ctrl+F', description: 'Search expenses', action: 'search' },
    { key: 'Ctrl+Shift+F', description: 'Toggle advanced filters', action: 'filters' },
    { key: 'Ctrl+E', description: 'Export expenses', action: 'export' },
    { key: 'Ctrl+A', description: 'Select all expenses', action: 'selectAll' },
    { key: 'Ctrl+R', description: 'Refresh data', action: 'refresh' },
    { key: 'Q', description: 'Quick add expense', action: 'quickAdd' },
    { key: '?', description: 'Show help', action: 'help' },
    { key: '↑↓', description: 'Navigate up/down', action: 'navigate' },
    { key: '←→', description: 'Navigate left/right', action: 'navigate' },
    { key: 'Enter', description: 'Select item', action: 'select' },
    { key: 'Space', description: 'Toggle selection', action: 'toggle' },
    { key: 'Delete', description: 'Delete selected', action: 'delete' },
    { key: 'Ctrl+Enter', description: 'Edit selected / Save form', action: 'edit' },
    { key: 'Ctrl+D', description: 'Duplicate expense', action: 'duplicate' },
    { key: 'Esc', description: 'Cancel / Close', action: 'cancel' },
  ];

  return { shortcuts };
};

// Hook for showing keyboard shortcuts help
export const useShortcutsHelp = () => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const toggleHelp = useCallback(() => {
    setIsHelpOpen(prev => !prev);
  }, []);

  const closeHelp = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  // Close help on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isHelpOpen) {
        closeHelp();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isHelpOpen, closeHelp]);

  return {
    isHelpOpen,
    toggleHelp,
    closeHelp,
  };
};

// Helper to detect OS for showing correct modifier key
export const getModifierKey = () => {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘' : 'Ctrl';
};

// Format shortcut for display
export const formatShortcut = (shortcut: string) => {
  const modKey = getModifierKey();
  return shortcut.replace('Ctrl', modKey);
};