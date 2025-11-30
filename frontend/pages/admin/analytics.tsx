import { useEffect, useState } from 'react';
import { apiGet } from '../../utils/api';
import withAdminAuth from '../../utils/withAdminAuth';
import AdminLayout from '../../components/AdminLayout';

type Stats = {
  total_students: number;
  active_students: number;
  total_sessions: number;
  completed_sessions: number;
  avg_completion_rate: number;
  total_diagnostic_tests: number;
  total_exercises_completed: number;
};

function AnalyticsPage() {
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
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error || 'Failed to load analytics'}</p>
        </div>
      </AdminLayout>
    );
  }

  const activeRate = stats.total_students > 0 
    ? ((stats.active_students / stats.total_students) * 100).toFixed(1)
    : '0';

  const avgExercisesPerStudent = stats.total_students > 0
    ? (stats.total_exercises_completed / stats.total_students).toFixed(1)
    : '0';

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span>📈</span>
            <span>Platform Analytics</span>
          </h1>
          <p className="text-gray-600">Detailed insights and metrics</p>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Student Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>👥</span>
              <span>Student Metrics</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-gray-700">Total Students</span>
                <span className="text-2xl font-bold text-blue-600">{stats.total_students}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-gray-700">Active Students</span>
                <span className="text-2xl font-bold text-green-600">{stats.active_students}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-gray-700">Activation Rate</span>
                <span className="text-2xl font-bold text-purple-600">{activeRate}%</span>
              </div>
            </div>
          </div>

          {/* Session Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📚</span>
              <span>Session Metrics</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <span className="text-sm text-gray-700">Total Sessions</span>
                <span className="text-2xl font-bold text-indigo-600">{stats.total_sessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                <span className="text-sm text-gray-700">Completed</span>
                <span className="text-2xl font-bold text-teal-600">{stats.completed_sessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
                <span className="text-sm text-gray-700">Completion Rate</span>
                <span className="text-2xl font-bold text-cyan-600">{stats.avg_completion_rate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Assessment Metrics */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>✨</span>
              <span>Assessment Metrics</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <span className="text-sm text-gray-700">Diagnostic Tests</span>
                <span className="text-2xl font-bold text-orange-600">{stats.total_diagnostic_tests}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                <span className="text-sm text-gray-700">Exercises Done</span>
                <span className="text-2xl font-bold text-pink-600">{stats.total_exercises_completed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm text-gray-700">Avg per Student</span>
                <span className="text-2xl font-bold text-yellow-600">{avgExercisesPerStudent}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Engagement Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Engagement Score */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span>🎯</span>
              <span>Platform Engagement</span>
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Active Users</span>
                  <span className="font-bold text-gray-800">{stats.active_students}/{stats.total_students}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all"
                    style={{ width: `${activeRate}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Session Completion</span>
                  <span className="font-bold text-gray-800">{stats.completed_sessions}/{stats.total_sessions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all"
                    style={{ width: `${stats.avg_completion_rate}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Diagnostic Coverage</span>
                  <span className="font-bold text-gray-800">{stats.total_diagnostic_tests}/{stats.total_students}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-red-600 h-4 rounded-full transition-all"
                    style={{ width: `${stats.total_students > 0 ? (stats.total_diagnostic_tests / stats.total_students * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>💡</span>
              <span>Key Insights</span>
            </h3>
            <div className="space-y-3">
              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">Student Engagement</p>
                <p className="text-xs text-gray-600">
                  {parseFloat(activeRate) >= 70 
                    ? '✅ Great! Most students are actively learning.'
                    : parseFloat(activeRate) >= 40
                    ? '⚠️ Moderate engagement. Consider outreach campaigns.'
                    : '❌ Low engagement. Review onboarding process.'}
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">Completion Rate</p>
                <p className="text-xs text-gray-600">
                  {stats.avg_completion_rate >= 70
                    ? '✅ Excellent completion rate!'
                    : stats.avg_completion_rate >= 50
                    ? '⚠️ Good, but room for improvement.'
                    : '❌ Many incomplete sessions. Check scheduling.'}
                </p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 mb-1">Assessment Participation</p>
                <p className="text-xs text-gray-600">
                  {stats.total_diagnostic_tests >= stats.total_students * 0.8
                    ? '✅ High diagnostic test participation!'
                    : stats.total_diagnostic_tests >= stats.total_students * 0.5
                    ? '⚠️ Encourage more students to take diagnostic tests.'
                    : '❌ Low diagnostic participation. Promote benefits.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-xl shadow-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span>📊</span>
            <span>Platform Summary</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-5">
              <p className="text-sm opacity-90 mb-2">Total Platform Activity</p>
              <p className="text-3xl font-bold">{stats.total_sessions + stats.total_exercises_completed}</p>
              <p className="text-xs opacity-75 mt-1">Sessions + Exercises</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-5">
              <p className="text-sm opacity-90 mb-2">Avg Sessions per Student</p>
              <p className="text-3xl font-bold">
                {stats.total_students > 0 ? (stats.total_sessions / stats.total_students).toFixed(1) : '0'}
              </p>
              <p className="text-xs opacity-75 mt-1">Learning sessions</p>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-5">
              <p className="text-sm opacity-90 mb-2">Platform Health Score</p>
              <p className="text-3xl font-bold">
                {(
                  (parseFloat(activeRate) * 0.4) +
                  (stats.avg_completion_rate * 0.4) +
                  ((stats.total_diagnostic_tests / Math.max(stats.total_students, 1)) * 100 * 0.2)
                ).toFixed(0)}%
              </p>
              <p className="text-xs opacity-75 mt-1">Overall platform health</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AnalyticsPage);

