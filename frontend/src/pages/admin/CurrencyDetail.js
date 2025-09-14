/**
 * Currency Detail Page
 * 
 * This page shows detailed information about a specific currency
 * and all its exchange rates with other currencies.
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const CurrencyDetail = () => {
  const { currencyId } = useParams();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(null);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRate, setEditingRate] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchCurrencyData();
  }, [currencyId]);

  const fetchCurrencyData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch currencies
      const currenciesResponse = await fetch('/api/financial/currencies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const currenciesData = await currenciesResponse.json();
      setCurrencies(currenciesData.data);

      // Find the selected currency
      const selectedCurrency = currenciesData.data.find(c => c.id === currencyId);
      setCurrency(selectedCurrency);

      // Fetch exchange rates for this currency
      const ratesResponse = await fetch(`/api/financial/exchange-rates?fromCurrency=${currencyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ratesData = await ratesResponse.json();
      setExchangeRates(ratesData.data);

    } catch (error) {
      console.error('Error fetching currency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyName = (currencyId) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? currency.name : 'Unknown';
  };

  const getCurrencyCode = (currencyId) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? currency.code : 'UNK';
  };

  const handleEditRate = (rate) => {
    setEditingRate(rate.id);
    setEditValue(rate.rate);
  };

  const handleSaveRate = async (rateId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/financial/exchange-rates/${rateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rate: parseFloat(editValue),
          effectiveDate: new Date().toISOString().split('T')[0],
          notes: 'Updated from currency detail page'
        })
      });

      if (response.ok) {
        fetchCurrencyData(); // Refresh data
        setEditingRate(null);
        setEditValue('');
        alert('Exchange rate updated successfully');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      alert('Failed to update exchange rate');
    }
  };

  const handleCancelEdit = () => {
    setEditingRate(null);
    setEditValue('');
  };

  const handleDeleteRate = async (rateId) => {
    if (!window.confirm('Are you sure you want to delete this exchange rate? This will also delete the inverse rate.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/financial/exchange-rates/${rateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchCurrencyData(); // Refresh data
        alert('Exchange rate deleted successfully');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting exchange rate:', error);
      alert('Failed to delete exchange rate');
    }
  };

  const handleAddNewRate = () => {
    navigate('/admin/currencies', { state: { addRateForCurrency: currencyId } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading currency details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currency) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Currency Not Found</h1>
            <p className="mt-2 text-gray-600">The requested currency could not be found.</p>
            <button
              onClick={() => navigate('/admin/currencies')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Currencies
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/currencies')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <CurrencyDollarIcon className="h-8 w-8 mr-3 text-indigo-600" />
                  {currency.name} ({currency.code})
                </h1>
                <p className="mt-2 text-gray-600">
                  Exchange rates for {currency.name} against all other currencies
                </p>
              </div>
            </div>
            <button
              onClick={handleAddNewRate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <CurrencyDollarIcon className="h-4 w-4 mr-2" />
              Add Exchange Rate
            </button>
          </div>
        </div>

        {/* Currency Info Card */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Currency Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Symbol</dt>
                <dd className="mt-1 text-sm text-gray-900">{currency.symbol}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Decimal Places</dt>
                <dd className="mt-1 text-sm text-gray-900">{currency.decimalPlaces}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    currency.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currency.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
            </div>
          </div>
        </div>

        {/* Exchange Rates Grid */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Exchange Rates ({exchangeRates.length} rates)
            </h3>
            
            {exchangeRates.length === 0 ? (
              <div className="text-center py-8">
                <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No exchange rates</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No exchange rates have been configured for {currency.name} yet.
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleAddNewRate}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                    Add First Exchange Rate
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exchangeRates.map((rate) => (
                  <div key={rate.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {getCurrencyCode(rate.toCurrencyId)}
                      </h4>
                      <div className="flex space-x-1">
                        {editingRate === rate.id ? (
                          <>
                            <button
                              onClick={() => handleSaveRate(rate.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Save"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-red-600 hover:text-red-900"
                              title="Cancel"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditRate(rate)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Rate"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteRate(rate.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Rate"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <p className="text-xs text-gray-500">
                        {getCurrencyName(rate.toCurrencyId)}
                      </p>
                    </div>
                    
                    <div className="mb-2">
                      {editingRate === rate.id ? (
                        <input
                          type="number"
                          step="0.00000001"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                          autoFocus
                        />
                      ) : (
                        <p className="text-lg font-semibold text-gray-900">
                          1 {currency.code} = {parseFloat(rate.rate).toFixed(6)} {getCurrencyCode(rate.toCurrencyId)}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <p>Effective: {new Date(rate.effectiveDate).toLocaleDateString()}</p>
                      {rate.source === 'auto_calculated' && (
                        <p className="text-blue-600">Auto-calculated</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrencyDetail;
