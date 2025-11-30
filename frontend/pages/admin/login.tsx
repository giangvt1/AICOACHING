import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.set('username', email);
      formData.set('password', password);

      const response = await fetch(`${API_BASE}/admin/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Login failed');
      }

      const data = await response.json();
      
      // Store admin token
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user_type', 'admin');

      // Redirect to admin dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - AI Learning Coach</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
        <div className="max-w-md w-full mx-4">
          {/* Admin Badge */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-admin text-white px-6 py-2 rounded-full font-bold text-lg mb-4 shadow-lg">
              🔐 ADMIN PORTAL
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Administrator Login</h1>
            <p className="text-gray-600 mt-2">Access the management dashboard</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-orange-100">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="text-xl">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Admin Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@aicoach.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter admin password"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-admin text-white font-bold py-4 rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Authenticating...
                  </span>
                ) : (
                  'Login as Admin'
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-1">Admin Access Only</p>
                  <p className="text-orange-700">
                    This portal is restricted to authorized administrators.
                    For student login, please visit the <a href="/login" className="underline font-semibold">student login page</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Login Link */}
          <div className="text-center mt-6">
            <a
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              ← Back to Student Login
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

