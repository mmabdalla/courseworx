import React, { useState } from 'react';
import { useQuery } from 'react-query';
import {
  CurrencyDollarIcon,
  CreditCardIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
  UserGroupIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch financial dashboard data
  const { data: dashboardData, isLoading: dashboardLoading, error: dashboardError } = useQuery(
    'financial-dashboard',
    () => api.get('/financial/dashboard'),
    {
      retry: false,
      onError: (error) => {
        console.error('Failed to fetch financial dashboard:', error);
      }
    }
  );

  // Fetch payments data
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    'financial-payments',
    () => api.get('/financial/payments'),
    {
      retry: false,
      onError: (error) => {
        console.error('Failed to fetch payments:', error);
      }
    }
  );

  // Fetch revenue data
  const { data: revenueData, isLoading: revenueLoading } = useQuery(
    'financial-revenue',
    () => api.get('/financial/revenue'),
    {
      retry: false,
      onError: (error) => {
        console.error('Failed to fetch revenue:', error);
      }
    }
  );

  const dashboard = dashboardData?.data || {};
  const payments = paymentsData?.data?.payments || [];
  const revenue = revenueData?.data || {};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: ChartBarIcon },
    { id: 'payments', name: 'Payments', icon: CreditCardIcon },
    { id: 'revenue', name: 'Revenue', icon: ArrowTrendingUpIcon }
  ];

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <CurrencyDollarIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load financial data</h2>
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
              <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Monitor your CourseWorx financial performance and revenue
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
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

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-lg p-3">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(dashboard.totalRevenue || 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600 ml-1">
                    {formatPercentage(dashboard.revenueGrowth || 0)}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-lg p-3">
                    <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Payments</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.totalPayments || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    {dashboard.pendingPayments || 0} pending
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-purple-100 rounded-lg p-3">
                    <BanknotesIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Payouts</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(dashboard.totalPayouts || 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    {dashboard.pendingPayouts || 0} pending
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className="bg-orange-100 rounded-lg p-3">
                    <UserGroupIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboard.activeSubscriptions || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">
                    {formatCurrency(dashboard.platformFees || 0)} platform fees
                  </span>
                </div>
              </div>
            </div>

            {/* Top Courses */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Performing Courses</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboard.topCourses?.map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 w-8">
                          #{index + 1}
                        </span>
                        <span className="text-sm text-gray-900">{course.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(course.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {dashboard.recentTransactions?.map((transaction, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{transaction.date}</span>
                        <span className="text-sm text-gray-900">{transaction.id}</span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
            </div>
            <div className="p-6">
              {paymentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment ID
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
                      {payments.slice(0, 10).map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                payment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.paymentMethod}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
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

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {/* Revenue Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(revenue.totalRevenue || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Period Revenue</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {formatCurrency(revenue.periodRevenue || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Growth Rate</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatPercentage(revenue.growthRate || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Average Order Value</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(revenue.metrics?.averageOrderValue || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="text-xl font-semibold text-blue-600">
                      {(revenue.metrics?.conversionRate || 0).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer Lifetime Value</p>
                    <p className="text-xl font-semibold text-green-600">
                      {formatCurrency(revenue.metrics?.customerLifetimeValue || 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Course</h3>
                <div className="space-y-3">
                  {revenue.breakdown?.byCourse?.slice(0, 5).map((course, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {course.course}
                        </p>
                        <p className="text-xs text-gray-500">{course.percentage}%</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(course.revenue)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Revenue Chart */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Monthly Revenue Trend</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {revenue.breakdown?.byMonth?.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-900">{month.month}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(month.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboard;
