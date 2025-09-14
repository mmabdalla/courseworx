import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  StarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const TrainerEarnings = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch trainer earnings data
  const { data: earningsData, isLoading, error } = useQuery(
    'trainer-earnings',
    () => api.get('/financial/earnings'),
    {
      retry: false,
      onError: (error) => {
        console.error('Failed to fetch trainer earnings:', error);
      }
    }
  );

  // Fetch payouts data
  const { data: payoutsData, isLoading: payoutsLoading } = useQuery(
    'trainer-payouts',
    () => api.get('/financial/payouts'),
    {
      retry: false,
      onError: (error) => {
        console.error('Failed to fetch payouts:', error);
      }
    }
  );

  const earnings = earningsData?.data || {};
  const payouts = payoutsData?.data?.payouts || [];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'courses', name: 'Courses', icon: ArrowTrendingUpIcon },
    { id: 'payouts', name: 'Payouts', icon: BanknotesIcon }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BanknotesIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load earnings data</h2>
          <p className="text-gray-600">Please check your connection and try again.</p>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Earnings</h1>
              <p className="mt-2 text-gray-600">
                Track your course earnings and payout history
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <BanknotesIcon className="h-8 w-8 text-green-600" />
              <span className="text-sm text-gray-500">Powered by Financial Plugin</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-lg p-3">
                    <BanknotesIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(earnings.totalEarnings || 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    Lifetime earnings from all courses
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <ArrowTrendingUpIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Monthly Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(earnings.monthlyEarnings || 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    Current month earnings
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-yellow-100 rounded-lg p-3">
                    <ClockIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Earnings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(earnings.pendingEarnings || 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    Awaiting payout
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-lg p-3">
                    <UserGroupIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {earnings.metrics?.totalEnrollments || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    {formatPercentage(earnings.metrics?.completionRate || 0)} completion rate
                  </span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Average per Course</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(earnings.metrics?.averagePerCourse || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Rating</span>
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-semibold text-gray-900 ml-1">
                        {earnings.metrics?.rating || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Completion Rate</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatPercentage(earnings.metrics?.completionRate || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Breakdown</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {earnings.monthlyBreakdown?.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{month.month}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(month.earnings)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Course Performance</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {earnings.courses?.map((course, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-gray-900">{course.name}</h4>
                      <span className="text-lg font-bold text-green-600">
                        {formatCurrency(course.earnings)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Enrollments:</span>
                        <span className="ml-2 font-medium text-gray-900">{course.enrollments}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Average per Student:</span>
                        <span className="ml-2 font-medium text-gray-900">
                          {formatCurrency(course.earnings / course.enrollments)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payout History</h3>
            </div>
            <div className="p-6">
              {payoutsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payout ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payouts.slice(0, 10).map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payout.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                payout.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : payout.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payout.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerEarnings;
