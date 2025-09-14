/**
 * Course Currency Configuration Component
 * 
 * This component allows trainers to configure currency settings for their courses,
 * including base currency, allowed payment currencies, and custom exchange rates.
 */

import React, { useState, useEffect } from 'react';
import { 
  CurrencyDollarIcon, 
  PlusIcon, 
  InformationCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const CourseCurrencyConfig = ({ courseId, onSave, isCreationMode = false }) => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCustomRates, setShowCustomRates] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState([]);

  const [formData, setFormData] = useState({
    baseCurrencyId: '',
    basePrice: '',
    allowedPaymentCurrencies: [],
    customExchangeRates: {}
  });

  // Country to currency mapping
  const countryCurrencyMap = {
    'EG': 'EGP', // Egypt
    'US': 'USD', // United States
    'GB': 'GBP', // United Kingdom
    'DE': 'EUR', // Germany
    'FR': 'EUR', // France
    'IT': 'EUR', // Italy
    'ES': 'EUR', // Spain
    'CA': 'CAD', // Canada
    'AU': 'AUD', // Australia
    'JP': 'JPY', // Japan
    'CH': 'CHF', // Switzerland
    'IN': 'INR', // India
    'BR': 'BRL', // Brazil
    'MX': 'MXN', // Mexico
    'CN': 'CNY', // China
    'RU': 'RUB', // Russia
    'ZA': 'ZAR', // South Africa
    'AE': 'AED', // UAE
    'SA': 'SAR', // Saudi Arabia
    'KW': 'KWD', // Kuwait
    'QA': 'QAR', // Qatar
    'BH': 'BHD', // Bahrain
    'OM': 'OMR', // Oman
    'JO': 'JOD', // Jordan
    'LB': 'LBP', // Lebanon
    'SY': 'SYP', // Syria
    'IQ': 'IQD', // Iraq
    'IR': 'IRR', // Iran
    'TR': 'TRY', // Turkey
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchCurrencies();
      if (!isCreationMode && courseId) {
        await fetchCourseCurrency();
      } else {
        setLoading(false);
      }
    };
    loadData();
  }, [courseId, isCreationMode]);

  // Filter currencies based on search
  useEffect(() => {
    if (currencySearch.trim() === '') {
      setFilteredCurrencies([]);
    } else {
      const filtered = currencies.filter(currency => 
        currency.name.toLowerCase().includes(currencySearch.toLowerCase()) ||
        currency.code.toLowerCase().includes(currencySearch.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    }
  }, [currencySearch, currencies]);

  // Get user's country and set default currency
  const getUserCountry = () => {
    // Try to get country from browser's timezone or language
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const country = timezone.split('/')[0];
      return country;
    } catch (error) {
      return 'US'; // Default to US if detection fails
    }
  };

  const getDefaultCurrency = () => {
    const country = getUserCountry();
    return countryCurrencyMap[country] || 'USD';
  };

  const fetchCurrencies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/financial/currencies');
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.data);
        
        // Set default currency based on user's country
        if (isCreationMode && !formData.baseCurrencyId) {
          const defaultCurrencyCode = getDefaultCurrency();
          const defaultCurrency = data.data.find(c => c.code === defaultCurrencyCode);
          if (defaultCurrency) {
            setFormData(prev => ({
              ...prev,
              baseCurrencyId: defaultCurrency.id
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchCourseCurrency = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/financial/courses/${courseId}/currency`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFormData({
            baseCurrencyId: data.data.baseCurrencyId,
            basePrice: data.data.basePrice,
            allowedPaymentCurrencies: data.data.allowedPaymentCurrencies || [],
            customExchangeRates: data.data.customExchangeRates || {}
          });
        }
      }
    } catch (error) {
      console.error('Error fetching course currency:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isCreationMode) {
        // In creation mode, just call onSave with the form data
        if (onSave) {
          onSave(formData);
        }
        setSaving(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/financial/courses/${courseId}/currency`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        if (onSave) {
          onSave(data.data);
        }
        alert('Course currency configuration saved successfully!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error saving course currency:', error);
      alert('Failed to save course currency configuration');
    } finally {
      setSaving(false);
    }
  };

  // Call onSave when form data changes in creation mode
  const updateFormData = (newData) => {
    setFormData(newData);
    if (isCreationMode && onSave) {
      onSave(newData);
    }
  };


  const handleAddCurrency = (currencyId) => {
    if (!formData.allowedPaymentCurrencies.includes(currencyId)) {
      updateFormData({
        ...formData,
        allowedPaymentCurrencies: [...formData.allowedPaymentCurrencies, currencyId]
      });
    }
    setCurrencySearch('');
  };

  const handleRemoveCurrency = (currencyId) => {
    updateFormData({
      ...formData,
      allowedPaymentCurrencies: formData.allowedPaymentCurrencies.filter(id => id !== currencyId)
    });
  };

  const handleCustomRateChange = (fromCurrencyId, toCurrencyId, rate) => {
    const key = `${fromCurrencyId}-${toCurrencyId}`;
    updateFormData({
      ...formData,
      customExchangeRates: {
        ...formData.customExchangeRates,
        [key]: parseFloat(rate) || 0
      }
    });
  };

  const getCurrencyName = (currencyId) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? `${currency.name} (${currency.code})` : 'Unknown';
  };

  const getCurrencySymbol = (currencyId) => {
    const currency = currencies.find(c => c.id === currencyId);
    return currency ? currency.symbol : '';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center mb-6">
          <CurrencyDollarIcon className="h-6 w-6 text-indigo-600 mr-3" />
          <h3 className="text-lg font-medium text-gray-900">
            Currency Configuration
          </h3>
        </div>

        <div className="space-y-6">
          {/* Base Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Currency
            </label>
            <select
              value={formData.baseCurrencyId}
              onChange={(e) => updateFormData({...formData, baseCurrencyId: e.target.value})}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select base currency</option>
              {currencies.map((currency) => (
                <option key={currency.id} value={currency.id}>
                  {currency.name} ({currency.code}) - {currency.symbol}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              The primary currency for this course pricing
            </p>
          </div>

          {/* Base Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Base Price
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">
                  {formData.baseCurrencyId ? getCurrencySymbol(formData.baseCurrencyId) : '$'}
                </span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.basePrice}
                onChange={(e) => updateFormData({...formData, basePrice: e.target.value})}
                className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Allowed Payment Currencies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Allowed Payment Currencies
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Search and add currencies that students can use to pay for this course
            </p>
            
            {/* Currency Search */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={currencySearch}
                onChange={(e) => setCurrencySearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Search currencies..."
              />
            </div>

            {/* Search Results */}
            {currencySearch && filteredCurrencies.length > 0 && (
              <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto mb-4">
                {filteredCurrencies
                  .filter(currency => currency.id !== formData.baseCurrencyId)
                  .map((currency) => (
                    <div
                      key={currency.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleAddCurrency(currency.id)}
                    >
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {currency.name} ({currency.code})
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {currency.symbol}
                        </span>
                      </div>
                      <PlusIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                  ))}
              </div>
            )}

            {/* Selected Currencies */}
            {formData.allowedPaymentCurrencies.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Selected Currencies:</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.allowedPaymentCurrencies.map((currencyId) => {
                    const currency = currencies.find(c => c.id === currencyId);
                    return currency ? (
                      <div
                        key={currencyId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800"
                      >
                        <span>{currency.name} ({currency.code})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCurrency(currencyId)}
                          className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:text-indigo-600 hover:bg-indigo-200"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Custom Exchange Rates */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Custom Exchange Rates
              </label>
              <button
                type="button"
                onClick={() => setShowCustomRates(!showCustomRates)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                {showCustomRates ? 'Hide' : 'Show'} Custom Rates
              </button>
            </div>
            
            {showCustomRates && (
              <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                <div className="mb-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <InformationCircleIcon className="h-4 w-4 mr-1" />
                    Override default exchange rates for this course
                  </div>
                </div>
                
                {formData.allowedPaymentCurrencies.length > 0 ? (
                  <div className="space-y-3">
                    {formData.allowedPaymentCurrencies.map((toCurrencyId) => (
                      <div key={toCurrencyId} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <span className="text-sm text-gray-700">
                            {formData.baseCurrencyId ? getCurrencyName(formData.baseCurrencyId) : 'Base Currency'} → {getCurrencyName(toCurrencyId)}
                          </span>
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            step="0.00000001"
                            min="0"
                            value={formData.customExchangeRates[`${formData.baseCurrencyId}-${toCurrencyId}`] || ''}
                            onChange={(e) => handleCustomRateChange(formData.baseCurrencyId, toCurrencyId, e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                            placeholder="1.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Select allowed payment currencies to configure custom exchange rates
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Price Preview */}
          {formData.baseCurrencyId && formData.basePrice && formData.allowedPaymentCurrencies.length > 0 && (
            <div className="border border-gray-200 rounded-md p-4 bg-blue-50">
              <h4 className="text-sm font-medium text-blue-900 mb-3">Price Preview</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700">Base Price:</span>
                  <span className="font-medium text-blue-900">
                    {getCurrencySymbol(formData.baseCurrencyId)}{formData.basePrice}
                  </span>
                </div>
                {formData.allowedPaymentCurrencies.map((currencyId) => {
                  const customRate = formData.customExchangeRates[`${formData.baseCurrencyId}-${currencyId}`];
                  const rate = customRate || 1; // Default rate if no custom rate
                  const convertedPrice = (parseFloat(formData.basePrice) * rate).toFixed(2);
                  
                  return (
                    <div key={currencyId} className="flex justify-between text-sm">
                      <span className="text-blue-700">
                        {getCurrencyName(currencyId)}:
                      </span>
                      <span className="font-medium text-blue-900">
                        {getCurrencySymbol(currencyId)}{convertedPrice}
                        {customRate && <span className="text-xs text-blue-600 ml-1">(custom rate)</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Save Button - Only show in edit mode */}
          {!isCreationMode && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCurrencyConfig;

