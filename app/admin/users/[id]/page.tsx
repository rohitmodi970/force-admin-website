'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, ArrowLeft, AlertCircle, CheckCircle, Save } from 'lucide-react';

interface AdminUser {
  _id: string;
  username: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  loginAttempts: number;
  createdAt: string;
  updatedAt: string;
}

const EditAdminUserPage = ({ params }: { params: Promise<{ username: string }> }) => {
  const resolvedParams = use(params);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    status: 'active'
  });
  const [originalData, setOriginalData] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user data
  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.username}`);
      const data = await response.json();
      
      if (data.success) {
        setOriginalData(data.data);
        setFormData({
          username: data.data.username,
          name: data.data.name,
          email: data.data.email,
          status: data.data.status
        });
      } else {
        setError(data.error || 'Failed to fetch user');
      }
    } catch (err) {
      setError('Error fetching user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear success message when user starts editing
    if (success) setSuccess(null);
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.username || !formData.name || !formData.email) {
      setError('All fields are required');
      return false;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${resolvedParams.username}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('User updated successfully!');
        setOriginalData(data.data);
        // If username changed, redirect to new URL
        if (formData.username !== resolvedParams.username) {
          setTimeout(() => {
            router.push(`/admin/users/${formData.username}`);
          }, 1500);
        }
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (err) {
      setError('Error updating user');
    } finally {
      setSaving(false);
    }
  };
  const hasChanges = () => {
    if (!originalData) return false;
    return (
      formData.username !== originalData.username ||
      formData.name !== originalData.name ||
      formData.email !== originalData.email ||
      formData.status !== originalData.status
    );
  };
  useEffect(() => {
    fetchUser();
  }, [resolvedParams.username]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!originalData) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">User not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/admin/users')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Edit className="w-8 h-8" />
            Edit Admin User
          </h1>
          <p className="text-gray-600 mt-1">Update administrator account details</p>
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

      {/* User Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">User Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Created:</span>
            <span className="text-blue-900 ml-2">
              {new Date(originalData.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Last Updated:</span>
            <span className="text-blue-900 ml-2">
              {new Date(originalData.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Last Login:</span>
            <span className="text-blue-900 ml-2">
              {originalData.lastLogin ? new Date(originalData.lastLogin).toLocaleDateString() : 'Never'}
            </span>
          </div>
          <div>
            <span className="text-blue-700">Login Attempts:</span>
            <span className="text-blue-900 ml-2">{originalData.loginAttempts}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="space-y-6">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Must be 3-30 characters, letters, numbers, and underscores only
            </p>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
           
            <button
              onClick={() => router.push(`/admin/users/${resolvedParams.username}/password`)}
              className="px-4 py-2 text-orange-600 hover:text-orange-800 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
            >
            </button>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving || !hasChanges()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAdminUserPage;