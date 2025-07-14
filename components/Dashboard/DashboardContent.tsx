// components/DashboardContent.tsx
'use client'
import React from 'react'
import { BarChart3 } from 'lucide-react'

interface DashboardContentProps {
  activeSection: string
}

const DashboardContent: React.FC<DashboardContentProps> = ({ activeSection }) => {
  const stats = [
    { label: 'Total Users', value: '1,234', change: '+12%', color: 'bg-blue-500' },
    { label: 'Active Sessions', value: '89', change: '+5%', color: 'bg-green-500' },
    { label: 'Revenue', value: '$45,678', change: '+18%', color: 'bg-purple-500' },
    { label: 'Orders', value: '567', change: '+8%', color: 'bg-orange-500' },
  ]

  const recentActivity = [
    { action: 'User registration', user: 'john@example.com', time: '2 min ago' },
    { action: 'Payment processed', user: 'admin@site.com', time: '5 min ago' },
    { action: 'Content updated', user: 'editor@site.com', time: '12 min ago' },
    { action: 'Security alert', user: 'system', time: '1 hour ago' },
  ]

  return (
    <main className="p-6">
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                  <span className="text-sm text-gray-500 ml-2">vs last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
            </div>
            <div className="divide-y">
              {recentActivity.map((activity, index) => (
                <div key={index} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.user}</p>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'users' && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">User Management</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-800">John Doe</p>
                <p className="text-sm text-gray-500">john@example.com</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">Active</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Jane Smith</p>
                <p className="text-sm text-gray-500">jane@example.com</p>
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">Pending</span>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Bob Johnson</p>
                <p className="text-sm text-gray-500">bob@example.com</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">Inactive</span>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'content' && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Content Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Blog Posts</h4>
              <p className="text-2xl font-bold text-blue-600">24</p>
              <p className="text-sm text-gray-500">Published articles</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Pages</h4>
              <p className="text-2xl font-bold text-green-600">12</p>
              <p className="text-sm text-gray-500">Static pages</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Media Files</h4>
              <p className="text-2xl font-bold text-purple-600">156</p>
              <p className="text-sm text-gray-500">Images & videos</p>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'settings' && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">System Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive email alerts for important events</p>
              </div>
              <button className="w-12 h-6 bg-blue-500 rounded-full relative">
                <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></span>
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Auto Backup</p>
                <p className="text-sm text-gray-500">Automatically backup data daily</p>
              </div>
              <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></span>
              </button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium text-gray-800">Maintenance Mode</p>
                <p className="text-sm text-gray-500">Put site in maintenance mode</p>
              </div>
              <button className="w-12 h-6 bg-gray-300 rounded-full relative">
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'security' && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Security Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Failed Login Attempts</h4>
              <p className="text-2xl font-bold text-red-600">7</p>
              <p className="text-sm text-gray-500">In the last 24 hours</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Security Alerts</h4>
              <p className="text-2xl font-bold text-orange-600">3</p>
              <p className="text-sm text-gray-500">Unresolved issues</p>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="font-medium text-gray-800 mb-4">Recent Security Events</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <span className="text-sm text-red-800">Multiple failed login attempts from IP: 192.168.1.1</span>
                <span className="text-xs text-red-600">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-yellow-800">Unusual admin activity detected</span>
                <span className="text-xs text-yellow-600">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-800">Security patch applied successfully</span>
                <span className="text-xs text-green-600">1 day ago</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default DashboardContent