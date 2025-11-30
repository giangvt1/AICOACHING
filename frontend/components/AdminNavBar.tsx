import Link from 'next/link';
import { useRouter } from 'next/router';
import { clearToken } from '../utils/api';

export default function AdminNavBar() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 shadow-xl border-b-4 border-orange-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-3xl animate-float">👨‍💼</div>
              <div>
                <span className="text-white font-bold text-xl">Admin Portal</span>
                <div className="text-xs text-orange-100">AI Learning Coach</div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/admin')
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              📊 Dashboard
            </Link>
            
            <Link
              href="/admin/students"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/admin/students') || router.pathname.startsWith('/admin/students/')
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              👥 Students
            </Link>
            
            <Link
              href="/admin/analytics"
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive('/admin/analytics')
                  ? 'bg-white text-orange-600 shadow-lg'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              📈 Analytics
            </Link>

            <div className="ml-4 h-8 w-px bg-white/30"></div>

            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Badge */}
      <div className="bg-orange-600/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1">
          <div className="flex items-center gap-2 text-xs text-white">
            <span className="inline-flex items-center gap-1 bg-orange-700 px-2 py-0.5 rounded-full font-semibold">
              <span>⚡</span>
              <span>ADMIN ACCESS</span>
            </span>
            <span className="opacity-75">You have full platform control</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

