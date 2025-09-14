/**
 * Currency System Test Page
 * 
 * This page helps you test the multi-currency system through the browser
 */

import React, { useState, useEffect } from 'react';
import { CurrencyDollarIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

const CurrencyTest = () => {
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [conversionResult, setConversionResult] = useState(null);

  // Conversion form state
  const [conversionForm, setConversionForm] = useState({
    amount: '',
    from: '',
    to: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch currencies
      const currenciesResponse = await fetch('/api/financial/currencies');
      const currenciesData = await currenciesResponse.json();
      
      if (currenciesData.success) {
        setCurrencies(currenciesData.data);
      } else {
        throw new Error('Failed to fetch currencies');
      }

      // Fetch exchange rates
      const ratesResponse = await fetch('/api/financial/exchange-rates');
      const ratesData = await ratesResponse.json();
      
      if (ratesData.success) {
        setExchangeRates(ratesData.data);
      } else {
        throw new Error('Failed to fetch exchange rates');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConversion = async (e) => {
    e.preventDefault();
    if (!conversionForm.amount || !conversionForm.from || !conversionForm.to) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch(
        `/api/financial/convert?amount=${conversionForm.amount}&from=${conversionForm.from}&to=${conversionForm.to}`
      );
      const data = await response.json();
      
      if (data.success) {
        setConversionResult(data.data);
      } else {
        alert('Conversion failed: ' + data.message);
      }
    } catch (err) {
      alert('Conversion error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading currency data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Currency Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchData}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Multi-Currency System Test</h1>
          <p className="mt-2 text-gray-600">
            Test the multi-currency functionality through the browser
          </p>
        </div>

        {/* Success Message */}
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                ✅ Multi-Currency System is Working!
              </h3>
              <p className="mt-1 text-sm text-green-700">
                The system successfully loaded {currencies.length} currencies and {exchangeRates.length} exchange rates.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Currencies List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Available Currencies
              </h3>
              <div className="space-y-3">
                {currencies.map((currency) => (
                  <div key={currency.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <span className="text-lg font-medium text-gray-900 mr-3">
                        {currency.symbol}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{currency.name}</div>
                        <div className="text-sm text-gray-500">{currency.code}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      {currency.isBaseCurrency && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Base
                        </span>
                      )}
                      <div className="text-sm text-gray-500">
                        {currency.decimalPlaces} decimals
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exchange Rates */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ArrowsRightLeftIcon className="h-5 w-5 mr-2" />
                Exchange Rates
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {exchangeRates.slice(0, 10).map((rate) => (
                  <div key={rate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div className="font-medium text-gray-900">
                      {rate.fromCurrency?.code} → {rate.toCurrency?.code}
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">
                        {parseFloat(rate.rate).toFixed(6)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(rate.effectiveDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                {exchangeRates.length > 10 && (
                  <div className="text-center text-sm text-gray-500">
                    ... and {exchangeRates.length - 10} more rates
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Currency Conversion Test */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Currency Conversion Test
            </h3>
            <form onSubmit={handleConversion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={conversionForm.amount}
                    onChange={(e) => setConversionForm({...conversionForm, amount: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Currency
                  </label>
                  <select
                    value={conversionForm.from}
                    onChange={(e) => setConversionForm({...conversionForm, from: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.code}>
                        {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Currency
                  </label>
                  <select
                    value={conversionForm.to}
                    onChange={(e) => setConversionForm({...conversionForm, to: e.target.value})}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select currency</option>
                    {currencies.map((currency) => (
                      <option key={currency.id} value={currency.code}>
                        {currency.name} ({currency.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Convert
              </button>
            </form>

            {/* Conversion Result */}
            {conversionResult && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-2">Conversion Result:</h4>
                <div className="text-lg font-medium text-green-900">
                  {conversionResult.originalAmount} {conversionResult.fromCurrency} = {conversionResult.convertedAmount} {conversionResult.toCurrency}
                </div>
                <div className="text-sm text-green-700 mt-1">
                  Exchange Rate: {conversionResult.exchangeRate} (Effective: {new Date(conversionResult.effectiveDate).toLocaleDateString()})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">Next Steps for Testing:</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>1. <strong>Admin Panel:</strong> Go to <a href="/admin/currencies" className="underline">/admin/currencies</a> to manage currencies and exchange rates</p>
            <p>2. <strong>Course Creation:</strong> Create a new course and configure currency settings</p>
            <p>3. <strong>Course Editing:</strong> Edit an existing course to set up multi-currency pricing</p>
            <p>4. <strong>Payment Flow:</strong> Test the checkout process with different currencies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyTest;
