/**
 * Currency Management Page
 * 
 * This page allows administrators to manage currencies,
 * view exchange rates, and configure course currency settings.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  CurrencyDollarIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

const CurrencyManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currencies, setCurrencies] = useState([]);
  const [exchangeRates, setExchangeRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('currencies');
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [showAddExchangeRate, setShowAddExchangeRate] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [editingExchangeRate, setEditingExchangeRate] = useState(null);

  // Form states
  const [currencyForm, setCurrencyForm] = useState({
    code: '',
    name: '',
    symbol: '',
    decimalPlaces: 2,
    isActive: true,
    isBaseCurrency: false,
    bankAccountDetails: {
      accountType: 'checking',
      accountNumber: '',
      bankName: '',
      bankAddress: ''
    }
  });

  const [exchangeRateForm, setExchangeRateForm] = useState({
    fromCurrencyId: '',
    toCurrencyId: '',
    rate: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchCurrencies();
    fetchExchangeRates();
    
    // Check if we came from currency detail page to add a rate
    if (location.state?.addRateForCurrency) {
      setActiveTab('exchange-rates');
      setExchangeRateForm(prev => ({
        ...prev,
        fromCurrencyId: location.state.addRateForCurrency
      }));
      setShowAddExchangeRate(true);
    }
  }, [location.state]);

  const fetchCurrencies = async () => {
    try {
      const response = await fetch('/api/financial/currencies');
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('/api/financial/exchange-rates');
      const data = await response.json();
      if (data.success) {
        setExchangeRates(data.data);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    }
  };

  const handleAddCurrency = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/financial/currencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(currencyForm)
      });

      const data = await response.json();
      if (data.success) {
        setCurrencies([...currencies, data.data]);
        setShowAddCurrency(false);
        setCurrencyForm({
          code: '',
          name: '',
          symbol: '',
          decimalPlaces: 2,
          isActive: true,
          isBaseCurrency: false,
          bankAccountDetails: {
            accountType: 'checking',
            accountNumber: '',
            bankName: '',
            bankAddress: ''
          }
        });
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding currency:', error);
      alert('Failed to add currency');
    }
  };

  const handleAddExchangeRate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/financial/exchange-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(exchangeRateForm)
      });

      const data = await response.json();
      if (data.success) {
        fetchExchangeRates(); // Refresh the list
        setShowAddExchangeRate(false);
        setExchangeRateForm({
          fromCurrencyId: '',
          toCurrencyId: '',
          rate: '',
          effectiveDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error adding exchange rate:', error);
      alert('Failed to add exchange rate');
    }
  };

  const handleEditCurrency = (currency) => {
    setEditingCurrency(currency);
    setCurrencyForm({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimalPlaces: currency.decimalPlaces,
      isActive: currency.isActive,
      isBaseCurrency: currency.isBaseCurrency,
      bankAccountDetails: currency.bankAccountDetails || {
        accountType: 'checking',
        accountNumber: '',
        bankName: '',
        bankAddress: ''
      }
    });
    setShowAddCurrency(true);
  };

  const handleUpdateCurrency = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/financial/currencies/${editingCurrency.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(currencyForm)
      });

      const data = await response.json();
      if (data.success) {
        setCurrencies(currencies.map(c => c.id === editingCurrency.id ? data.data : c));
        setShowAddCurrency(false);
        setEditingCurrency(null);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error updating currency:', error);
      alert('Failed to update currency');
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

  const handleEditExchangeRate = (rate) => {
    setEditingExchangeRate(rate);
    setExchangeRateForm({
      fromCurrencyId: rate.fromCurrencyId,
      toCurrencyId: rate.toCurrencyId,
      rate: rate.rate,
      effectiveDate: new Date(rate.effectiveDate).toISOString().split('T')[0],
      notes: rate.notes || ''
    });
    setShowAddExchangeRate(true);
  };

  const handleDeleteExchangeRate = async (rateId) => {
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
        fetchExchangeRates();
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

  const handleUpdateExchangeRate = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/financial/exchange-rates/${editingExchangeRate.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rate: parseFloat(exchangeRateForm.rate),
          effectiveDate: exchangeRateForm.effectiveDate,
          notes: exchangeRateForm.notes
        })
      });

      if (response.ok) {
        fetchExchangeRates();
        setShowAddExchangeRate(false);
        setEditingExchangeRate(null);
        setExchangeRateForm({
          fromCurrencyId: '',
          toCurrencyId: '',
          rate: '',
          effectiveDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Currency Management</h1>
              <p className="mt-2 text-gray-600">
                Manage currencies, exchange rates, and course pricing configurations
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddCurrency(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Currency
              </button>
              <button
                onClick={() => setShowAddExchangeRate(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <ArrowsRightLeftIcon className="h-4 w-4 mr-2" />
                Add Exchange Rate
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('currencies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'currencies'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Currencies
            </button>
            <button
              onClick={() => setActiveTab('exchange-rates')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'exchange-rates'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Exchange Rates
            </button>
          </nav>
        </div>

        {/* Currencies Tab */}
        {activeTab === 'currencies' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Decimal Places
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currencies.map((currency) => (
                      <tr key={currency.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                              <button
                                onClick={() => navigate(`/admin/currencies/${currency.id}`)}
                                className="text-sm font-medium text-indigo-600 hover:text-indigo-900 hover:underline cursor-pointer"
                              >
                                {currency.name}
                              </button>
                              <div className="text-sm text-gray-500">
                                {currency.code}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {currency.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {currency.decimalPlaces}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            currency.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {currency.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currency.isBaseCurrency && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              Base
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleEditCurrency(currency)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Rates Tab */}
        {activeTab === 'exchange-rates' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To Currency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Effective Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exchangeRates.map((rate) => (
                      <tr key={rate.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCurrencyName(rate.fromCurrencyId)} ({getCurrencyCode(rate.fromCurrencyId)})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getCurrencyName(rate.toCurrencyId)} ({getCurrencyCode(rate.toCurrencyId)})
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {parseFloat(rate.rate).toFixed(6)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(rate.effectiveDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rate.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {rate.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleEditExchangeRate(rate)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Edit Exchange Rate"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteExchangeRate(rate.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete Exchange Rate"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Currency Modal */}
        {showAddCurrency && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
                </h3>
                <form onSubmit={editingCurrency ? handleUpdateCurrency : handleAddCurrency}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Currency Code
                      </label>
                      <input
                        type="text"
                        value={currencyForm.code}
                        onChange={(e) => setCurrencyForm({...currencyForm, code: e.target.value.toUpperCase()})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="USD"
                        maxLength="3"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Currency Name
                      </label>
                      <input
                        type="text"
                        value={currencyForm.name}
                        onChange={(e) => setCurrencyForm({...currencyForm, name: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="US Dollar"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Symbol
                      </label>
                      <input
                        type="text"
                        value={currencyForm.symbol}
                        onChange={(e) => setCurrencyForm({...currencyForm, symbol: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="$"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Decimal Places
                      </label>
                      <input
                        type="number"
                        value={currencyForm.decimalPlaces}
                        onChange={(e) => setCurrencyForm({...currencyForm, decimalPlaces: parseInt(e.target.value)})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        min="0"
                        max="4"
                        required
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currencyForm.isActive}
                        onChange={(e) => setCurrencyForm({...currencyForm, isActive: e.target.checked})}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Active
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={currencyForm.isBaseCurrency}
                        onChange={(e) => setCurrencyForm({...currencyForm, isBaseCurrency: e.target.checked})}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Base Currency
                      </label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCurrency(false);
                        setEditingCurrency(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      {editingCurrency ? 'Update' : 'Add'} Currency
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add Exchange Rate Modal */}
        {showAddExchangeRate && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingExchangeRate ? 'Edit Exchange Rate' : 'Add Exchange Rate'}
                </h3>
                <form onSubmit={editingExchangeRate ? handleUpdateExchangeRate : handleAddExchangeRate}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        From Currency
                      </label>
                      <select
                        value={exchangeRateForm.fromCurrencyId}
                        onChange={(e) => setExchangeRateForm({...exchangeRateForm, fromCurrencyId: e.target.value})}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${editingExchangeRate ? 'bg-gray-100' : ''}`}
                        disabled={editingExchangeRate}
                        required
                      >
                        <option value="">Select currency</option>
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.name} ({currency.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        To Currency
                      </label>
                      <select
                        value={exchangeRateForm.toCurrencyId}
                        onChange={(e) => setExchangeRateForm({...exchangeRateForm, toCurrencyId: e.target.value})}
                        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${editingExchangeRate ? 'bg-gray-100' : ''}`}
                        disabled={editingExchangeRate}
                        required
                      >
                        <option value="">Select currency</option>
                        {currencies.map((currency) => (
                          <option key={currency.id} value={currency.id}>
                            {currency.name} ({currency.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Exchange Rate
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        value={exchangeRateForm.rate}
                        onChange={(e) => setExchangeRateForm({...exchangeRateForm, rate: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="1.25"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        value={exchangeRateForm.effectiveDate}
                        onChange={(e) => setExchangeRateForm({...exchangeRateForm, effectiveDate: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        value={exchangeRateForm.notes}
                        onChange={(e) => setExchangeRateForm({...exchangeRateForm, notes: e.target.value})}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        rows="3"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddExchangeRate(false);
                        setEditingExchangeRate(null);
                        setExchangeRateForm({
                          fromCurrencyId: '',
                          toCurrencyId: '',
                          rate: '',
                          effectiveDate: new Date().toISOString().split('T')[0],
                          notes: ''
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      {editingExchangeRate ? 'Update Exchange Rate' : 'Add Exchange Rate'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyManagement;
