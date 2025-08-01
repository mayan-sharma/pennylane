import React, { useState, useEffect } from 'react';
import { ExpenseCategory, type Expense, type Receipt, type ExpenseTemplate, type Currency } from '../types';
import { ReceiptUpload } from './ReceiptUpload';
import { suggestCategory, type SuggestionResult } from '../services/categorizationService';

interface ExpenseFormProps {
  onSubmit: (data: ExtendedExpenseFormData) => void;
  onCancel: () => void;
  initialData?: Expense;
  isEditing?: boolean;
  templates?: ExpenseTemplate[];
  currencies?: Currency[];
  onReceiptAdd?: (expenseId: string, receipt: Omit<Receipt, 'id' | 'uploadDate'>) => void;
  customCategories?: string[];
}

interface ExtendedExpenseFormData {
  date: string;
  amount: string;
  category: ExpenseCategory | string;
  description: string;
  merchant?: string;
  tags?: string[];
  paymentMethod?: 'cash' | 'card' | 'bank_transfer' | 'digital_wallet' | 'other';
  notes?: string;
  currency?: string;
  receipts?: Receipt[];
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  templates = [],
  currencies = [],
  onReceiptAdd,
  customCategories = []
}) => {
  const [formData, setFormData] = useState<ExtendedExpenseFormData>({
    date: new Date().toISOString().split('T')[0],
    amount: '',
    category: ExpenseCategory.OTHER,
    description: '',
    merchant: '',
    tags: [],
    paymentMethod: 'card',
    notes: '',
    currency: 'INR',
    receipts: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ExtendedExpenseFormData, string>>>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categoryPrediction, setCategoryPrediction] = useState<SuggestionResult | null>(null);
  const [showCategoryHelp, setShowCategoryHelp] = useState(false);

  const allCategories = [...Object.values(ExpenseCategory), ...customCategories];

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        amount: initialData.amount.toString(),
        category: initialData.category,
        description: initialData.description,
        merchant: initialData.merchant || '',
        tags: initialData.tags || [],
        paymentMethod: initialData.paymentMethod || 'card',
        notes: initialData.notes || '',
        currency: initialData.currency || 'INR',
        receipts: initialData.receipts || [],
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ExtendedExpenseFormData, string>> = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    
    if (parseFloat(formData.amount) > 10000000) {
      newErrors.amount = 'Amount cannot exceed ₹1,00,00,000';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (new Date(formData.date) > new Date()) {
      newErrors.date = 'Date cannot be in the future';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        tags: formData.tags?.filter(tag => tag.trim() !== '') || [],
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof ExtendedExpenseFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }

    // Trigger category prediction when relevant fields change
    if ((name === 'merchant' || name === 'description' || name === 'amount') && !isEditing) {
      // Debounce the prediction call
      setTimeout(predictCategory, 500);
    }
  };

  const handleTemplateSelect = (template: ExpenseTemplate) => {
    setFormData(prev => ({
      ...prev,
      amount: template.amount?.toString() || prev.amount,
      category: template.category as ExpenseCategory | string,
      description: template.description || prev.description,
      merchant: template.merchant || prev.merchant,
      tags: template.tags || prev.tags,
      paymentMethod: template.paymentMethod || prev.paymentMethod,
      notes: template.notes || prev.notes,
    }));
    setShowTemplates(false);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleReceiptAdd = (expenseId: string, receipt: Omit<Receipt, 'id' | 'uploadDate'>) => {
    const newReceipt: Receipt = {
      ...receipt,
      id: crypto.randomUUID(),
      uploadDate: new Date().toISOString(),
    };
    
    setFormData(prev => ({
      ...prev,
      receipts: [...(prev.receipts || []), newReceipt]
    }));
  };

  const handleOCRDataExtracted = (extractedData: Receipt['extractedData']) => {
    if (!extractedData) return;
    
    // Auto-fill form with extracted data (only if fields are empty)
    setFormData(prev => ({
      ...prev,
      amount: prev.amount || (extractedData.amount ? extractedData.amount.toString() : ''),
      merchant: prev.merchant || extractedData.merchant || '',
      date: prev.date || extractedData.date || prev.date,
      description: prev.description || (extractedData.merchant ? `Purchase at ${extractedData.merchant}` : ''),
    }));

    // Show confirmation toast (you could add a toast notification here)
    console.log('Auto-filled form with OCR data:', extractedData);
    
    // Trigger categorization prediction after auto-fill
    if (extractedData.merchant || extractedData.amount) {
      predictCategory();
    }
  };

  const predictCategory = () => {
    // Only predict if we have enough data and no category is set
    if ((!formData.merchant && !formData.description) || formData.category !== ExpenseCategory.OTHER) {
      return;
    }

    try {
      const prediction = suggestCategory(formData.description, formData.merchant);

      if (prediction.confidence > 0.6) { // Only show high-confidence predictions
        setCategoryPrediction(prediction);
        setShowCategoryHelp(true);
      }
    } catch (error) {
      console.error('Category prediction failed:', error);
    }
  };

  const applyCategoryPrediction = () => {
    if (categoryPrediction) {
      setFormData(prev => ({
        ...prev,
        category: categoryPrediction.category,
      }));
      setCategoryPrediction(null);
      setShowCategoryHelp(false);
    }
  };

  const dismissCategoryPrediction = () => {
    setCategoryPrediction(null);
    setShowCategoryHelp(false);
  };

  const popularTemplates = templates
    .filter(t => t.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {isEditing ? 'Edit Expense' : 'Add New Expense'}
            </h2>
            <div className="flex space-x-2">
              {templates.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  📝 Templates
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
              >
                {showAdvanced ? 'Basic' : 'Advanced'}
              </button>
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Templates Quick Select */}
          {showTemplates && popularTemplates.length > 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Templates</h3>
              <div className="flex flex-wrap gap-2">
                {popularTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="px-3 py-2 text-sm bg-white hover:bg-blue-50 border border-gray-200 rounded-md transition-colors"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-gray-500">
                      {template.category} • {template.amount ? `₹${template.amount}` : 'No amount'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Fields */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.date ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.date && (
                  <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Amount ({currencies.find(c => c.code === formData.currency)?.symbol || '₹'}) *
                </label>
                <div className="flex">
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 ${
                      errors.amount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="0.00"
                  />
                  {currencies.length > 1 && (
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleChange}
                      className="px-3 py-2 border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                  {categoryPrediction && (
                    <button
                      type="button"
                      onClick={() => setShowCategoryHelp(!showCategoryHelp)}
                      className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                    >
                      🤖 AI Suggestion
                    </button>
                  )}
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {allCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                
                {/* Smart Category Suggestion */}
                {showCategoryHelp && categoryPrediction && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-blue-800">
                            AI suggests: <span className="font-bold">{categoryPrediction.category}</span>
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {Math.round(categoryPrediction.confidence * 100)}% confident
                          </span>
                        </div>
                        <div className="text-xs text-blue-700">
                          Based on your description and merchant information
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-3">
                        <button
                          type="button"
                          onClick={applyCategoryPrediction}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          onClick={dismissCategoryPrediction}
                          className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="merchant" className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant
                </label>
                <input
                  type="text"
                  id="merchant"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Starbucks, Amazon"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Brief description of the expense..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Advanced Fields */}
            {showAdvanced && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Method
                    </label>
                    <select
                      id="paymentMethod"
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="digital_wallet">Digital Wallet</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add a tag..."
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                    {formData.tags && formData.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-md"
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes or details..."
                  />
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Receipt Images
                  </label>
                  <ReceiptUpload
                    expenseId={initialData?.id || 'new'}
                    existingReceipts={formData.receipts}
                    onReceiptAdd={handleReceiptAdd}
                    onDataExtracted={handleOCRDataExtracted}
                  />
                </div>
              </>
            )}

            <div className="flex space-x-3 pt-6 border-t">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {isEditing ? 'Update Expense' : 'Add Expense'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};