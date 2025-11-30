import { useEffect, useState } from 'react';
import { apiLogin, getToken } from '../utils/api';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.replace('/');
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const data = await apiLogin(email, password);
      
      // This is student login only
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="text-6xl mb-4 animate-float">🤖</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Learning Coach</h1>
          <p className="text-gray-600">Trợ lý học tập thông minh của bạn</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-blue-100 animate-fade-in-up">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Đăng nhập</h2>
          
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 Email
              </label>
              <input
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔒 Mật khẩu
              </label>
              <input
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2 animate-fade-in">
                <span className="text-xl">⚠️</span>
                <p className="text-sm flex-1">{error}</p>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang đăng nhập...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Đăng nhập</span>
                  <span>→</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Hint & Admin Login Link */}
        <div className="mt-6 text-center animate-fade-in space-y-3">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-xs font-medium text-yellow-800 mb-1">💡 Demo Account (Student)</p>
            <p className="text-xs text-yellow-700">
              Email: <span className="font-mono">demo@example.com</span> | 
              Password: <span className="font-mono">demo123</span>
            </p>
          </div>
          
          <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
            <p className="text-xs font-medium text-orange-800 mb-2">👨‍💼 Administrator?</p>
            <a 
              href="/admin/login" 
              className="inline-block bg-gradient-admin text-white px-4 py-2 rounded-lg font-semibold text-xs hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Go to Admin Login →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
