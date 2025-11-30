import { useState } from 'react';
import { apiPost } from '../utils/api';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      await apiPost('/auth/register', { email, password, full_name: fullName });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-fade-in-down">
          <div className="text-6xl mb-4 animate-float">🎓</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Tạo tài khoản mới</h1>
          <p className="text-gray-600">Bắt đầu hành trình học tập của bạn</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-purple-100 animate-fade-in-up">
          {success ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4 animate-bounce">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Đăng ký thành công!</h2>
              <p className="text-gray-600">Đang chuyển đến trang đăng nhập...</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Đăng ký</h2>
              
              <form onSubmit={onSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👤 Họ và tên
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📧 Email
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
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
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2 animate-fade-in">
                    <span className="text-xl">⚠️</span>
                    <p className="text-sm flex-1">{error}</p>
                  </div>
                )}

                <button
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white px-6 py-4 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang đăng ký...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>Tạo tài khoản</span>
                      <span>→</span>
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Đã có tài khoản?{' '}
                  <Link href="/login" className="text-purple-600 font-semibold hover:text-purple-700 hover:underline">
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Benefits */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-100">
            <p className="text-2xl mb-2">🤖</p>
            <p className="text-xs font-semibold text-gray-800">AI Trợ lý</p>
            <p className="text-xs text-gray-600">Hỗ trợ 24/7</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-md border-2 border-purple-100">
            <p className="text-2xl mb-2">📊</p>
            <p className="text-xs font-semibold text-gray-800">Theo dõi tiến độ</p>
            <p className="text-xs text-gray-600">Chi tiết và chính xác</p>
          </div>
        </div>
      </div>
    </div>
  );
}
