// app/admin/error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ErrorDetails {
  title: string;
  message: string;
  details: string[];
  icon: string;
}

type ErrorType = 'Configuration' | 'AccessDenied' | 'Verification' | 'Default' | string;

const AdminErrorPage: React.FC = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

  useEffect(() => {
    if (error) {
      setErrorDetails(getErrorDetails(error as ErrorType));
    }
  }, [error]);

  const getErrorDetails = (errorType: ErrorType): ErrorDetails => {
    switch (errorType) {
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the server configuration.',
          details: [
            'Check if NEXTAUTH_SECRET is set in environment variables',
            'Verify NextAuth.js configuration is complete',
            'Ensure database connection is working',
            'Check provider configurations'
          ],
          icon: '⚙️'
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this resource.',
          details: [
            'Your account may be inactive or suspended',
            'Contact your administrator for access',
            'Try logging in again with correct credentials'
          ],
          icon: '🚫'
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          message: 'There was a problem verifying your account.',
          details: [
            'Check your email for verification link',
            'Ensure your account is activated',
            'Contact support if problem persists'
          ],
          icon: '✉️'
        };
      case 'Default':
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          details: [
            'Try refreshing the page',
            'Clear your browser cache and cookies',
            'Try logging in again',
            'Contact support if the issue persists'
          ],
          icon: '❌'
        };
    }
  };

  const handleGoBack = (): void => {
    window.history.back();
  };

  const handleRefresh = (): void => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="text-6xl mb-4">
              {errorDetails?.icon || '❌'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {errorDetails?.title || 'Authentication Error'}
            </h2>
            <p className="text-gray-600 mb-6">
              {errorDetails?.message || 'An unexpected error occurred.'}
            </p>
          </div>

          {errorDetails?.details && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Troubleshooting Steps:
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {errorDetails.details.map((detail: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href="/admin/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Back to Login
            </Link>
            
            <button
              onClick={handleGoBack}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Go Back
            </button>

            <button
              onClick={handleRefresh}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Refresh Page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Development Info:
              </h3>
              <p className="text-xs text-yellow-700">
                Error Type: {error || 'Unknown'}
              </p>
              <p className="text-xs text-yellow-700">
                Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminErrorPage;