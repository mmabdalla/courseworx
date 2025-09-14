import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  BanknotesIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const Payouts = () => {
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch payout data
  const { data: payoutData, isLoading, error, refetch } = useQuery(
    ['payouts', timeRange],
    () => api.get(`/financial/payouts?range=${timeRange}`).then(res => res.data),
    {
      refetchOnWindowFocus: false
    }
  );

  // Fetch earnings summary
  const { data: earningsSummary } = useQuery(
    'earnings-summary',
    () => api.get('/financial/earnings/summary').then(res => res.data),
    {
      refetchOnWindowFocus: false
    }
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Payouts</h2>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <BanknotesIcon className="h-8 w-8 mr-3" />
                My Payouts
              </h1>
              <p className="text-gray-600 mt-2">Track your earnings and payout history</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
              
              <button
                onClick={() => refetch()}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Refresh Data"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Earnings Summary */}
        {earningsSummary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500 text-white">
                  <BanknotesIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(earningsSummary.totalEarnings)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500 text-white">
                  <ClockIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Pending Payout</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(earningsSummary.pendingAmount)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500 text-white">
                  <CheckCircleIcon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Paid Out</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(earningsSummary.paidAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payouts List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Payout History</h3>
          </div>
          
          {!payoutData || payoutData.length === 0 ? (
            <div className="text-center py-12">
              <BanknotesIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payouts Yet</h3>
              <p className="text-gray-500">Your payouts will appear here once you start earning.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payout
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payoutData.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(payout.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              #{payout.id.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payout.method || 'Bank Transfer'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payout.courseCount || 0} courses
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payout.amount)}
                        </div>
                        {payout.fee > 0 && (
                          <div className="text-sm text-gray-500">
                            Fee: {formatCurrency(payout.fee)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                          {payout.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payout.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedPayout(payout)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Details Modal */}
        {selectedPayout && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedPayout(null)}></div>
            
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Payout Details</h2>
                    <button
                      onClick={() => setSelectedPayout(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExclamationTriangleIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Payout Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Payout ID</p>
                      <p className="text-lg text-gray-900">#{selectedPayout.id.slice(-8)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPayout.status)}`}>
                        {selectedPayout.status || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(selectedPayout.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Method</p>
                      <p className="text-gray-900">{selectedPayout.method || 'Bank Transfer'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Period</p>
                      <p className="text-gray-900">
                        {formatDate(selectedPayout.periodStart)} - {formatDate(selectedPayout.periodEnd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date</p>
                      <p className="text-gray-900">{formatDate(selectedPayout.createdAt)}</p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Breakdown</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Gross Earnings:</span>
                        <span>{formatCurrency(selectedPayout.grossAmount || selectedPayout.amount)}</span>
                      </div>
                      
                      {selectedPayout.fee > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Platform Fee:</span>
                          <span>-{formatCurrency(selectedPayout.fee)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2">
                        <span>Net Payout:</span>
                        <span>{formatCurrency(selectedPayout.amount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Course Details */}
                  {selectedPayout.courses && selectedPayout.courses.length > 0 && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Courses Included</h3>
                      <div className="space-y-3">
                        {selectedPayout.courses.map((course, index) => (
                          <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {course.title?.charAt(0) || 'C'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">
                                {course.title || 'Course'}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {course.sales || 0} sales
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(course.earnings || 0)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="border-t border-gray-200 pt-6 flex justify-end">
                    <button
                      onClick={() => setSelectedPayout(null)}
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

export default Payouts;
