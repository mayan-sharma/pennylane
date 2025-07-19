import React from 'react';
import { formatShortcut, getModifierKey } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const modKey = getModifierKey();

  const shortcutCategories = [
    {
      title: 'General',
      shortcuts: [
        { key: `${modKey}+N`, description: 'Add new expense' },
        { key: `${modKey}+F`, description: 'Search expenses' },
        { key: `${modKey}+Shift+F`, description: 'Toggle advanced filters' },
        { key: `${modKey}+E`, description: 'Export expenses' },
        { key: `${modKey}+R`, description: 'Refresh data' },
        { key: 'Q', description: 'Quick add expense' },
        { key: '?', description: 'Show this help' },
      ]
    },
    {
      title: 'Navigation',
      shortcuts: [
        { key: '↑ ↓', description: 'Navigate up/down in list' },
        { key: '← →', description: 'Navigate left/right in table' },
        { key: 'Enter', description: 'Select/activate item' },
        { key: 'Space', description: 'Toggle item selection' },
        { key: 'Tab', description: 'Move to next element' },
        { key: 'Shift+Tab', description: 'Move to previous element' },
      ]
    },
    {
      title: 'Selection & Actions',
      shortcuts: [
        { key: `${modKey}+A`, description: 'Select all expenses' },
        { key: `${modKey}+D`, description: 'Duplicate selected expense' },
        { key: `${modKey}+Enter`, description: 'Edit selected expense' },
        { key: 'Delete', description: 'Delete selected expenses' },
        { key: 'Backspace', description: 'Delete selected expenses' },
      ]
    },
    {
      title: 'Forms & Dialogs',
      shortcuts: [
        { key: `${modKey}+Enter`, description: 'Save form' },
        { key: 'Esc', description: 'Cancel/close form or dialog' },
        { key: `${modKey}+S`, description: 'Save (in forms)' },
        { key: 'Tab', description: 'Next field' },
        { key: 'Shift+Tab', description: 'Previous field' },
      ]
    },
    {
      title: 'Quick Actions',
      shortcuts: [
        { key: `${modKey}+1`, description: 'Switch to Dashboard' },
        { key: `${modKey}+2`, description: 'Switch to Expenses' },
        { key: `${modKey}+3`, description: 'Switch to Analytics' },
        { key: `${modKey}+4`, description: 'Switch to Budgets' },
        { key: `${modKey}+5`, description: 'Switch to Tax' },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Keyboard Shortcuts</h2>
            <p className="text-sm text-gray-600 mt-1">
              Use these shortcuts to navigate and work faster
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {shortcutCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  {category.title}
                </h3>
                <div className="space-y-3">
                  {category.shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex items-center justify-between py-2">
                      <span className="text-gray-700">{shortcut.description}</span>
                      <div className="flex items-center space-x-1">
                        {shortcut.key.split('+').map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && <span className="text-gray-400 text-sm">+</span>}
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-md shadow-sm">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tips */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pro Tips
            </h4>
            <ul className="text-sm text-blue-800 space-y-2">
              <li>• Hold <kbd className="px-1 py-0.5 text-xs bg-blue-100 rounded">Shift</kbd> while selecting to select ranges</li>
              <li>• Use <kbd className="px-1 py-0.5 text-xs bg-blue-100 rounded">{modKey}</kbd> + click to select multiple items</li>
              <li>• Most shortcuts work globally, even when not focused on specific elements</li>
              <li>• Press <kbd className="px-1 py-0.5 text-xs bg-blue-100 rounded">?</kbd> anytime to open this help dialog</li>
              <li>• Shortcuts are disabled when typing in input fields</li>
            </ul>
          </div>

          {/* Browser Compatibility */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Browser Compatibility</h4>
            <p className="text-sm text-gray-600">
              These shortcuts work in all modern browsers. On Mac, use <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">⌘</kbd> (Cmd) 
              instead of <kbd className="px-1 py-0.5 text-xs bg-gray-100 rounded">Ctrl</kbd>. 
              Some shortcuts may conflict with browser shortcuts - in such cases, the browser shortcut takes precedence.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Press <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded shadow-sm">Esc</kbd> to close
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};