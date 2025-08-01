import React, { useState } from 'react';
import type { TaxReport } from '../types/tax';
import { getFinancialYear } from '../utils/taxCalculation';
import { formatCurrency } from '../utils/formatters';

interface TaxReportsProps {
  onGenerateReport: (totalIncome: number, financialYear?: string) => TaxReport;
}

export const TaxReports: React.FC<TaxReportsProps> = ({ onGenerateReport }) => {
  const [income, setIncome] = useState('');
  const [selectedFY, setSelectedFY] = useState(getFinancialYear());
  const [generatedReport, setGeneratedReport] = useState<TaxReport | null>(null);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN');
  };

  const handleGenerateReport = () => {
    if (!income) return;
    
    const report = onGenerateReport(parseFloat(income), selectedFY);
    setGeneratedReport(report);
  };

  const downloadReport = () => {
    if (!generatedReport) return;

    const reportContent = `
TAX REPORT - ${generatedReport.financialYear}
Generated on: ${formatDate(generatedReport.generatedAt)}

INCOME SUMMARY:
Total Income: ${formatCurrency(generatedReport.totalIncome)}
Total Deductions: ${formatCurrency(generatedReport.totalDeductions)}
Taxable Income: ${formatCurrency(generatedReport.taxableIncome)}
Total Tax: ${formatCurrency(generatedReport.totalTax)}

GST SUMMARY:
GST Collected: ${formatCurrency(generatedReport.gstCollected)}
GST Paid: ${formatCurrency(generatedReport.gstPaid)}

DEDUCTION BREAKDOWN:
${generatedReport.deductionSummary.map(d => `${d.type}: ${formatCurrency(d.amount)}`).join('\n')}

Note: This is a computer-generated report for reference purposes only.
Please consult a tax professional for official ITR filing.
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-report-${generatedReport.financialYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 1;
      years.push(`${startYear}-${endYear}`);
    }
    return years;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Tax Reports</h2>

      {/* Report Generation Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Generate Tax Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              Financial Year
            </label>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {generateFinancialYears().map(fy => (
                <option key={fy} value={fy}>{fy}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={!income}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Generated Report Display */}
      {generatedReport && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Tax Report - {generatedReport.financialYear}</h3>
            <div className="flex space-x-2">
              <button
                onClick={downloadReport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m-6 10a9 9 0 110-18 9 9 0 010 18z" />
                </svg>
                Download
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-700 mb-1">Total Income</h4>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(generatedReport.totalIncome)}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-700 mb-1">Total Deductions</h4>
              <p className="text-2xl font-bold text-green-900">{formatCurrency(generatedReport.totalDeductions)}</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-700 mb-1">Taxable Income</h4>
              <p className="text-2xl font-bold text-yellow-900">{formatCurrency(generatedReport.taxableIncome)}</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-700 mb-1">Total Tax</h4>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(generatedReport.totalTax)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deduction Summary */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Deduction Summary</h4>
              <div className="space-y-3">
                {generatedReport.deductionSummary.length === 0 ? (
                  <p className="text-gray-500">No deductions recorded</p>
                ) : (
                  generatedReport.deductionSummary.map((deduction, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">{deduction.type}</span>
                      <span className="text-green-600 font-semibold">{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* GST Summary */}
            <div>
              <h4 className="text-lg font-semibold mb-4">GST Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">GST Collected</span>
                  <span className="text-blue-600 font-semibold">{formatCurrency(generatedReport.gstCollected)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">GST Paid</span>
                  <span className="text-orange-600 font-semibold">{formatCurrency(generatedReport.gstPaid)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="font-semibold">Net GST</span>
                  <span className="text-green-700 font-bold">
                    {formatCurrency(generatedReport.gstCollected - generatedReport.gstPaid)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h5 className="font-medium text-yellow-800">Important Note</h5>
                <p className="text-sm text-yellow-700 mt-1">
                  This report is generated for reference purposes only. Please consult with a qualified tax professional 
                  and verify all calculations before filing your Income Tax Return (ITR).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-right">
            Generated on: {formatDate(generatedReport.generatedAt)}
          </div>
        </div>
      )}
    </div>
  );
};