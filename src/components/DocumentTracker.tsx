import React, { useState, useMemo } from 'react';

interface TaxDocument {
  id: string;
  name: string;
  type: 'income' | 'investment' | 'deduction' | 'other';
  category: string;
  status: 'pending' | 'uploaded' | 'verified' | 'expired';
  dueDate?: Date;
  uploadedDate?: Date;
  description: string;
  priority: 'high' | 'medium' | 'low';
  isRequired: boolean;
}

interface DocumentTrackerProps {
  onUploadDocument?: (document: TaxDocument) => void;
}

export const DocumentTracker: React.FC<DocumentTrackerProps> = () => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'uploaded' | 'verified' | 'expired'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sample documents - in a real app, this would come from props or a hook
  const documents: TaxDocument[] = useMemo(() => [
    {
      id: '1',
      name: 'Form 16',
      type: 'income',
      category: 'Salary Income',
      status: 'uploaded',
      uploadedDate: new Date('2024-05-15'),
      description: 'Annual salary certificate from employer',
      priority: 'high',
      isRequired: true
    },
    {
      id: '2',
      name: '80C Investment Proof',
      type: 'investment',
      category: 'Tax Saving',
      status: 'pending',
      dueDate: new Date('2024-07-31'),
      description: 'ELSS, PPF, EPF investment proofs',
      priority: 'high',
      isRequired: true
    },
    {
      id: '3',
      name: 'Medical Insurance Premium',
      type: 'deduction',
      category: 'Health Insurance',
      status: 'verified',
      uploadedDate: new Date('2024-04-20'),
      description: 'Health insurance premium receipts for 80D',
      priority: 'medium',
      isRequired: true
    },
    {
      id: '4',
      name: 'Home Loan Interest Certificate',
      type: 'deduction',
      category: 'Housing',
      status: 'pending',
      dueDate: new Date('2024-06-30'),
      description: 'Annual interest certificate from bank',
      priority: 'medium',
      isRequired: false
    },
    {
      id: '5',
      name: 'Bank Interest Certificate',
      type: 'income',
      category: 'Other Income',
      status: 'expired',
      dueDate: new Date('2024-05-31'),
      description: 'Interest earned on savings account',
      priority: 'low',
      isRequired: false
    },
    {
      id: '6',
      name: 'Donation Receipts',
      type: 'deduction',
      category: 'Charitable Donations',
      status: 'pending',
      description: 'Receipts for 80G deductions',
      priority: 'low',
      isRequired: false
    }
  ], []);

  const categories = useMemo(() => {
    const cats = new Set(documents.map(doc => doc.category));
    return ['all', ...Array.from(cats)];
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const statusMatch = filter === 'all' || doc.status === filter;
      const categoryMatch = selectedCategory === 'all' || doc.category === selectedCategory;
      return statusMatch && categoryMatch;
    });
  }, [documents, filter, selectedCategory]);

  const getStatusIcon = (status: TaxDocument['status']) => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'uploaded':
        return '📄';
      case 'verified':
        return '✅';
      case 'expired':
        return '⚠️';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status: TaxDocument['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'uploaded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: TaxDocument['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTypeIcon = (type: TaxDocument['type']) => {
    switch (type) {
      case 'income':
        return '💰';
      case 'investment':
        return '📈';
      case 'deduction':
        return '🧾';
      case 'other':
        return '📋';
      default:
        return '📄';
    }
  };

  const getDocumentStats = () => {
    const total = documents.length;
    const pending = documents.filter(d => d.status === 'pending').length;
    const verified = documents.filter(d => d.status === 'verified').length;
    const expired = documents.filter(d => d.status === 'expired').length;
    
    return { total, pending, verified, expired };
  };

  const stats = getDocumentStats();

  const handleUpload = (docId: string) => {
    // In a real app, this would trigger file upload
    console.log('Upload document:', docId);
  };

  const isDueSoon = (dueDate?: Date) => {
    if (!dueDate) return false;
    const now = new Date();
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 30 && daysDiff > 0;
  };

  const isOverdue = (dueDate?: Date) => {
    if (!dueDate) return false;
    return new Date() > dueDate;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Document Tracker</h3>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
          onClick={() => {/* Handle add new document */}}
        >
          + Add Document
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Documents</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          <div className="text-sm text-gray-500">Verified</div>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          <div className="text-sm text-gray-500">Expired</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="uploaded">Uploaded</option>
              <option value="verified">Verified</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-lg border">
        <div className="space-y-0">
          {filteredDocuments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No documents found matching your filters
            </div>
          ) : (
            filteredDocuments.map((doc, index) => (
              <div 
                key={doc.id} 
                className={`p-4 border-l-4 ${
                  doc.isRequired ? 'border-l-blue-500' : 'border-l-gray-300'
                } ${index !== filteredDocuments.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{getTypeIcon(doc.type)}</span>
                      <h4 className="font-medium text-gray-900">{doc.name}</h4>
                      {doc.isRequired && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Required</span>
                      )}
                      <span className={`text-xs font-medium ${getPriorityColor(doc.priority)}`}>
                        {doc.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{doc.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <span>Category:</span>
                        <span className="font-medium">{doc.category}</span>
                      </span>
                      
                      {doc.dueDate && (
                        <span className={`flex items-center space-x-1 ${
                          isOverdue(doc.dueDate) ? 'text-red-600' :
                          isDueSoon(doc.dueDate) ? 'text-orange-600' : ''
                        }`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>
                            Due: {doc.dueDate.toLocaleDateString('en-IN')}
                            {isDueSoon(doc.dueDate) && !isOverdue(doc.dueDate) && ' (Soon)'}
                            {isOverdue(doc.dueDate) && ' (Overdue)'}
                          </span>
                        </span>
                      )}
                      
                      {doc.uploadedDate && (
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span>Uploaded: {doc.uploadedDate.toLocaleDateString('en-IN')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(doc.status)}`}>
                      <span className="mr-1">{getStatusIcon(doc.status)}</span>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                    
                    {doc.status === 'pending' && (
                      <button
                        onClick={() => handleUpload(doc.id)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                      >
                        Upload
                      </button>
                    )}
                    
                    <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};