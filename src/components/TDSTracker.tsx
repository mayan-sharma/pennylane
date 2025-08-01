import React, { useState, useMemo } from 'react';
import type { TDSRecord } from '../types/tax';
import { getFinancialYear } from '../utils/taxCalculation';
import { formatCurrency } from '../utils/formatters';

export const TDSTracker: React.FC = () => {
  const [tdsRecords, setTdsRecords] = useState<TDSRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    source: 'SALARY' as TDSRecord['source'],
    amount: '',
    tdsDeducted: '',
    quarter: 'Q1',
    deductorName: '',
    tanNumber: '',
    certificateNumber: ''
  });

  const currentFY = getFinancialYear();


  const formatCompactCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return formatCurrency(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newRecord: TDSRecord = {
      id: Date.now().toString(),
      source: formData.source,
      amount: parseFloat(formData.amount),
      tdsDeducted: parseFloat(formData.tdsDeducted),
      quarter: formData.quarter,
      financialYear: currentFY,
      deductorName: formData.deductorName,
      tanNumber: formData.tanNumber || undefined,
      certificateNumber: formData.certificateNumber || undefined,
      createdAt: new Date().toISOString()
    };

    setTdsRecords([...tdsRecords, newRecord]);
    setFormData({
      source: 'SALARY',
      amount: '',
      tdsDeducted: '',
      quarter: 'Q1',
      deductorName: '',
      tanNumber: '',
      certificateNumber: ''
    });
    setShowForm(false);
  };

  const summary = useMemo(() => {
    const currentFYRecords = tdsRecords.filter(record => record.financialYear === currentFY);
    
    return {
      totalIncome: currentFYRecords.reduce((sum, record) => sum + record.amount, 0),
      totalTDS: currentFYRecords.reduce((sum, record) => sum + record.tdsDeducted, 0),
      recordCount: currentFYRecords.length,
      bySource: currentFYRecords.reduce((acc, record) => {
        acc[record.source] = (acc[record.source] || 0) + record.tdsDeducted;
        return acc;
      }, {} as Record<string, number>),
      byQuarter: currentFYRecords.reduce((acc, record) => {
        acc[record.quarter] = (acc[record.quarter] || 0) + record.tdsDeducted;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [tdsRecords, currentFY]);

  const deleteRecord = (id: string) => {
    setTdsRecords(tdsRecords.filter(record => record.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">TDS Tracker & Reconciliation</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add TDS Record'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCompactCurrency(summary.totalIncome)}</p>
              <p className="text-xs text-gray-500 mt-1">FY {currentFY}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Total TDS</h3>
              <p className="text-2xl font-bold text-green-600">{formatCompactCurrency(summary.totalTDS)}</p>
              <p className="text-xs text-gray-500 mt-1">{summary.recordCount} records</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">TDS Rate</h3>
              <p className="text-2xl font-bold text-purple-600">
                {summary.totalIncome > 0 ? ((summary.totalTDS / summary.totalIncome) * 100).toFixed(2) : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Average rate</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Credit Available</h3>
              <p className="text-2xl font-bold text-orange-600">{formatCompactCurrency(summary.totalTDS)}</p>
              <p className="text-xs text-gray-500 mt-1">Against tax liability</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Add TDS Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Add TDS Record</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as TDSRecord['source'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="SALARY">Salary</option>
                  <option value="BANK_INTEREST">Bank Interest</option>
                  <option value="FD">Fixed Deposit</option>
                  <option value="PROFESSIONAL">Professional Fees</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="e.g., 100000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TDS Deducted (₹)</label>
                <input
                  type="number"
                  value={formData.tdsDeducted}
                  onChange={(e) => setFormData({ ...formData, tdsDeducted: e.target.value })}
                  placeholder="e.g., 10000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                <select
                  value={formData.quarter}
                  onChange={(e) => setFormData({ ...formData, quarter: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Q1">Q1 (Apr-Jun)</option>
                  <option value="Q2">Q2 (Jul-Sep)</option>
                  <option value="Q3">Q3 (Oct-Dec)</option>
                  <option value="Q4">Q4 (Jan-Mar)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deductor Name</label>
                <input
                  type="text"
                  value={formData.deductorName}
                  onChange={(e) => setFormData({ ...formData, deductorName: e.target.value })}
                  placeholder="Company/Bank name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TAN Number (Optional)</label>
                <input
                  type="text"
                  value={formData.tanNumber}
                  onChange={(e) => setFormData({ ...formData, tanNumber: e.target.value })}
                  placeholder="e.g., ABCD12345E"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Number (Optional)</label>
                <input
                  type="text"
                  value={formData.certificateNumber}
                  onChange={(e) => setFormData({ ...formData, certificateNumber: e.target.value })}
                  placeholder="TDS Certificate Number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">TDS by Source</h3>
          <div className="space-y-3">
            {Object.entries(summary.bySource).map(([source, amount]) => (
              <div key={source} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{source.replace('_', ' ').toLowerCase()}</span>
                <span className="font-medium">{formatCompactCurrency(amount)}</span>
              </div>
            ))}
            {Object.keys(summary.bySource).length === 0 && (
              <p className="text-gray-500 text-center py-4">No TDS records yet</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">TDS by Quarter</h3>
          <div className="space-y-3">
            {['Q1', 'Q2', 'Q3', 'Q4'].map((quarter) => (
              <div key={quarter} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{quarter} (FY {currentFY})</span>
                <span className="font-medium">{formatCompactCurrency(summary.byQuarter[quarter] || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TDS Records Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">TDS Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TDS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tdsRecords
                .filter(record => record.financialYear === currentFY)
                .map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {record.source.replace('_', ' ').toLowerCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCompactCurrency(record.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {formatCompactCurrency(record.tdsDeducted)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((record.tdsDeducted / record.amount) * 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.quarter}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{record.deductorName}</div>
                      {record.tanNumber && (
                        <div className="text-xs text-gray-500">TAN: {record.tanNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => deleteRecord(record.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {tdsRecords.filter(record => record.financialYear === currentFY).length === 0 && (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No TDS records</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first TDS record.</p>
              <div className="mt-6">
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add TDS Record
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};