import { useEffect, useState } from 'react';
import { apiGet } from '../../utils/api';
import withAdminAuth from '../../utils/withAdminAuth';
import AdminLayout from '../../components/AdminLayout';
import Link from 'next/link';

type Stats = {
  total_students: number;
  active_students: number;
  total_sessions: number;
  completed_sessions: number;
  avg_completion_rate: number;
  total_diagnostic_tests: number;
  total_exercises_completed: number;
};

function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await apiGet('/admin/stats');
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error || 'Failed to load dashboard'}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span>📊</span>
            <span>Admin Dashboard</span>
          </h1>
          <p className="text-gray-600">Platform overview and statistics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in-up">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2 font-medium">Total Students</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stats.total_students}</p>
                <p className="text-xs text-blue-600">Registered users</p>
              </div>
              <div className="text-4xl animate-float">👥</div>
            </div>
          </div>

          {/* Active Students */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in-up delay-100">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2 font-medium">Active Students</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stats.active_students}</p>
                <p className="text-xs text-green-600">With completed sessions</p>
              </div>
              <div className="text-4xl animate-float">✅</div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in-up delay-200">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2 font-medium">Avg Completion</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stats.avg_completion_rate.toFixed(1)}%</p>
                <p className="text-xs text-purple-600">{stats.completed_sessions}/{stats.total_sessions} sessions</p>
              </div>
              <div className="text-4xl animate-float">📈</div>
            </div>
          </div>

          {/* Diagnostic Tests */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all hover:-translate-y-1 animate-fade-in-up delay-300">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 mb-2 font-medium">Diagnostic Tests</p>
                <p className="text-4xl font-bold text-gray-900 mb-1">{stats.total_diagnostic_tests}</p>
                <p className="text-xs text-orange-600">Students tested</p>
              </div>
              <div className="text-4xl animate-float">📝</div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Session Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📚</span>
              <span>Session Statistics</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Sessions</span>
                <span className="text-2xl font-bold text-blue-600">{stats.total_sessions}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <span className="text-gray-700 font-medium">Completed</span>
                <span className="text-2xl font-bold text-green-600">{stats.completed_sessions}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <span className="text-gray-700 font-medium">Completion Rate</span>
                <span className="text-2xl font-bold text-purple-600">{stats.avg_completion_rate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Exercises Stats */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>✨</span>
              <span>Exercise Statistics</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                <span className="text-gray-700 font-medium">Total Exercises</span>
                <span className="text-2xl font-bold text-indigo-600">{stats.total_exercises_completed}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-pink-50 rounded-lg">
                <span className="text-gray-700 font-medium">Diagnostic Tests</span>
                <span className="text-2xl font-bold text-pink-600">{stats.total_diagnostic_tests}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <span className="text-gray-700 font-medium">Avg per Student</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {stats.total_students > 0 
                    ? (stats.total_exercises_completed / stats.total_students).toFixed(1)
                    : '0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚡</span>
            <span>Quick Actions</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/students"
              className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">👥</div>
              <p className="font-bold text-gray-800 text-lg mb-1">View All Students</p>
              <p className="text-sm text-gray-600">Manage student accounts</p>
            </Link>

            <Link
              href="/admin/analytics"
              className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">📊</div>
              <p className="font-bold text-gray-800 text-lg mb-1">View Analytics</p>
              <p className="text-sm text-gray-600">Detailed reports & insights</p>
            </Link>

            <button
              onClick={loadStats}
              className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:shadow-lg transition-all hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">🔄</div>
              <p className="font-bold text-gray-800 text-lg mb-1">Refresh Data</p>
              <p className="text-sm text-gray-600">Update statistics</p>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminDashboard);

