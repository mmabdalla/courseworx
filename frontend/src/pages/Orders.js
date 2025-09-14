import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { 
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Orders = () => {
  const [searchParams] = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showSuccess, setShowSuccess] = useState(searchParams.get('success') === 'true');

  // Fetch orders
  const { data: orders, isLoading, error, refetch } = useQuery(
    'orders',
    () => api.get('/financial/orders').then(res => res.data),
    {
      refetchOnWindowFocus: false
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const response = await api.get(`/financial/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Orders</h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <ClipboardDocumentListIcon className="h-8 w-8 mr-3" />
            My Orders
          </h1>
          <p className="text-gray-600 mt-2">View and manage your course purchases</p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
              <div>
                <p className="text-sm text-green-800 font-medium">Payment Successful!</p>
                <p className="text-sm text-green-600 mt-1">
                  Your order has been processed and you now have access to your courses.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        {!orders || orders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-6">You haven't made any purchases yet.</p>
            <a
              href="/courses"
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Browse Courses
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(order.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900">
                          Order #{order.orderNumber || order.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ${order.total?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                        title="View Details"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      
                      {order.status === 'completed' && (
                        <button
                          onClick={() => handleDownloadInvoice(order.id)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Download Invoice"
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items Preview */}
                {order.items && order.items.length > 0 && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="space-y-2">
                      {order.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {item.course?.title?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.course?.title || 'Course'}
                            </p>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity} × ${item.price?.toFixed(2) || '0.00'}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            ${(item.price * item.quantity)?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      ))}
                      
                      {order.items.length > 3 && (
                        <p className="text-sm text-gray-500">
                          +{order.items.length - 3} more item{(order.items.length - 3) !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedOrder(null)}></div>
            
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Order Details
                    </h2>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircleIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Order Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Order Number</p>
                      <p className="text-lg text-gray-900">
                        #{selectedOrder.orderNumber || selectedOrder.id.slice(-8)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Order Date</p>
                      <p className="text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${selectedOrder.total?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {selectedOrder.items?.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">
                              {item.course?.title?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.course?.title || 'Course'}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {item.course?.instructor?.name || 'Instructor'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${item.price?.toFixed(2) || '0.00'}
                            </p>
                            <p className="text-xs text-gray-500">
                              each
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Price Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>${selectedOrder.subtotal?.toFixed(2) || '0.00'}</span>
                      </div>
                      
                      {selectedOrder.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount:</span>
                          <span>-${selectedOrder.discount?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}
                      
                      {selectedOrder.tax > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Tax:</span>
                          <span>${selectedOrder.tax?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                        <span>Total:</span>
                        <span>${selectedOrder.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-6 flex justify-end space-x-4">
                    {selectedOrder.status === 'completed' && (
                      <button
                        onClick={() => handleDownloadInvoice(selectedOrder.id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download Invoice
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
