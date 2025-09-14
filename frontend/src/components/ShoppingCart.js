import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ShoppingCartIcon, 
  XMarkIcon, 
  PlusIcon, 
  MinusIcon,
  TrashIcon,
  CurrencyDollarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

const ShoppingCart = ({ isOpen, onClose }) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const queryClient = useQueryClient();

  // Fetch cart data
  const { data: cart, isLoading, error } = useQuery(
    'cart',
    () => api.get('/financial/cart').then(res => res.data),
    {
      enabled: isOpen,
      refetchOnWindowFocus: false
    }
  );

  // Update item quantity mutation
  const updateQuantityMutation = useMutation(
    ({ itemId, quantity }) => 
      api.put(`/financial/cart/items/${itemId}`, { quantity }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cart');
      }
    }
  );

  // Remove item mutation
  const removeItemMutation = useMutation(
    (itemId) => api.delete(`/financial/cart/items/${itemId}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cart');
      }
    }
  );

  // Apply coupon mutation
  const applyCouponMutation = useMutation(
    (code) => api.post('/financial/cart/coupon', { code }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cart');
        setCouponError('');
      },
      onError: (error) => {
        setCouponError(error.response?.data?.message || 'Invalid coupon code');
      }
    }
  );

  // Clear cart mutation
  const clearCartMutation = useMutation(
    () => api.delete('/financial/cart'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('cart');
      }
    }
  );

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItemMutation.mutate(itemId);
    } else {
      updateQuantityMutation.mutate({ itemId, quantity: newQuantity });
    }
  };

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.trim()) {
      applyCouponMutation.mutate(couponCode.trim());
    }
  };

  const handleCheckout = () => {
    // Navigate to checkout page
    window.location.href = '/checkout';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <ShoppingCartIcon className="h-6 w-6 mr-2" />
              Shopping Cart
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <LoadingSpinner size="md" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">
                <p>Failed to load cart</p>
                <p className="text-sm text-gray-500 mt-2">{error.message}</p>
              </div>
            ) : !cart || !cart.items || cart.items.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <ShoppingCartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Your cart is empty</p>
                <p className="text-sm mt-2">Add some courses to get started!</p>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 border-b border-gray-100 pb-4">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {item.course?.title?.charAt(0) || 'C'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.course?.title || 'Course'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.course?.instructor?.name || 'Instructor'}
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          ${item.price?.toFixed(2) || '0.00'}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          disabled={updateQuantityMutation.isLoading}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          disabled={updateQuantityMutation.isLoading}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeItemMutation.mutate(item.id)}
                        className="p-1 text-red-400 hover:text-red-600"
                        disabled={removeItemMutation.isLoading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Coupon Code */}
                <div className="mt-6">
                  <form onSubmit={handleApplyCoupon} className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Coupon code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={applyCouponMutation.isLoading || !couponCode.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyCouponMutation.isLoading ? 'Applying...' : 'Apply'}
                    </button>
                  </form>
                  
                  {couponError && (
                    <p className="text-red-600 text-sm mt-2">{couponError}</p>
                  )}
                  
                  {cart.coupon && (
                    <div className="flex items-center text-green-600 text-sm mt-2">
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Coupon applied: {cart.coupon.code}
                    </div>
                  )}
                </div>

                {/* Clear Cart */}
                <div className="mt-4">
                  <button
                    onClick={() => clearCartMutation.mutate()}
                    disabled={clearCartMutation.isLoading}
                    className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {clearCartMutation.isLoading ? 'Clearing...' : 'Clear Cart'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer with Total and Checkout */}
          {cart && cart.items && cart.items.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="space-y-2">
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
                  <span className="flex items-center">
                    <CurrencyDollarIcon className="h-5 w-5 mr-1" />
                    {cart.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
