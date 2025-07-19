import React, { useState, useMemo } from 'react';
import { 
  calculateIncomeTax, 
  calculateGST, 
  calculateTaxProjection,
  compareTaxRegimes,
  calculateAdvanceTax,
  calculateCapitalGains
} from '../utils/taxCalculation';
import { GST_RATES } from '../types/tax';

export const TaxCalculator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'income' | 'projection' | 'regime' | 'advance' | 'capital' | 'gst'>('income');
  
  // Income Tax Calculator
  const [income, setIncome] = useState('');
  const [deductions, setDeductions] = useState('');
  
  // GST Calculator
  const [gstAmount, setGstAmount] = useState('');
  const [gstRate, setGstRate] = useState(GST_RATES.GST_18);
  
  // Projection Calculator
  const [monthsElapsed, setMonthsElapsed] = useState(new Date().getMonth() >= 3 ? new Date().getMonth() - 3 : new Date().getMonth() + 9);
  
  // Advance Tax Calculator
  const [tdsDeducted, setTdsDeducted] = useState('');
  
  // Capital Gains Calculator
  const [purchasePrice, setPurchasePrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [assetType, setAssetType] = useState<'EQUITY' | 'MUTUAL_FUND' | 'PROPERTY' | 'BOND' | 'GOLD'>('EQUITY');

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

  const taxCalculation = useMemo(() => {
    return income ? calculateIncomeTax(parseFloat(income) || 0, parseFloat(deductions) || 0) : null;
  }, [income, deductions]);

  const taxProjection = useMemo(() => {
    return income ? calculateTaxProjection(parseFloat(income) || 0, parseFloat(deductions) || 0, monthsElapsed) : null;
  }, [income, deductions, monthsElapsed]);

  const regimeComparison = useMemo(() => {
    return income ? compareTaxRegimes(parseFloat(income) || 0, parseFloat(deductions) || 0) : null;
  }, [income, deductions]);

  const advanceTax = useMemo(() => {
    return income ? calculateAdvanceTax(parseFloat(income) || 0, parseFloat(deductions) || 0, parseFloat(tdsDeducted) || 0) : null;
  }, [income, deductions, tdsDeducted]);

  const capitalGain = useMemo(() => {
    if (purchasePrice && salePrice && purchaseDate && saleDate) {
      return calculateCapitalGains(
        parseFloat(purchasePrice),
        parseFloat(salePrice),
        purchaseDate,
        saleDate,
        assetType
      );
    }
    return null;
  }, [purchasePrice, salePrice, purchaseDate, saleDate, assetType]);

  const calculatedGST = gstAmount ? calculateGST(parseFloat(gstAmount) || 0, gstRate) : 0;

  const tabs = [
    { id: 'income', label: 'Income Tax', icon: '💰' },
    { id: 'projection', label: 'Tax Projection', icon: '🔮' },
    { id: 'regime', label: 'Regime Compare', icon: '⚖️' },
    { id: 'advance', label: 'Advance Tax', icon: '📅' },
    { id: 'capital', label: 'Capital Gains', icon: '📈' },
    { id: 'gst', label: 'GST Calculator', icon: '🧾' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Advanced Tax Calculator</h2>
        <div className="text-sm text-gray-500">Financial Year: 2024-25</div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Common Income/Deduction Inputs */}
      {['income', 'projection', 'regime', 'advance'].includes(activeTab) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Income (₹)
              </label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g., 1200000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Deductions (₹)
              </label>
              <input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                placeholder="e.g., 150000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Income Tax Calculator */}
      {activeTab === 'income' && taxCalculation && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Income Tax Calculation</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-3">Tax Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Total Income:</span>
                    <span className="font-bold text-blue-900">{formatCompactCurrency(taxCalculation.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Taxable Income:</span>
                    <span className="font-bold text-blue-900">{formatCompactCurrency(taxCalculation.taxableIncome)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Total Tax:</span>
                    <span className="font-bold text-red-600">{formatCompactCurrency(taxCalculation.totalTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Effective Rate:</span>
                    <span className="font-bold text-blue-900">{taxCalculation.effectiveRate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {taxCalculation.slabWiseBreakdown.length > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Tax Slab Breakdown</h4>
                  <div className="space-y-2">
                    {taxCalculation.slabWiseBreakdown.map((breakdown, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">
                          {formatCompactCurrency(breakdown.slab.min)} - {breakdown.slab.max ? formatCompactCurrency(breakdown.slab.max) : '∞'} ({breakdown.slab.rate}%)
                        </span>
                        <span className="font-medium">{formatCompactCurrency(breakdown.tax)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Health & Education Cess (4%):</span>
                        <span className="font-medium">{formatCompactCurrency(taxCalculation.totalTax * 0.04 / 1.04)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tax Projection */}
      {activeTab === 'projection' && taxProjection && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Tax Year Projection</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Months Elapsed in Financial Year
            </label>
            <input
              type="number"
              min="0"
              max="12"
              value={monthsElapsed}
              onChange={(e) => setMonthsElapsed(parseInt(e.target.value) || 0)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800">Remaining Months</h4>
              <p className="text-2xl font-bold text-blue-600">{taxProjection.remainingMonths}</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <h4 className="text-sm font-medium text-green-800">Projected Income</h4>
              <p className="text-xl font-bold text-green-600">{formatCompactCurrency(taxProjection.projectedIncome)}</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <h4 className="text-sm font-medium text-red-800">Projected Tax</h4>
              <p className="text-xl font-bold text-red-600">{formatCompactCurrency(taxProjection.projectedTax)}</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <h4 className="text-sm font-medium text-purple-800">Monthly SIP Needed</h4>
              <p className="text-xl font-bold text-purple-600">{formatCompactCurrency(taxProjection.monthlyRecommendation)}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">💡 Optimization Tip</h4>
            <p className="text-sm text-yellow-800">
              You can save up to <span className="font-bold">{formatCompactCurrency(taxProjection.potentialSavings)}</span> in taxes 
              by investing <span className="font-bold">{formatCompactCurrency(taxProjection.suggestedInvestments)}</span> 
              in tax-saving instruments over the remaining {taxProjection.remainingMonths} months.
            </p>
          </div>
        </div>
      )}

      {/* Regime Comparison */}
      {activeTab === 'regime' && regimeComparison && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Tax Regime Comparison</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border-2 border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🏛️</span>
                Old Tax Regime
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Taxable Income:</span>
                  <span className="font-medium">{formatCompactCurrency(regimeComparison.oldRegime.taxableIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span className="font-medium text-red-600">{formatCompactCurrency(regimeComparison.oldRegime.totalTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Effective Rate:</span>
                  <span className="font-medium">{regimeComparison.oldRegime.effectiveRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Deductions:</span>
                  <span className="font-medium text-green-600">{formatCompactCurrency(regimeComparison.oldRegime.availableDeductions)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <span className="mr-2">🆕</span>
                New Tax Regime
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Taxable Income:</span>
                  <span className="font-medium">{formatCompactCurrency(regimeComparison.newRegime.taxableIncome)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span className="font-medium text-red-600">{formatCompactCurrency(regimeComparison.newRegime.totalTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Effective Rate:</span>
                  <span className="font-medium">{regimeComparison.newRegime.effectiveRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard Deduction:</span>
                  <span className="font-medium text-green-600">{formatCompactCurrency(regimeComparison.newRegime.standardDeduction)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">🎯 Recommendation</h4>
            <p className="text-sm text-green-800">
              <span className="font-bold">
                {regimeComparison.recommendation === 'NEW' ? 'New Tax Regime' : 'Old Tax Regime'}
              </span> is better for you. 
              You save <span className="font-bold">{formatCompactCurrency(regimeComparison.savings)}</span> in taxes annually.
            </p>
          </div>
        </div>
      )}

      {/* Advance Tax Calculator */}
      {activeTab === 'advance' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Advance Tax Calculator</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TDS Already Deducted (₹)
            </label>
            <input
              type="number"
              value={tdsDeducted}
              onChange={(e) => setTdsDeducted(e.target.value)}
              placeholder="e.g., 50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {advanceTax && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800">Total Tax Liability</h4>
                  <p className="text-xl font-bold text-red-600">{formatCompactCurrency(advanceTax.totalLiability)}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800">TDS Deducted</h4>
                  <p className="text-xl font-bold text-blue-600">{formatCompactCurrency(parseFloat(tdsDeducted) || 0)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800">Net Payable</h4>
                  <p className="text-xl font-bold text-purple-600">{formatCompactCurrency(advanceTax.netPayable)}</p>
                </div>
              </div>

              {advanceTax.isAdvanceTaxRequired ? (
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-3">Advance Tax Installments</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Quarter</th>
                          <th className="text-left py-2">Due Date</th>
                          <th className="text-left py-2">Cumulative %</th>
                          <th className="text-right py-2">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {advanceTax.installments.map((installment, index) => (
                          <tr key={index} className="border-b">
                            <td className="py-2">{installment.quarter}</td>
                            <td className="py-2">{installment.dueDate}</td>
                            <td className="py-2">{installment.percentage}%</td>
                            <td className="text-right py-2 font-medium">{formatCompactCurrency(installment.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">✅ No Advance Tax Required</h4>
                  <p className="text-sm text-green-800">
                    Your net tax payable is less than ₹10,000, so advance tax payment is not mandatory.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Capital Gains Calculator */}
      {activeTab === 'capital' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Capital Gains Calculator</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EQUITY">Equity Shares</option>
                <option value="MUTUAL_FUND">Mutual Funds</option>
                <option value="PROPERTY">Real Estate</option>
                <option value="BOND">Bonds</option>
                <option value="GOLD">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="e.g., 100000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price (₹)</label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="e.g., 150000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sale Date</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {capitalGain && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800">Total Gain</h4>
                  <p className="text-xl font-bold text-blue-600">{formatCompactCurrency(capitalGain.gainAmount)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800">Taxable Gain</h4>
                  <p className="text-xl font-bold text-green-600">{formatCompactCurrency(capitalGain.taxableGain)}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <h4 className="text-sm font-medium text-red-800">Tax Amount</h4>
                  <p className="text-xl font-bold text-red-600">{formatCompactCurrency(capitalGain.taxAmount)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800">Tax Rate</h4>
                  <p className="text-xl font-bold text-purple-600">{capitalGain.taxRate}%</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {capitalGain.isLongTerm ? '📅 Long Term Capital Gains' : '⚡ Short Term Capital Gains'}
                </h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Holding Period: {capitalGain.isLongTerm ? 'More than' : 'Less than'} {assetType === 'PROPERTY' ? '2 years' : '1 year'}</p>
                  {capitalGain.exemptionLimit > 0 && (
                    <p>Exemption Available: {formatCompactCurrency(capitalGain.exemptionLimit)}</p>
                  )}
                  <p>Applicable Tax Rate: {capitalGain.taxRate}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GST Calculator */}
      {activeTab === 'gst' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">GST Calculator</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
              <input
                type="number"
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={GST_RATES.EXEMPT}>0% (Exempt)</option>
                <option value={GST_RATES.GST_5}>5%</option>
                <option value={GST_RATES.GST_12}>12%</option>
                <option value={GST_RATES.GST_18}>18%</option>
                <option value={GST_RATES.GST_28}>28%</option>
              </select>
            </div>
          </div>

          {gstAmount && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800">Base Amount</h4>
                <p className="text-xl font-bold text-blue-600">{formatCompactCurrency(parseFloat(gstAmount))}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="text-sm font-medium text-green-800">GST ({gstRate}%)</h4>
                <p className="text-xl font-bold text-green-600">{formatCompactCurrency(calculatedGST)}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="text-sm font-medium text-purple-800">Total Amount</h4>
                <p className="text-xl font-bold text-purple-600">{formatCompactCurrency(parseFloat(gstAmount) + calculatedGST)}</p>
              </div>
            </div>
          )}

          {gstRate > 0 && gstAmount && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">GST Breakdown</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <p>CGST + SGST: {(calculatedGST / 2).toFixed(2)} + {(calculatedGST / 2).toFixed(2)} = {formatCompactCurrency(calculatedGST)}</p>
                <p className="text-xs text-gray-500">*For intra-state transactions. For inter-state, entire amount will be IGST.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};