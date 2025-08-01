import React, { useState } from 'react';
import { type QuickAddPreset } from '../types';

interface QuickAddFABProps {
  presets: QuickAddPreset[];
  onQuickAdd: (preset: QuickAddPreset) => void;
  onAddExpense: () => void;
}

export const QuickAddFAB: React.FC<QuickAddFABProps> = ({
  presets,
  onQuickAdd,
  onAddExpense
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-4 space-y-2">
          {presets.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                onQuickAdd(preset);
                setIsOpen(false);
              }}
              className="block w-full bg-white shadow-lg rounded-full px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border"
            >
              {preset.name} {preset.amount && `- $${preset.amount}`}
            </button>
          ))}
          <button
            onClick={() => {
              onAddExpense();
              setIsOpen(false);
            }}
            className="block w-full bg-blue-600 text-white shadow-lg rounded-full px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Add Custom Expense
          </button>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-transform transform hover:scale-105"
        aria-label={isOpen ? "Close quick add menu" : "Open quick add menu"}
      >
        <svg 
          className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-45' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
};