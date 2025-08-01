import React from 'react';
import type { Receipt } from '../types';

interface ReceiptUploadProps {
  expenseId: string;
  existingReceipts?: Receipt[];
  onReceiptAdd: (expenseId: string, receipt: Omit<Receipt, 'id' | 'uploadDate'>) => void;
  onDataExtracted?: (extractedData: Receipt['extractedData']) => void;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  expenseId,
  existingReceipts = [],
  onReceiptAdd,
  onDataExtracted
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const receipt: Omit<Receipt, 'id' | 'uploadDate'> = {
          filename: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
          extractedData: undefined
        };
        onReceiptAdd(expenseId, receipt);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          id="receipt-upload"
        />
        <label htmlFor="receipt-upload" className="cursor-pointer">
          <div className="text-gray-400 mb-2">📸</div>
          <div className="text-sm text-gray-600">
            Click to upload receipt images
          </div>
          <div className="text-xs text-gray-500 mt-1">
            PNG, JPG up to 10MB each
          </div>
        </label>
      </div>

      {existingReceipts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Receipts</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {existingReceipts.map((receipt) => (
              <div key={receipt.id} className="relative group">
                <img
                  src={receipt.url}
                  alt={receipt.filename}
                  className="w-full h-20 object-cover rounded border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                  <span className="text-white text-xs text-center p-1">
                    {receipt.filename}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};