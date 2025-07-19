import React, { useState } from 'react';
import { compareTaxRegimes } from '../utils/taxCalculation';

export const TaxRegimeComparison: React.FC = () => {
  const [income, setIncome] = useState('');
  const [deductions, setDeductions] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const comparison = income ? compareTaxRegimes(
    parseFloat(income) || 0,
    parseFloat(deductions) || 0
  ) : null;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tax Regime Comparison</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Compare Old vs New Tax Regime</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Income (₹)
            </label>
            <input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Enter your annual income"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Deductions (₹)
              <span className="text-xs text-gray-500 block">80C, 80D, HRA, etc.</span>
            </label>
            <input
              type="number"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
              placeholder="Enter total deductions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {comparison && (
          <div className="space-y-6">
            {/* Recommendation Banner */}
            <div className={`p-4 rounded-lg border-2 ${
              comparison.recommendation === 'NEW' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center">
                <div className={`p-2 rounded-full ${
                  comparison.recommendation === 'NEW' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {comparison.recommendation === 'NEW' ? '🆕' : '📊'}
                </div>
                <div className="ml-4">
                  <h4 className={`font-semibold ${
                    comparison.recommendation === 'NEW' ? 'text-green-800' : 'text-blue-800'
                  }`}>
                    Recommended: {comparison.recommendation === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'}
                  </h4>
                  <p className={`text-sm ${
                    comparison.recommendation === 'NEW' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    You can save {formatCurrency(comparison.savings)} annually
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-side Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Old Regime */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center mb-4">
                  <h4 className="text-lg font-semibold text-blue-900">Old Tax Regime</h4>
                  {comparison.recommendation === 'OLD' && (
                    <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Total Income:</span>
                    <span className="font-medium">{formatCurrency(comparison.oldRegime.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Standard Deduction:</span>
                    <span className="font-medium">{formatCurrency(comparison.oldRegime.standardDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Other Deductions:</span>
                    <span className="font-medium">{formatCurrency(comparison.oldRegime.availableDeductions)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-blue-700">Taxable Income:</span>
                    <span className="font-medium">{formatCurrency(comparison.oldRegime.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700 font-semibold">Total Tax:</span>
                    <span className="font-bold text-red-600">{formatCurrency(comparison.oldRegime.totalTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Effective Rate:</span>
                    <span className="font-medium">{comparison.oldRegime.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="font-medium text-blue-900 mb-2">Features:</h5>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• All deductions available (80C, 80D, HRA, etc.)</li>
                    <li>• Higher standard deduction</li>
                    <li>• Better for high deduction cases</li>
                  </ul>
                </div>
              </div>

              {/* New Regime */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center mb-4">
                  <h4 className="text-lg font-semibold text-green-900">New Tax Regime</h4>
                  {comparison.recommendation === 'NEW' && (
                    <span className="ml-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-green-700">Total Income:</span>
                    <span className="font-medium">{formatCurrency(comparison.newRegime.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Standard Deduction:</span>
                    <span className="font-medium">{formatCurrency(comparison.newRegime.standardDeduction)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Other Deductions:</span>
                    <span className="font-medium text-gray-500">Not allowed</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-green-700">Taxable Income:</span>
                    <span className="font-medium">{formatCurrency(comparison.newRegime.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 font-semibold">Total Tax:</span>
                    <span className="font-bold text-red-600">{formatCurrency(comparison.newRegime.totalTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Effective Rate:</span>
                    <span className="font-medium">{comparison.newRegime.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="font-medium text-green-900 mb-2">Features:</h5>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Lower tax rates</li>
                    <li>• Simplified tax structure</li>
                    <li>• No need to maintain investment proofs</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tax Slab Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">Old Regime - Tax Breakdown</h4>
                <div className="space-y-2">
                  {comparison.oldRegime.slabWiseBreakdown.map((breakdown, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {formatCurrency(breakdown.slab.min)} - {breakdown.slab.max ? formatCurrency(breakdown.slab.max) : '∞'} ({breakdown.slab.rate}%):
                      </span>
                      <span className="font-medium">{formatCurrency(breakdown.tax)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-green-900 mb-3">New Regime - Tax Breakdown</h4>
                <div className="space-y-2">
                  {comparison.newRegime.slabWiseBreakdown.map((breakdown, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {formatCurrency(breakdown.slab.min)} - {breakdown.slab.max ? formatCurrency(breakdown.slab.max) : '∞'} ({breakdown.slab.rate}%):
                      </span>
                      <span className="font-medium">{formatCurrency(breakdown.tax)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};