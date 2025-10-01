//app\admin\users\[id]\password\page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Key, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const ChangePasswordPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const [userId, setUserId] = useState<string>('');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Unwrap the params Promise
  useEffect(() => {
    params.then((resolvedParams) => {
      setUserId(resolvedParams.id);
    });
  }, [params]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.password || !formData.confirmPassword) {
      setError('Both password fields are required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Password updated successfully!');
        setFormData({ password: '', confirmPassword: '' });
        setTimeout(() => {
          router.push(`/admin/users/${userId}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (err) {
      setError('Error updating password');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: '', color: '' };
    
    let score = 0;
    const checks = [
      { regex: /.{8,}/, text: 'At least 8 characters' },
      { regex: /[a-z]/, text: 'Lowercase letter' },
      { regex: /[A-Z]/, text: 'Uppercase letter' },
      { regex: /\d/, text: 'Number' },
      { regex: /[^a-zA-Z\d]/, text: 'Special character' }
    ];

    checks.forEach(check => {
      if (check.regex.test(password)) score++;
    });

    if (score < 2) return { strength: 1, text: 'Weak', color: 'text-red-600' };
    if (score < 4) return { strength: 2, text: 'Medium', color: 'text-yellow-600' };
    return { strength: 3, text: 'Strong', color: 'text-green-600' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Show loading state while params are being resolved
  if (!userId) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push(`/admin/users/${userId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-8 h-8" />
            Change Password
          </h1>
          <p className="text-gray-600 mt-1">Update password for user: <span className="font-semibold">@{userId}</span></p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-6">
          {/* New Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600">Strength:</span>
                  <span className={`text-sm font-medium ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.strength === 1 ? 'bg-red-500 w-1/3' :
                      passwordStrength.strength === 2 ? 'bg-yellow-500 w-2/3' :
                      'bg-green-500 w-full'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Password Match Indicator */}
            {formData.confirmPassword && (
              <div className="mt-1">
                {formData.password === formData.confirmPassword ? (
                  <span className="text-sm text-green-600">✓ Passwords match</span>
                ) : (
                  <span className="text-sm text-red-600">✗ Passwords do not match</span>
                )}
              </div>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Password Requirements:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center gap-2">
                <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                  {formData.password.length >= 8 ? '✓' : '○'}
                </span>
                At least 8 characters long
              </li>
              <li className="flex items-center gap-2">
                <span className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {/[a-z]/.test(formData.password) ? '✓' : '○'}
                </span>
                Contains lowercase letters
              </li>
              <li className="flex items-center gap-2">
                <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {/[A-Z]/.test(formData.password) ? '✓' : '○'}
                </span>
                Contains uppercase letters
              </li>
              <li className="flex items-center gap-2">
                <span className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {/\d/.test(formData.password) ? '✓' : '○'}
                </span>
                Contains numbers
              </li>
              <li className="flex items-center gap-2">
                <span className={/[^a-zA-Z\d]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                  {/[^a-zA-Z\d]/.test(formData.password) ? '✓' : '○'}
                </span>
                Contains special characters
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.push(`/admin/users/${userId}`)}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  Update Password
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;