import React, { useState, useMemo } from 'react';
import type { TaxDeduction, TaxDeductionFormData } from '../types/tax';
import { getFinancialYear, optimizeTaxStrategy } from '../utils/taxCalculation';
import { DEDUCTION_LIMITS } from '../types/tax';

interface TaxDeductionsProps {
  deductions: TaxDeduction[];
  onAddDeduction: (deduction: Omit<TaxDeduction, 'id' | 'createdAt'>) => void;
  onUpdateDeduction: (id: string, updates: Partial<TaxDeduction>) => void;
  onDeleteDeduction: (id: string) => void;
}

export const TaxDeductions: React.FC<TaxDeductionsProps> = ({
  deductions,
  onAddDeduction,
  onUpdateDeduction,
  onDeleteDeduction
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<TaxDeduction | null>(null);
  const [formData, setFormData] = useState<TaxDeductionFormData>({
    type: '80C',
    amount: '',
    description: '',
    category: '',
    financialYear: getFinancialYear()
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatCompactCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return formatCurrency(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const deductionData = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      financialYear: formData.financialYear
    };

    if (editingDeduction) {
      onUpdateDeduction(editingDeduction.id, deductionData);
    } else {
      onAddDeduction(deductionData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: '80C',
      amount: '',
      description: '',
      category: '',
      financialYear: getFinancialYear()
    });
    setShowForm(false);
    setEditingDeduction(null);
  };

  const handleEdit = (deduction: TaxDeduction) => {
    setEditingDeduction(deduction);
    setFormData({
      type: deduction.type,
      amount: deduction.amount.toString(),
      description: deduction.description,
      category: deduction.category,
      financialYear: deduction.financialYear
    });
    setShowForm(true);
  };

  const getDeductionLimit = (type: string) => {
    switch (type) {
      case '80C':
        return DEDUCTION_LIMITS['80C'];
      case 'MEDICAL_INSURANCE':
        return DEDUCTION_LIMITS['MEDICAL_INSURANCE'];
      default:
        return null;
    }
  };

  const currentFYDeductions = deductions.filter(d => d.financialYear === getFinancialYear());
  
  const deductionSummary = useMemo(() => {
    return currentFYDeductions.reduce((acc, deduction) => {
      const key = deduction.type;
      acc[key] = (acc[key] || 0) + deduction.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [currentFYDeductions]);

  const totalDeductions = useMemo(() => {
    return Object.values(deductionSummary).reduce((sum, amount) => sum + amount, 0);
  }, [deductionSummary]);

  const deductionDetails = useMemo(() => {
    const details = [
      {
        type: '80C',
        name: 'Section 80C',
        limit: DEDUCTION_LIMITS['80C'],
        current: deductionSummary['80C'] || 0,
        description: 'ELSS, PPF, NSC, Tax-saver FD, Life Insurance',
        color: 'blue',
        icon: '🏦'
      },
      {
        type: '80D',
        name: 'Health Insurance',
        limit: DEDUCTION_LIMITS['MEDICAL_INSURANCE'],
        current: deductionSummary['MEDICAL_INSURANCE'] || 0,
        description: 'Health insurance premiums',
        color: 'green',
        icon: '🏥'
      },
      {
        type: 'HRA',
        name: 'House Rent Allowance',
        limit: null,
        current: deductionSummary['HRA'] || 0,
        description: 'House rent allowance exemption',
        color: 'purple',
        icon: '🏠'
      },
      {
        type: 'OTHER',
        name: 'Other Deductions',
        limit: null,
        current: deductionSummary['OTHER'] || 0,
        description: 'Other qualifying deductions',
        color: 'orange',
        icon: '📄'
      }
    ];
    
    return details.filter(detail => detail.current > 0 || detail.limit);
  }, [deductionSummary]);

  const CircularProgress = ({ percentage, size = 100, strokeWidth = 8, color = "blue" }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    
    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            className={`text-${color}-500`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-center">
          <div className="text-lg font-bold">{Math.round(percentage)}%</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Tax Deductions Tracker</h2>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            Total: <span className="font-bold text-green-600">{formatCompactCurrency(totalDeductions)}</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Deduction
          </button>
        </div>
      </div>

      {/* Enhanced Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {deductionDetails.map((detail) => {
          const percentage = detail.limit ? (detail.current / detail.limit) * 100 : 0;
          const isOverLimit = detail.limit && detail.current > detail.limit;
          
          return (
            <div key={detail.type} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{detail.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{detail.name}</h3>
                    <p className="text-xs text-gray-500">{detail.description}</p>
                  </div>
                </div>
                {isOverLimit && (
                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                    Over Limit
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{formatCompactCurrency(detail.current)}</p>
                  {detail.limit && (
                    <p className="text-sm text-gray-500">
                      of {formatCompactCurrency(detail.limit)}
                    </p>
                  )}
                </div>
                {detail.limit && (
                  <CircularProgress 
                    percentage={Math.min(100, percentage)} 
                    size={80} 
                    strokeWidth={6}
                    color={isOverLimit ? 'red' : detail.color} 
                  />
                )}
              </div>

              {detail.limit && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isOverLimit ? 'bg-red-500' : `bg-${detail.color}-500`
                      }`}
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{formatCompactCurrency(Math.max(0, detail.limit - detail.current))} remaining</span>
                    <span>{Math.round(percentage)}%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Optimization Tips */}
      {totalDeductions < 200000 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">💡 Tax Optimization Opportunity</h3>
              <p className="text-yellow-800 mb-3">
                You can save more taxes! You've used {formatCompactCurrency(totalDeductions)} out of potential {formatCompactCurrency(200000)} in deductions.
              </p>
              <div className="flex flex-wrap gap-2">
                {deductionSummary['80C'] < 150000 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Section 80C: {formatCompactCurrency(150000 - (deductionSummary['80C'] || 0))} available
                  </span>
                )}
                {!deductionSummary['MEDICAL_INSURANCE'] && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Health Insurance: {formatCompactCurrency(25000)} available
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Deduction Breakdown by Category</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">By Section</h4>
            <div className="space-y-2">
              {Object.entries(deductionSummary).map(([type, amount]) => (
                <div key={type} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-600">{type}</span>
                  <span className="font-medium">{formatCompactCurrency(amount)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Recent Additions</h4>
            <div className="space-y-2">
              {currentFYDeductions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((deduction) => (
                  <div key={deduction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <span className="text-sm text-gray-900 font-medium">{deduction.description}</span>
                      <span className="text-xs text-gray-500 block">{deduction.type}</span>
                    </div>
                    <span className="font-medium text-green-600">{formatCompactCurrency(deduction.amount)}</span>
                  </div>
                ))}
              {currentFYDeductions.length === 0 && (
                <p className="text-gray-500 text-center py-4 text-sm">No deductions added yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deductions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">All Deductions ({currentFYDeductions.length})</h3>
          <div className="text-sm text-gray-500">Financial Year: {getFinancialYear()}</div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentFYDeductions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No deductions</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by adding your first tax deduction.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Add Deduction
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                currentFYDeductions.map((deduction) => {
                  const limit = getDeductionLimit(deduction.type);
                  const typeTotal = deductionSummary[deduction.type] || 0;
                  const percentage = limit ? (typeTotal / limit) * 100 : 0;
                  
                  return (
                    <tr key={deduction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          deduction.type === '80C' ? 'bg-blue-100 text-blue-800' :
                          deduction.type === 'MEDICAL_INSURANCE' ? 'bg-green-100 text-green-800' :
                          deduction.type === 'HRA' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {deduction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{deduction.description}</div>
                          {deduction.category && (
                            <div className="text-sm text-gray-500">{deduction.category}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{formatCompactCurrency(deduction.amount)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(deduction.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {limit ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  percentage > 100 ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, percentage)}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">{Math.round(percentage)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No limit</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(deduction)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDeleteDeduction(deduction.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingDeduction ? 'Edit Deduction' : 'Add Deduction'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as TaxDeduction['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="80C">80C (Investments)</option>
                  <option value="HRA">HRA</option>
                  <option value="MEDICAL_INSURANCE">Medical Insurance</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category (Optional)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Financial Year
                </label>
                <input
                  type="text"
                  value={formData.financialYear}
                  onChange={(e) => setFormData({ ...formData, financialYear: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingDeduction ? 'Update' : 'Add'} Deduction
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};