import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCardIcon, 
  LockClosedIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Fetch cart data
  const { data: cart, isLoading: cartLoading, error: cartError } = useQuery(
    'cart',
    () => api.get('/financial/cart').then(res => res.data),
    {
      onError: () => {
        navigate('/cart');
      }
    }
  );

  // Create payment intent mutation
  const createPaymentIntentMutation = useMutation(
    (paymentData) => api.post('/financial/checkout/create-intent', paymentData),
    {
      onSuccess: (response) => {
        // Handle successful payment intent creation
        console.log('Payment intent created:', response.data);
        // In a real implementation, you would integrate with Stripe Elements here
        handlePaymentSuccess(response.data);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to create payment intent');
        setIsProcessing(false);
      }
    }
  );

  const handlePaymentSuccess = (paymentData) => {
    // Clear cart and redirect to success page
    queryClient.invalidateQueries('cart');
    navigate('/orders?success=true');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // Validate form
      if (!billingInfo.firstName || !billingInfo.lastName || !billingInfo.email) {
        throw new Error('Please fill in all required fields');
      }

      if (paymentMethod === 'card' && (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvc)) {
        throw new Error('Please fill in all card details');
      }

      // Create payment intent
      const paymentData = {
        billingInfo,
        paymentMethod,
        cartId: cart.id
      };

      if (paymentMethod === 'card') {
        paymentData.cardInfo = cardInfo;
      }

      createPaymentIntentMutation.mutate(paymentData);
    } catch (err) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (cartError || !cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Cart is Empty</h2>
          <p className="text-gray-600 mb-4">Add some courses to your cart before checkout.</p>
          <button
            onClick={() => navigate('/courses')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase securely</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mr-3"
                    />
                    <CreditCardIcon className="h-5 w-5 mr-2" />
                    Credit/Debit Card
                  </label>
                </div>
              </div>

              {/* Billing Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Billing Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={billingInfo.firstName}
                      onChange={(e) => setBillingInfo({...billingInfo, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={billingInfo.lastName}
                      onChange={(e) => setBillingInfo({...billingInfo, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={billingInfo.email}
                    onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={billingInfo.address}
                    onChange={(e) => setBillingInfo({...billingInfo, address: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={billingInfo.city}
                      onChange={(e) => setBillingInfo({...billingInfo, city: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={billingInfo.state}
                      onChange={(e) => setBillingInfo({...billingInfo, state: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP
                    </label>
                    <input
                      type="text"
                      value={billingInfo.zipCode}
                      onChange={(e) => setBillingInfo({...billingInfo, zipCode: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Card Information */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Card Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={cardInfo.number}
                      onChange={(e) => setCardInfo({...cardInfo, number: formatCardNumber(e.target.value)})}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        required
                        value={cardInfo.expiry}
                        onChange={(e) => setCardInfo({...cardInfo, expiry: formatExpiry(e.target.value)})}
                        placeholder="MM/YY"
                        maxLength="5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVC *
                      </label>
                      <input
                        type="text"
                        required
                        value={cardInfo.cvc}
                        onChange={(e) => setCardInfo({...cardInfo, cvc: e.target.value.replace(/\D/g, '')})}
                        placeholder="123"
                        maxLength="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name on Card *
                    </label>
                    <input
                      type="text"
                      required
                      value={cardInfo.name}
                      onChange={(e) => setCardInfo({...cardInfo, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <LockClosedIcon className="h-5 w-5 mr-2" />
                    Complete Purchase
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
            
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">
                      {item.course?.title?.charAt(0) || 'C'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.course?.title || 'Course'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Qty: {item.quantity} × ${item.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    ${(item.price * item.quantity)?.toFixed(2) || '0.00'}
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${cart.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              
              {cart.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-${cart.discount?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              
              {cart.tax > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${cart.tax?.toFixed(2) || '0.00'}</span>
                </div>
              )}
              
              <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span>${cart.total?.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckIcon className="h-5 w-5 text-green-400 mr-2" />
                <div>
                  <p className="text-sm text-green-800 font-medium">Secure Payment</p>
                  <p className="text-xs text-green-600 mt-1">
                    Your payment information is encrypted and secure. We never store your card details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
