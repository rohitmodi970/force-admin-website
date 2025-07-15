// app/admin/beta-users/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IUser } from '@/models/User';

interface UserDetailResponse {
  user: IUser;
  isBetaUser: boolean;
}

const BetaUserDetailPage = () => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBetaUser, setIsBetaUser] = useState(false);
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/miscellaneous/${userId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }
      
      const data: UserDetailResponse = await response.json();
      setUser(data.user);
      setIsBetaUser(data.isBetaUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleViewOnboarding = () => {
    router.push(`/admin/beta-users/${userId}/boarding-form-data`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user details...</p>
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
            onClick={handleGoBack}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">User not found</p>
          <button
            onClick={handleGoBack}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Beta Users
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
              <p className="mt-2 text-gray-600">
                Detailed information about {user.name}
              </p>
            </div>
            <div className="flex space-x-3">
              {isBetaUser && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Beta User
                </span>
              )}
              <button
                onClick={handleViewOnboarding}
                className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View Onboarding Data
              </button>
            </div>
          </div>
        </div>

        {/* User Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Basic Info */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-16 w-16">
                    {user.profileImage ? (
                      <img className="h-16 w-16 rounded-full" src={user.profileImage} alt={user.name} />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-lg font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">@{user.username}</div>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{user.email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">Phone</dt>
                      <dd className="text-sm text-gray-900">{user.phone || 'Not provided'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm font-medium text-gray-500">User ID</dt>
                      <dd className="text-sm text-gray-900">{user.userId}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Account Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Active</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">New User</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.new_user ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.new_user ? 'New' : 'Existing'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Onboarding</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.onboardingComplete ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {user.onboardingComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Provider</span>
                  <span className="text-sm text-gray-900">{user.provider || 'Email'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        {user.profile && (
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Bio</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.profile.bio || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Personality Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.profile.personalityType || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.profile.dob ? new Date(user.profile.dob).toLocaleDateString() : 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Languages</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.profile.languages?.join(', ') || 'Not provided'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Sleeping Habits</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.profile.sleepingHabits || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Interests</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.profile.interests?.join(', ') || 'Not provided'}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Information */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Technical Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">IP Addresses</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.ip_address && user.ip_address.length > 0 ? (
                    <ul className="space-y-1">
                      {user.ip_address.map((ip, index) => (
                        <li key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">{ip}</li>
                      ))}
                    </ul>
                  ) : (
                    'Not recorded'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Not available'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {(user as any).updatedAt ? new Date((user as any).updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Not available'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Google Drive Connected</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user.googleDriveFolderId ? 'Yes' : 'No'}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetaUserDetailPage;