"use client"
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Clock, 
  TrendingUp, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  Calendar,
  Activity,
  Shield,
  AlertCircle
} from 'lucide-react';

// Type definitions
interface User {
  _id: string;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  username?: string;
  createdAt: string;
  lastLogin?: string;
  isBetaUser: boolean;
  isInWaitlist: boolean;
  betaUserSince?: string | null;
  waitlistSince?: string | null;
}

interface StatsOverview {
  totalUsers: number;
  totalBetaUsers: number;
  totalWaitlistUsers: number;
  regularUsers: number;
  recentUsers: number;
  activeUsers: number;
}

interface GrowthTrend {
  date: string;
  users: number;
}

interface BetaGrowthTrend {
  date: string;
  betaUsers: number;
  waitlistUsers: number;
}

interface Stats {
  overview: StatsOverview;
  growthTrend: GrowthTrend[];
}

interface BetaStats {
  overview: {
    totalBetaUsers: number;
    totalWaitlistUsers: number;
    recentBetaUsers: number;
    recentWaitlistUsers: number;
  };
  growthTrends: BetaGrowthTrend[];
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface LookupResult {
  user: User;
  isBetaUser: boolean;
  isInWaitlist: boolean;
  betaUser?: any;
  waitListUser?: any;
  stats: {
    totalBetaUsers: number;
    totalWaitlistUsers: number;
    userRegistrationDate: string;
    betaUserSince?: string | null;
    waitlistSince?: string | null;
  };
  error?: string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  trend?: string;
  color?: string;
}

interface UserBadgeProps {
  user: User;
}

type ActiveTab = 'overview' | 'users' | 'lookup';
type FilterType = 'all' | 'beta' | 'waitlist' | 'regular';
type SortBy = 'createdAt' | 'email' | 'firstName' | 'lastName';
type SortOrder = 'asc' | 'desc';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [betaStats, setBetaStats] = useState<BetaStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [lookupEmail, setLookupEmail] = useState<string>('');
  const [lookupUserId, setLookupUserId] = useState<string>('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);

  // Fetch overview stats
  useEffect(() => {
    const fetchStats = async (): Promise<void> => {
      try {
        const [overviewRes, betaRes] = await Promise.all([
          fetch('/api/admin/miscellaneous/stats'),
          fetch('/api/admin/beta-users/stats')
        ]);
        
        if (overviewRes.ok && betaRes.ok) {
          const overviewData: Stats = await overviewRes.json();
          const betaData: BetaStats = await betaRes.json();
          // console.log('Overview Stats:', overviewData);
          // console.log('Beta Stats:', betaData);
          setStats(overviewData);
          setBetaStats(betaData);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };
    fetchStats();
  }, []);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: '10',
          search: searchTerm,
          filter: filterType,
          sortBy,
          sortOrder
        });
        
        const response = await fetch(`/api/admin/miscellaneous?${params}`);
        if (response.ok) {
          const data: UsersResponse = await response.json();
          setUsers(data.users || []);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm, filterType, sortBy, sortOrder]);

  // User lookup
  const handleLookup = async (): Promise<void> => {
    if (!lookupEmail && !lookupUserId) return;
    
    setLookupLoading(true);
    try {
      const response = await fetch('/api/admin/beta-users/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: lookupEmail || undefined, 
          userId: lookupUserId ? parseInt(lookupUserId) : undefined 
        })
      });
      
      if (response.ok) {
        const data: LookupResult = await response.json();
        setLookupResult(data);
      } else {
        setLookupResult({ error: 'User not found' } as LookupResult);
      }
    } catch (error) {
      setLookupResult({ error: 'Error looking up user' } as LookupResult);
    } finally {
      setLookupLoading(false);
    }
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 flex items-center mt-1">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const UserBadge: React.FC<UserBadgeProps> = ({ user }) => (
    <div className="flex gap-2">
      {user.isBetaUser && (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
          Beta
        </span>
      )}
      {user.isInWaitlist && (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          Waitlist
        </span>
      )}
      {!user.isBetaUser && !user.isInWaitlist && (
        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
          Regular
        </span>
      )}
    </div>
  );

  const tabOptions = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'users' as const, label: 'User Management', icon: Users },
    { id: 'lookup' as const, label: 'User Lookup', icon: Search }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage users and view system statistics</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabOptions.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={stats?.overview?.totalUsers || 0}
              icon={Users}
              color="blue"
            />
            <StatCard
              title="Beta Users"
              value={stats?.overview?.totalBetaUsers || 0}
              icon={Shield}
              color="purple"
            />
            <StatCard
              title="Waitlist Users"
              value={stats?.overview?.totalWaitlistUsers || 0}
              icon={Clock}
              color="orange"
            />
            <StatCard
              title="Recent Users (30d)"
              value={stats?.overview?.recentUsers || 0}
              icon={UserPlus}
              color="green"
            />
          </div>

          {/* Growth Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">User Growth Trend (Last 7 Days)</h3>
            <div className="h-64 flex items-end space-x-2">
              {stats?.growthTrend?.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${Math.max(day.users * 20, 4)}px` }}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs font-semibold">{day.users}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Beta Users Growth */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Beta & Waitlist Growth</h3>
            <div className="h-64 flex items-end space-x-2">
              {betaStats?.growthTrends?.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex flex-col">
                    <div 
                      className="w-full bg-purple-500 rounded-t"
                      style={{ height: `${Math.max(day.betaUsers * 15, 2)}px` }}
                    ></div>
                    <div 
                      className="w-full bg-orange-500"
                      style={{ height: `${Math.max(day.waitlistUsers * 15, 2)}px` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs">
                    <span className="text-purple-600">{day.betaUsers}</span>/
                    <span className="text-orange-600">{day.waitlistUsers}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center mt-4 space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Beta Users</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">Waitlist Users</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Search and Filter Controls */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="beta">Beta Users</option>
                  <option value="waitlist">Waitlist Users</option>
                  <option value="regular">Regular Users</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Date Created</option>
                  <option value="email">Email</option>
                  <option value="firstName">First Name</option>
                  <option value="lastName">Last Name</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <UserBadge user={user} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.userId}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white px-6 py-3 border rounded-lg">
            <div className="flex items-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="mx-4 text-sm text-gray-700">
                Page {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lookup Tab */}
      {activeTab === 'lookup' && (
        <div className="space-y-6">
          {/* Lookup Form */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">User Lookup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={lookupEmail}
                  onChange={(e) => setLookupEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <input
                  type="number"
                  value={lookupUserId}
                  onChange={(e) => setLookupUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={handleLookup}
              disabled={lookupLoading || (!lookupEmail && !lookupUserId)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {lookupLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Lookup User
            </button>
          </div>

          {/* Lookup Results */}
          {lookupResult && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Lookup Results</h3>
              
              {lookupResult.error ? (
                <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-700">{lookupResult.error}</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">User Information</h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Name:</span>
                          <span className="ml-2 text-sm font-medium">
                            {lookupResult.user.firstName} {lookupResult.user.lastName}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Email:</span>
                          <span className="ml-2 text-sm font-medium">{lookupResult.user.email}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">User ID:</span>
                          <span className="ml-2 text-sm font-medium">{lookupResult.user.userId}</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">Joined:</span>
                          <span className="ml-2 text-sm font-medium">
                            {formatDate(lookupResult.user.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Status</h4>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            lookupResult.isBetaUser ? 'bg-purple-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-sm">Beta User</span>
                          {lookupResult.isBetaUser && lookupResult.stats.betaUserSince && (
                            <span className="ml-2 text-xs text-gray-500">
                              since {formatDate(lookupResult.stats.betaUserSince)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            lookupResult.isInWaitlist ? 'bg-orange-500' : 'bg-gray-300'
                          }`}></div>
                          <span className="text-sm">Waitlist User</span>
                          {lookupResult.isInWaitlist && lookupResult.stats.waitlistSince && (
                            <span className="ml-2 text-xs text-gray-500">
                              since {formatDate(lookupResult.stats.waitlistSince)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">System Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {lookupResult.stats.totalBetaUsers}
                        </div>
                        <div className="text-sm text-blue-600">Total Beta Users</div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {lookupResult.stats.totalWaitlistUsers}
                        </div>
                        <div className="text-sm text-orange-600">Total Waitlist Users</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {formatDate(lookupResult.stats.userRegistrationDate)}
                        </div>
                        <div className="text-sm text-green-600">User Registration Date</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;