import React, { useState, useRef } from 'react';
import { type Receipt } from '../types/expense';

interface ReceiptUploadProps {
  expenseId: string;
  existingReceipts?: Receipt[];
  onReceiptAdd: (expenseId: string, receipt: Omit<Receipt, 'id' | 'uploadDate'>) => void;
  onReceiptRemove?: (expenseId: string, receiptId: string) => void;
}

export const ReceiptUpload: React.FC<ReceiptUploadProps> = ({
  expenseId,
  existingReceipts = [],
  onReceiptAdd,
  onReceiptRemove
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
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
        
        // Extract text from image (mock OCR - in real app would use OCR service)
        const extractedData = await mockOCRExtraction(file);
        
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
        alert(`Error processing ${file.name}`);
      }
    }
    
    setUploading(false);
  };

  // Mock OCR extraction - in real app would use OCR service like Tesseract.js or cloud service
  const mockOCRExtraction = async (file: File): Promise<Receipt['extractedData']> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock extracted data based on filename patterns
    const filename = file.name.toLowerCase();
    let mockData: Receipt['extractedData'] = {};
    
    if (filename.includes('receipt') || filename.includes('bill')) {
      mockData = {
        amount: Math.random() * 1000 + 100, // Random amount between 100-1100
        merchant: filename.includes('starbucks') ? 'Starbucks' : 
                 filename.includes('amazon') ? 'Amazon' :
                 filename.includes('grocery') ? 'Grocery Store' :
                 'Unknown Merchant',
        date: new Date().toISOString().split('T')[0],
        items: ['Item 1', 'Item 2', 'Tax']
      };
    }
    
    return mockData;
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
            <p className="mt-2 text-sm text-gray-600">Processing receipts...</p>
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

      {/* OCR Enhancement Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="text-sm font-medium text-blue-800">Smart Receipt Processing</h5>
            <p className="text-sm text-blue-700 mt-1">
              We automatically extract amount, merchant, and date information from your receipt images 
              to help you fill expense details faster.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};