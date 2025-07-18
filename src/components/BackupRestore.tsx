import React, { useState } from 'react';
import { storage } from '../utils/localStorage';

interface BackupRestoreProps {
  onRestore: () => void;
}

export const BackupRestore: React.FC<BackupRestoreProps> = ({ onRestore }) => {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCreateBackup = () => {
    try {
      const backupData = storage.createBackup();
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = `expense-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Backup created successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: 'error', text: 'Failed to create backup. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backupData = e.target?.result as string;
        const result = storage.restoreFromBackup(backupData);
        
        if (result.success) {
          setMessage({ type: 'success', text: result.message });
          onRestore();
        } else {
          setMessage({ type: 'error', text: result.message });
        }
      } catch {
        setMessage({ type: 'error', text: 'Failed to restore backup. Please check the file format.' });
      } finally {
        setIsRestoring(false);
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      setMessage({ type: 'error', text: 'Failed to read backup file.' });
      setIsRestoring(false);
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">Backup & Restore</h3>
      
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Create Backup</h4>
          <p className="text-sm text-gray-600 mb-3">
            Download a backup of all your expenses as a JSON file.
          </p>
          <button
            onClick={handleCreateBackup}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Create backup of all expenses"
          >
            Create Backup
          </button>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Restore from Backup</h4>
          <p className="text-sm text-gray-600 mb-3">
            Upload a backup file to restore your expenses. This will replace all existing data.
          </p>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreBackup}
              disabled={isRestoring}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              aria-label="Select backup file to restore"
            />
            {isRestoring && (
              <div className="flex items-center text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Restoring...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};