import React, { useState, useRef } from 'react';
import { type Receipt } from '../types';
import { ocrService } from '../services/ocrService';

interface ReceiptUploadProps {
  expenseId: string;
  existingReceipts?: Receipt[];
  onReceiptAdd: (expenseId: string, receipt: Omit<Receipt, 'id' | 'uploadDate'>) => void;
  onReceiptRemove?: (expenseId: string, receiptId: string) => void;
  onDataExtracted?: (extractedData: Receipt['extractedData']) => void;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  expenseId,
  existingReceipts = [],
  onReceiptAdd,
  onReceiptRemove,
  onDataExtracted
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [availableProviders] = useState(() => ocrService.getAvailableProviders());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    setUploading(true);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not a valid image file`);
        continue;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`);
        continue;
      }

      try {
        // Create object URL for preview
        const url = URL.createObjectURL(file);
        
        // Extract data using enhanced OCR service
        setProcessingStatus(`Processing ${file.name} with OCR...`);
        const extractedData = await ocrService.extractReceiptData(file);
        
        // Notify parent component of extracted data for auto-filling
        if (onDataExtracted && extractedData && Object.keys(extractedData).length > 0) {
          onDataExtracted(extractedData);
        }
        
        const receipt: Omit<Receipt, 'id' | 'uploadDate'> = {
          filename: file.name,
          url,
          size: file.size,
          type: file.type,
          extractedData,
        };

        onReceiptAdd(expenseId, receipt);
      } catch (error) {
        console.error('Error processing receipt:', error);
        setProcessingStatus(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Still add the receipt without extracted data
        const url = URL.createObjectURL(file);
        const receipt: Omit<Receipt, 'id' | 'uploadDate'> = {
          filename: file.name,
          url,
          size: file.size,
          type: file.type,
          extractedData: undefined,
        };
        onReceiptAdd(expenseId, receipt);
      }
    }
    
    setUploading(false);
    setProcessingStatus('');
  };


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-sm text-gray-600">
              {processingStatus || 'Processing receipts...'}
            </p>
            {availableProviders.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Using: {availableProviders.join(', ')}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">Upload Receipt Images</p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop images here, or click to select files
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Choose Files
            </button>
            <p className="text-xs text-gray-400 mt-2">
              Supports: JPG, PNG, GIF (max 5MB each)
            </p>
          </div>
        )}
      </div>

      {/* Existing Receipts */}
      {existingReceipts.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Uploaded Receipts</h4>
          <div className="grid grid-cols-1 gap-3">
            {existingReceipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <img
                    src={receipt.url}
                    alt={receipt.filename}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                </div>
                
                <div className="flex-grow min-w-0">
                  <p className="font-medium text-gray-900 truncate">{receipt.filename}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(receipt.size)}</p>
                  
                  {receipt.extractedData && (
                    <div className="mt-2 space-y-1">
                      {receipt.extractedData.amount && (
                        <p className="text-xs text-green-600">
                          Detected amount: ₹{receipt.extractedData.amount.toFixed(2)}
                        </p>
                      )}
                      {receipt.extractedData.merchant && (
                        <p className="text-xs text-blue-600">
                          Merchant: {receipt.extractedData.merchant}
                        </p>
                      )}
                      {receipt.extractedData.date && (
                        <p className="text-xs text-purple-600">
                          Date: {receipt.extractedData.date}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => window.open(receipt.url, '_blank')}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                    title="View full size"
                  >
                    View
                  </button>
                  {onReceiptRemove && (
                    <button
                      onClick={() => onReceiptRemove(expenseId, receipt.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title="Remove receipt"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced OCR Info */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div className="flex-grow">
            <h5 className="text-sm font-medium text-blue-800">Advanced Receipt Scanning</h5>
            <p className="text-sm text-blue-700 mt-1">
              AI-powered OCR automatically extracts amount, merchant, date, and line items from your receipts.
              {availableProviders.length > 0 && (
                <span className="block mt-1">
                  Available providers: <span className="font-medium">{availableProviders.join(', ')}</span>
                </span>
              )}
            </p>
            
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center text-green-600">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Smart amount detection
              </div>
              <div className="flex items-center text-green-600">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Merchant recognition
              </div>
              <div className="flex items-center text-green-600">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Date extraction
              </div>
              <div className="flex items-center text-green-600">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Line item breakdown
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};