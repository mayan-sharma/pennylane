import React, { useState } from 'react';
import { type Currency } from '../types/expense';

interface CurrencyManagerProps {
  currencies: Currency[];
  baseCurrency: string;
  onAddCurrency: (currency: Omit<Currency, 'lastUpdated'>) => void;
  onUpdateCurrency: (code: string, updates: Partial<Currency>) => void;
  onDeleteCurrency: (code: string) => void;
  onSetBaseCurrency: (code: string) => void;
  onUpdateExchangeRates: () => Promise<void>;
}

export const CurrencyManager: React.FC<CurrencyManagerProps> = ({
  currencies,
  baseCurrency,
  onAddCurrency,
  onUpdateCurrency,
  onDeleteCurrency,
  onSetBaseCurrency,
  onUpdateExchangeRates
}) => {
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: '1',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Currency code is required';
    } else if (!/^[A-Z]{3}$/.test(formData.code.trim())) {
      newErrors.code = 'Currency code must be 3 uppercase letters (e.g., USD)';
    } else if (currencies.some(c => c.code === formData.code.trim())) {
      newErrors.code = 'Currency already exists';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Currency name is required';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Currency symbol is required';
    }

    const rate = parseFloat(formData.exchangeRate);
    if (!formData.exchangeRate || isNaN(rate) || rate <= 0) {
      newErrors.exchangeRate = 'Exchange rate must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const currency: Omit<Currency, 'lastUpdated'> = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      symbol: formData.symbol.trim(),
      exchangeRate: parseFloat(formData.exchangeRate),
    };

    onAddCurrency(currency);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ code: '', name: '', symbol: '', exchangeRate: '1' });
    setErrors({});
    setIsAddFormOpen(false);
  };

  const handleUpdateExchangeRates = async () => {
    setIsUpdatingRates(true);
    try {
      await onUpdateExchangeRates();
    } catch (error) {
      console.error('Error updating exchange rates:', error);
    } finally {
      setIsUpdatingRates(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatLastUpdated = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = currencies.find(c => c.code === fromCurrency)?.exchangeRate || 1;
    const toRate = currencies.find(c => c.code === toCurrency)?.exchangeRate || 1;
    
    // Convert to base currency first, then to target currency
    const baseAmount = amount / fromRate;
    return baseAmount * toRate;
  };

  const popularCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Currency Management</h3>
          <p className="text-sm text-gray-600">
            Manage currencies and exchange rates for multi-currency expense tracking
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleUpdateExchangeRates}
            disabled={isUpdatingRates}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {isUpdatingRates ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </div>
            ) : (
              'Update Rates'
            )}
          </button>
          <button
            onClick={() => setIsAddFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Currency
          </button>
        </div>
      </div>

      {/* Base Currency Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Base Currency</h4>
            <p className="text-sm text-blue-700">
              All exchange rates are calculated relative to your base currency
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-blue-900">
              {currencies.find(c => c.code === baseCurrency)?.symbol} {baseCurrency}
            </div>
            <div className="text-sm text-blue-700">
              {currencies.find(c => c.code === baseCurrency)?.name}
            </div>
          </div>
        </div>
      </div>

      {/* Add Currency Form */}
      {isAddFormOpen && (
        <div className="bg-gray-50 border rounded-lg p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Add New Currency</h4>
              <button
                type="button"
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., USD, EUR"
                  maxLength={3}
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., US Dollar"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Symbol *
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => handleInputChange('symbol', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.symbol ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., $, €"
                />
                {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange Rate (to {baseCurrency}) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  min="0.000001"
                  value={formData.exchangeRate}
                  onChange={(e) => handleInputChange('exchangeRate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.exchangeRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="1.0"
                />
                {errors.exchangeRate && <p className="text-red-500 text-xs mt-1">{errors.exchangeRate}</p>}
              </div>
            </div>

            {/* Quick Add Popular Currencies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Add Popular Currencies
              </label>
              <div className="flex flex-wrap gap-2">
                {popularCurrencies
                  .filter(currency => !currencies.some(c => c.code === currency.code))
                  .map((currency) => (
                  <button
                    key={currency.code}
                    type="button"
                    onClick={() => {
                      setFormData({
                        code: currency.code,
                        name: currency.name,
                        symbol: currency.symbol,
                        exchangeRate: '1',
                      });
                    }}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    {currency.symbol} {currency.code}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Add Currency
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Currencies List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Exchange Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currencies.map((currency) => (
                <tr key={currency.code} className={currency.code === baseCurrency ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-lg font-medium mr-3">{currency.symbol}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {currency.code}
                          {currency.code === baseCurrency && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                              Base
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{currency.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {currency.code === baseCurrency ? (
                        '1.00000'
                      ) : (
                        currency.exchangeRate.toFixed(6)
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      1 {currency.code} = {(1 / currency.exchangeRate).toFixed(6)} {baseCurrency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatLastUpdated(currency.lastUpdated)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {currency.code !== baseCurrency && (
                        <>
                          <button
                            onClick={() => onSetBaseCurrency(currency.code)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Set as Base
                          </button>
                          <button
                            onClick={() => onDeleteCurrency(currency.code)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Currency Converter */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Quick Currency Converter</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              defaultValue="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                const amount = parseFloat(e.target.value) || 0;
                const fromSelect = e.target.parentElement?.parentElement?.children[1]?.querySelector('select') as HTMLSelectElement;
                const toSelect = e.target.parentElement?.parentElement?.children[2]?.querySelector('select') as HTMLSelectElement;
                const resultDiv = e.target.parentElement?.parentElement?.children[3]?.querySelector('.result') as HTMLDivElement;
                
                if (fromSelect && toSelect && resultDiv) {
                  const converted = convertAmount(amount, fromSelect.value, toSelect.value);
                  const toCurrency = currencies.find(c => c.code === toSelect.value);
                  resultDiv.textContent = `${toCurrency?.symbol}${converted.toFixed(2)}`;
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code}
                </option>
              ))}
            </select>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 result">
              {currencies[0]?.symbol}100.00
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h5 className="text-sm font-medium text-yellow-800">Exchange Rate Information</h5>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              <li>• Exchange rates are updated automatically from external sources</li>
              <li>• All expenses are converted to your base currency for analytics</li>
              <li>• Original currency amounts are preserved for reference</li>
              <li>• Historical rates are used for past expenses</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};