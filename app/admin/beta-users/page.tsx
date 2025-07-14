// app/admin/beta-users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IBetaUsers } from '@/models/Beta-Users';

interface BetaUsersResponse {
  users: IBetaUsers[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface StatsResponse {
  overview: {
    totalBetaUsers: number;
    totalWaitlistUsers: number;
    recentBetaUsers: number;
    recentWaitlistUsers: number;
  };
  growthTrends: Array<{
    date: string;
    betaUsers: number;
    waitlistUsers: number;
  }>;
}

interface DeleteResponse {
  message: string;
  restoredToWaitlist: boolean;
}

interface BulkActionResponse {
  message: string;
  results: {
    success: number;
    failed: number;
    errors: string[];
  };
}

interface LookupResponse {
  user: any;
  isBetaUser: boolean;
  isInWaitlist: boolean;
  betaUser?: any;
  waitListUser?: any;
  stats: any;
}

const BetaUsersPage = () => {
  const [betaUsers, setBetaUsers] = useState<IBetaUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showLookup, setShowLookup] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserWaitlistId, setNewUserWaitlistId] = useState('');
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupUserId, setLookupUserId] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResponse | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const router = useRouter();

  useEffect(() => {
    fetchBetaUsers();
    fetchStats();
  }, [currentPage, pageSize, sortBy, sortOrder, searchTerm]);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchBetaUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/beta-users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch beta users');
      }
      
      const data: BetaUsersResponse = await response.json();
      setBetaUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/beta-users/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      const data: StatsResponse = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from beta users?\n\nNote: This user will be moved back to the waitlist and will retain all their data.`)) {
      return;
    }

    try {
      setDeleting(userId);
      const response = await fetch(`/api/admin/beta-users/${userId}?keepInWaitlist=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove user');
      }

      const result: DeleteResponse = await response.json();

      // Remove user from local state
      setBetaUsers(prev => prev.filter(user => user._id !== userId));
      
      // Show success message with waitlist restoration info
      if (result.restoredToWaitlist) {
        setSuccessMessage(`${email} has been removed from beta users and restored to the waitlist successfully.`);
      } else {
        setSuccessMessage(`${email} has been removed from beta users successfully.`);
      }

      // Refresh stats
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove user');
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkAction = async (action: 'remove_from_beta') => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    const actionText = action === 'remove_from_beta' ? 'remove from beta' : action;
    
    if (!confirm(`Are you sure you want to ${actionText} ${selectedUsers.length} user(s)?`)) {
      return;
    }

    try {
      setBulkActionLoading(true);
      const response = await fetch('/api/admin/beta-users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          userIds: selectedUsers
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      const result: BulkActionResponse = await response.json();
      
      if (result.results.errors.length > 0) {
        setSuccessMessage(`${result.message}. Success: ${result.results.success}, Failed: ${result.results.failed}. Errors: ${result.results.errors.join(', ')}`);
      } else {
        setSuccessMessage(`${result.message}. ${result.results.success} user(s) processed successfully.`);
      }

      // Clear selection and refresh data
      setSelectedUsers([]);
      fetchBetaUsers();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to perform bulk action');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      setAddUserLoading(true);
      const response = await fetch('/api/admin/beta-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          ...(newUserWaitlistId.trim() && { userWaitlistId: newUserWaitlistId.trim() })
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add user');
      }

      setSuccessMessage(`User ${newUserEmail} has been added to beta users successfully.`);
      setNewUserEmail('');
      setNewUserWaitlistId('');
      setShowAddUser(false);
      
      // Refresh data
      fetchBetaUsers();
      fetchStats();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add user');
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupEmail.trim() && !lookupUserId.trim()) {
      alert('Please enter either an email or user ID');
      return;
    }

    try {
      setLookupLoading(true);
      const response = await fetch('/api/admin/beta-users/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(lookupEmail.trim() && { email: lookupEmail.trim() }),
          ...(lookupUserId.trim() && { userId: lookupUserId.trim() })
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to lookup user');
      }

      setLookupResult(result);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to lookup user');
      setLookupResult(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleViewUserDetails = (userId: string) => {
    router.push(`/admin/beta-users/${userId}`);
  };

  const handleViewOnboardingData = (userId: string) => {
    router.push(`/admin/beta-users/${userId}/boarding-form-data`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBetaUsers();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(betaUsers.map(user => user._id as string));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  if (loading && betaUsers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading beta users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            onClick={fetchBetaUsers}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="absolute top-0 right-0 mt-2 mr-2 text-green-700 hover:text-green-900"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Beta Users Management</h1>
          <p className="mt-2 text-gray-600">
            Manage users who have access to beta features. Removed users are automatically restored to the waitlist.
          </p>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{stats.overview.totalBetaUsers}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Beta Users</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.overview.totalBetaUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{stats.overview.totalWaitlistUsers}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Waitlist</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.overview.totalWaitlistUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{stats.overview.recentBetaUsers}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Recent Beta (30d)</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.overview.recentBetaUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{stats.overview.recentWaitlistUsers}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Recent Waitlist (30d)</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.overview.recentWaitlistUsers}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setShowAddUser(true)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Beta User
          </button>
          <button
            onClick={() => setShowLookup(true)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Lookup User
          </button>
          {selectedUsers.length > 0 && (
            <button
              onClick={() => handleBulkAction('remove_from_beta')}
              disabled={bulkActionLoading}
              className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {bulkActionLoading ? 'Processing...' : `Remove ${selectedUsers.length} from Beta`}
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <form onSubmit={handleSearch} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by email or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="createdAt">Sort by Created Date</option>
                <option value="email">Sort by Email</option>
                <option value="updatedAt">Sort by Updated Date</option>
              </select>
            </div>
            <div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Beta Users List</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {pagination.total} total users, showing {betaUsers.length} on page {pagination.page} of {pagination.totalPages}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedUsers.length === betaUsers.length && betaUsers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-500">Select All</label>
              </div>
            </div>
          </div>
          
          {betaUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="mt-2 text-sm font-medium text-gray-900">No beta users found</p>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first beta user.'}
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {betaUsers.map((user) => (
                <li key={user.userId} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.userId)}
                        onChange={(e) => handleSelectUser(user.userId, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-4"
                      />
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                          {user.userId && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              ID: {user.userId}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Added: {new Date(user.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {user.formResponses && Object.keys(user.formResponses).length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            Has onboarding data
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewUserDetails(user.userId)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                      <button
                        onClick={() => handleViewOnboardingData(user.userId)}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Onboarding
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.userId, user.email)}
                        disabled={deleting === user._id}
                        className="inline-flex items-center px-3 py-1 border border-orange-300 shadow-sm text-sm leading-4 font-medium rounded-md text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove from beta and restore to waitlist"
                      >
                        {deleting === user._id ? (
                          <div className="animate-spin h-4 w-4 mr-1 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        )}
                        Move to Waitlist
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, pagination.total)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.total}</span>
                  {' '}results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div className="flex space-x-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!pagination.hasPrev}
                    className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(
                      pagination.totalPages - 4,
                      currentPage - 2
                    )) + i;
                    
                    if (pageNum <= pagination.totalPages) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-1 border text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={!pagination.hasNext}
                    className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(pagination.totalPages)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add Beta User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Waitlist User ID (optional)
                    </label>
                    <input
                      type="text"
                      value={newUserWaitlistId}
                      onChange={(e) => setNewUserWaitlistId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="If user is already on waitlist"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowAddUser(false);
                        setNewUserEmail('');
                        setNewUserWaitlistId('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddUser}
                      disabled={addUserLoading || !newUserEmail.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addUserLoading ? 'Adding...' : 'Add User'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lookup User Modal */}
        {showLookup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lookup User</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="text-center text-sm text-gray-500">OR</div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User ID
                    </label>
                    <input
                      type="text"
                      value={lookupUserId}
                      onChange={(e) => setLookupUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="User ID"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowLookup(false);
                        setLookupEmail('');
                        setLookupUserId('');
                        setLookupResult(null);
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLookup}
                      disabled={lookupLoading || (!lookupEmail.trim() && !lookupUserId.trim())}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {lookupLoading ? 'Looking up...' : 'Lookup'}
                    </button>
                  </div>

                  {/* Lookup Results */}
                  {lookupResult && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium text-gray-900 mb-3">Lookup Results</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">User Found:</span>
                          <span className={lookupResult.user ? 'text-green-600' : 'text-red-600'}>
                            {lookupResult.user ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Is Beta User:</span>
                          <span className={lookupResult.isBetaUser ? 'text-green-600' : 'text-red-600'}>
                            {lookupResult.isBetaUser ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">In Waitlist:</span>
                          <span className={lookupResult.isInWaitlist ? 'text-green-600' : 'text-red-600'}>
                            {lookupResult.isInWaitlist ? 'Yes' : 'No'}
                          </span>
                        </div>
                        
                        {lookupResult.user && (
                          <div className="mt-4 p-3 bg-white rounded border">
                            <h5 className="font-medium text-gray-900 mb-2">User Details</h5>
                            <div className="space-y-1 text-xs">
                              <div><strong>Email:</strong> {lookupResult.user.email}</div>
                              <div><strong>User ID:</strong> {lookupResult.user._id}</div>
                              <div><strong>Created:</strong> {new Date(lookupResult.user.createdAt).toLocaleString()}</div>
                              <div><strong>Updated:</strong> {new Date(lookupResult.user.updatedAt).toLocaleString()}</div>
                            </div>
                          </div>
                        )}

                        {lookupResult.betaUser && (
                          <div className="mt-4 p-3 bg-blue-50 rounded border">
                            <h5 className="font-medium text-blue-900 mb-2">Beta User Details</h5>
                            <div className="space-y-1 text-xs">
                              <div><strong>Beta ID:</strong> {lookupResult.betaUser._id}</div>
                              <div><strong>Added to Beta:</strong> {new Date(lookupResult.betaUser.createdAt).toLocaleString()}</div>
                              {lookupResult.betaUser.formResponses && (
                                <div><strong>Has Onboarding Data:</strong> Yes</div>
                              )}
                            </div>
                          </div>
                        )}

                        {lookupResult.waitListUser && (
                          <div className="mt-4 p-3 bg-green-50 rounded border">
                            <h5 className="font-medium text-green-900 mb-2">Waitlist Details</h5>
                            <div className="space-y-1 text-xs">
                              <div><strong>Waitlist ID:</strong> {lookupResult.waitListUser._id}</div>
                              <div><strong>Joined Waitlist:</strong> {new Date(lookupResult.waitListUser.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BetaUsersPage;