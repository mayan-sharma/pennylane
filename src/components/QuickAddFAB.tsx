import React, { useState, useRef, useEffect } from 'react';
import { type QuickAddPreset, type ExpenseTemplate } from '../types/expense';

interface QuickAddFABProps {
  quickAddPresets: QuickAddPreset[];
  templates: ExpenseTemplate[];
  onQuickAdd: (presetId: string) => void;
  onTemplateAdd: (templateId: string) => void;
  onOpenFullForm: () => void;
}

export const QuickAddFAB: React.FC<QuickAddFABProps> = ({
  quickAddPresets,
  templates,
  onQuickAdd,
  onTemplateAdd,
  onOpenFullForm
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const defaultPresets = quickAddPresets.filter(p => p.isDefault);
  const popularTemplates = templates
    .filter(t => t.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  const handleQuickAdd = (presetId: string) => {
    onQuickAdd(presetId);
    setIsOpen(false);
  };

  const handleTemplateAdd = (templateId: string) => {
    onTemplateAdd(templateId);
    setIsOpen(false);
  };

  const handleFullFormOpen = () => {
    onOpenFullForm();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="fixed bottom-6 right-6 z-50">
      {/* Quick Actions Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-20 -z-10" />
          
          {/* Menu */}
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border min-w-80 max-w-sm">
            {/* Header with tabs */}
            <div className="p-3 border-b">
              <div className="flex space-x-1">
                <button
                  onClick={() => setShowPresets(true)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    showPresets 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Quick Add
                </button>
                <button
                  onClick={() => setShowPresets(false)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    !showPresets 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Templates
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="max-h-80 overflow-y-auto">
              {showPresets ? (
                /* Quick Add Presets */
                <div className="p-2">
                  {defaultPresets.length > 0 ? (
                    <div className="space-y-1">
                      {defaultPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => handleQuickAdd(preset.id)}
                          className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <div className="text-2xl">{preset.icon || '💰'}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{preset.name}</div>
                            <div className="text-sm text-gray-500">
                              {preset.category}
                              {preset.amount && ` • ₹${preset.amount}`}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-3xl mb-2">🚀</div>
                      <p className="text-sm">No quick add presets</p>
                      <p className="text-xs">Set up presets in settings</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Templates */
                <div className="p-2">
                  {popularTemplates.length > 0 ? (
                    <div className="space-y-1">
                      {popularTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateAdd(template.id)}
                          className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-md transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-medium">
                                T
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{template.name}</div>
                            <div className="text-sm text-gray-500">
                              {template.category}
                              {template.amount && ` • ₹${template.amount}`}
                              <span className="ml-1 text-xs">({template.usageCount} uses)</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-3xl mb-2">📝</div>
                      <p className="text-sm">No templates yet</p>
                      <p className="text-xs">Create templates to speed up entry</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={handleFullFormOpen}
                className="w-full flex items-center justify-center space-x-2 p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-sm font-medium">Full Form</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center ${
          isOpen 
            ? 'bg-red-600 hover:bg-red-700 transform rotate-45' 
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-110'
        }`}
      >
        <svg 
          className="w-6 h-6 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
          />
        </svg>
      </button>

      {/* Keyboard shortcut hint (shows only on first few loads) */}
      {!isOpen && (
        <div className="absolute -top-12 right-0 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Press 'N' for new expense
        </div>
      )}
    </div>
  );
};