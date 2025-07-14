// app/admin/waitlist/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BetaUserActionButton from '@/components/MailTemplate/AddToBetaButton';
interface WaitlistUser {
  _id: string;
  email: string;
  userWaitlistId: string;
  formResponses: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface BetaUser {
  _id: string;
  email: string;
  waitListId?: {
    _id: string;
    userWaitlistId: string;
    formResponses: Record<string, any>;
    createdAt: string;
  };
  formResponses?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const WaitlistAdminPage = () => {
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
  const [betaUsers, setBetaUsers] = useState<BetaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'waitlist' | 'beta'>('waitlist');
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [waitlistResponse, betaResponse] = await Promise.all([
        fetch('/api/admin/waitlist'),
        fetch('/api/admin/beta-users')
      ]);

      if (!waitlistResponse.ok || !betaResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const waitlistData = await waitlistResponse.json();
      const betaData = await betaResponse.json();

      setWaitlistUsers(waitlistData.users || []);
      setBetaUsers(betaData.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const addToBetaUsers = async (email: string, userWaitlistId: string) => {
    try {
      setProcessingUsers(prev => new Set(prev).add(userWaitlistId));

      const response = await fetch('/api/admin/beta-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, userWaitlistId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add user to beta');
      }

      await fetchData();
      showToast('User added to beta successfully!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add user to beta', 'error');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userWaitlistId);
        return newSet;
      });
    }
  };

  const removeBetaUser = async (userId: string, userEmail: string) => {
    // Show confirmation dialog with options
    const result = await showRemovalDialog(userEmail);

    if (result === 'cancel') {
      return;
    }

    try {
      setProcessingUsers(prev => new Set(prev).add(userId));

      const keepInWaitlist = result === 'waitlist';
      const response = await fetch(`/api/admin/beta-users/${userId}?keepInWaitlist=${keepInWaitlist}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user from beta');
      }

      const data = await response.json();
      await fetchData();

      if (data.restoredToWaitlist) {
        showToast('User removed from beta and restored to waitlist!', 'success');
      } else {
        showToast('User removed from beta completely!', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to remove user from beta', 'error');
    } finally {
      setProcessingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const showRemovalDialog = (userEmail: string): Promise<'waitlist' | 'remove' | 'cancel'> => {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'fixed inset-0 backdrop-filter backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50';
      dialog.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">Remove Beta User</h3>
            <p class="text-gray-600 mb-4">What would you like to do with <strong>${userEmail}</strong>?</p>
          </div>
          <div class="space-y-3">
            <button id="waitlist-btn" class="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Remove from Beta & Keep in Waitlist
            </button>
            <button id="remove-btn" class="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium">
              Remove Completely
            </button>
            <button id="cancel-btn" class="w-full bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium">
              Cancel
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const waitlistBtn = dialog.querySelector('#waitlist-btn');
      const removeBtn = dialog.querySelector('#remove-btn');
      const cancelBtn = dialog.querySelector('#cancel-btn');

      waitlistBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('waitlist');
      });

      removeBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('remove');
      });

      cancelBtn?.addEventListener('click', () => {
        document.body.removeChild(dialog);
        resolve('cancel');
      });

      // Close on backdrop click
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog);
          resolve('cancel');
        }
      });
    });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg text-white z-50 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'
      }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return `${Math.floor(diffInHours / 168)}w ago`;
    }
  };

  const filteredWaitlistUsers = waitlistUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userWaitlistId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBetaUsers = betaUsers.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="mt-6 text-gray-600 text-lg font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600 text-lg">Manage waitlist and beta users efficiently</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{waitlistUsers.length}</div>
                    <div className="text-sm text-gray-500">Waitlist</div>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{betaUsers.length}</div>
                    <div className="text-sm text-gray-500">Beta Users</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search users by email or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-2xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
            <nav className="flex space-x-2">
              <button
                onClick={() => setActiveTab('waitlist')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'waitlist'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <span>Waitlist Users</span>
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                    {filteredWaitlistUsers.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('beta')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${activeTab === 'beta'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Beta Users</span>
                  <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                    {filteredBetaUsers.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Waitlist Users Tab */}
        {activeTab === 'waitlist' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    Waitlist Users
                  </h3>
                  <p className="text-gray-600 mt-1">Users waiting for access to the beta program</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{filteredWaitlistUsers.length}</div>
                  <div className="text-sm text-gray-500">
                    {filteredWaitlistUsers.length !== waitlistUsers.length ? 'Filtered' : 'Total'}
                  </div>
                </div>
              </div>
            </div>

            {filteredWaitlistUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No matching users found' : 'No users in waitlist'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Users will appear here when they join the waitlist'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredWaitlistUsers.map((user, index) => (
                  <div key={user._id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-lg font-semibold text-gray-900 truncate">
                              {user.email}
                            </p>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              #{index + 1}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              {user.userWaitlistId}
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {getRelativeTime(user.createdAt)}
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6v6m8-6v6" />
                              </svg>
                              {formatDate(user.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/admin/waitlist/${user.userWaitlistId}`}
                          className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          View Details
                        </Link>
                        <BetaUserActionButton
                          email={user.email}
                          userId={user.userWaitlistId}
                          onSuccess={fetchData}
                          isProcessing={processingUsers.has(user.userWaitlistId)}
                          actionType="add"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Beta Users Tab */}
        {activeTab === 'beta' && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Beta Users
                  </h3>
                  <p className="text-gray-600 mt-1">Users with active access to the beta program</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{filteredBetaUsers.length}</div>
                  <div className="text-sm text-gray-500">
                    {filteredBetaUsers.length !== betaUsers.length ? 'Filtered' : 'Total'}
                  </div>
                </div>
              </div>
            </div>

            {filteredBetaUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No matching beta users found' : 'No beta users yet'}
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add users from the waitlist to get started'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredBetaUsers.map((user, index) => (
                  <div key={user._id} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="text-lg font-semibold text-gray-900 truncate">
                              {user.email}
                            </p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Beta #{index + 1}
                            </span>
                            {user.waitListId && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                WL: {user.waitListId.userWaitlistId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {getRelativeTime(user.createdAt)}
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 6v6m-4-6v6m8-6v6" />
                              </svg>
                              {formatDate(user.createdAt)}
                            </div>
                            {user.waitListId && (
                              <div className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                From WL: {formatDate(user.waitListId.createdAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {user.waitListId && (
                          <Link
                            href={`/admin/waitlist/${user.waitListId.userWaitlistId}`}
                            className="text-blue-600 hover:text-blue-700 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            View WL Details
                          </Link>
                        )}
                        <BetaUserActionButton
                          email={user.email}
                          userId={user._id}
                          onSuccess={fetchData}
                          isProcessing={processingUsers.has(user._id)}
                          actionType="remove"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="font-medium text-gray-900">
                      {waitlistUsers.length > 0 ? `${((betaUsers.length / waitlistUsers.length) * 100).toFixed(1)}%` : '0%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users:</span>
                    <span className="font-medium text-gray-900">{waitlistUsers.length + betaUsers.length}</span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Activity</h3>
                <p className="text-gray-600">
                  {betaUsers.length > 0
                    ? `Latest beta user: ${betaUsers[betaUsers.length - 1]?.email.split('@')[0]}...`
                    : 'No beta users yet'
                  }
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Actions</h3>
                <button
                  onClick={fetchData}
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Data</span>
                </button>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistAdminPage;