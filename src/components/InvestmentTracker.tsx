import React, { useState } from 'react';
import type { Investment, InvestmentFormData } from '../types/tax';
import { useInvestments } from '../hooks/useInvestments';
import { getFinancialYear } from '../utils/taxCalculation';
import { INVESTMENT_TYPES, DEDUCTION_LIMITS } from '../types/tax';
import { formatCurrency } from '../utils/formatters';

export const InvestmentTracker: React.FC = () => {
  const {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    getInvestmentSummary,
    getMaturingInvestments
  } = useInvestments();

  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState<InvestmentFormData>({
    type: 'ELSS',
    name: '',
    amount: '',
    startDate: new Date().toISOString().split('T')[0],
    taxSection: '80C',
    financialYear: getFinancialYear()
  });


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const investmentData = {
      type: formData.type,
      name: formData.name,
      amount: parseFloat(formData.amount),
      startDate: formData.startDate,
      maturityDate: formData.maturityDate,
      taxSection: formData.taxSection,
      expectedReturns: formData.expectedReturns ? parseFloat(formData.expectedReturns) : undefined,
      isActive: true,
      financialYear: formData.financialYear
    };

    if (editingInvestment) {
      updateInvestment(editingInvestment.id, investmentData);
    } else {
      addInvestment(investmentData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'ELSS',
      name: '',
      amount: '',
      startDate: new Date().toISOString().split('T')[0],
      taxSection: '80C',
      financialYear: getFinancialYear()
    });
    setShowForm(false);
    setEditingInvestment(null);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      type: investment.type,
      name: investment.name,
      amount: investment.amount.toString(),
      startDate: investment.startDate,
      maturityDate: investment.maturityDate,
      taxSection: investment.taxSection,
      expectedReturns: investment.expectedReturns?.toString(),
      financialYear: investment.financialYear
    });
    setShowForm(true);
  };

  const summary = getInvestmentSummary();
  const maturingInvestments = getMaturingInvestments();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Investment Tracker</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Investment
        </button>
      </div>

      {/* Investment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Investments</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.total || 0)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">80C Investments</h3>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary['80C'] || 0)}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, ((summary['80C'] || 0) / DEDUCTION_LIMITS['80C']) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(Math.max(0, DEDUCTION_LIMITS['80C'] - (summary['80C'] || 0)))} remaining
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">80D Investments</h3>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(summary['80D'] || 0)}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${Math.min(100, ((summary['80D'] || 0) / DEDUCTION_LIMITS['MEDICAL_INSURANCE']) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formatCurrency(Math.max(0, DEDUCTION_LIMITS['MEDICAL_INSURANCE'] - (summary['80D'] || 0)))} remaining
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="text-sm font-medium text-gray-500 mb-1">80CCD Investments</h3>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(summary['80CCD'] || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">NPS & Pension</p>
        </div>
      </div>

      {/* Maturing Investments Alert */}
      {maturingInvestments.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {maturingInvestments.length} Investment(s) Maturing Soon
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                {maturingInvestments.map(inv => (
                  <div key={inv.id} className="flex justify-between">
                    <span>{inv.name}</span>
                    <span>{formatDate(inv.maturityDate!)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Investments List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">All Investments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {investments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No investments added yet
                  </td>
                </tr>
              ) : (
                investments.map((investment) => (
                  <tr key={investment.id} className={!investment.isActive ? 'opacity-50' : ''}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{investment.name}</div>
                        <div className="text-sm text-gray-500">{INVESTMENT_TYPES[investment.type]}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {investment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {formatCurrency(investment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        {investment.taxSection}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(investment.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {investment.maturityDate ? formatDate(investment.maturityDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(investment)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteInvestment(investment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Investment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingInvestment ? 'Edit Investment' : 'Add Investment'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Investment['type'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {Object.entries(INVESTMENT_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
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
                  Tax Section
                </label>
                <select
                  value={formData.taxSection}
                  onChange={(e) => setFormData({ ...formData, taxSection: e.target.value as Investment['taxSection'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="80C">80C</option>
                  <option value="80D">80D</option>
                  <option value="80CCD">80CCD</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maturity Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.maturityDate || ''}
                  onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Returns (% per annum)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.expectedReturns || ''}
                  onChange={(e) => setFormData({ ...formData, expectedReturns: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  {editingInvestment ? 'Update' : 'Add'} Investment
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