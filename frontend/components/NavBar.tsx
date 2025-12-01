import Link from 'next/link';
import { useRouter } from 'next/router';
import { getToken, clearToken } from '../utils/api';
import { useEffect, useState } from 'react';

export default function NavBar() {
  const router = useRouter();
  const [hasToken, setHasToken] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    setHasToken(!!getToken());
    
    // Handle scroll effect
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const onLogout = () => {
    clearToken();
    router.push('/login');
  };
  
  const isActive = (path: string) => router.pathname === path;
  
  const navLinks = [
    { href: '/', label: 'Trang chủ', icon: '🏠' },
    { href: '/diagnostic', label: 'Chẩn đoán', icon: '📝' },
    { href: '/analysis', label: 'Phân tích', icon: '📊' },
    { href: '/learning-path', label: 'Lộ trình học', icon: '🗺️' },
    { href: '/exercises', label: 'Bài tập', icon: '✨' },
    { href: '/progress', label: 'Tiến độ', icon: '📈' },
    { href: '/profile', label: 'Hồ sơ', icon: '👤' },
  ];
  
  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white shadow-lg border-b border-gray-200'
          : 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 shadow-md'
      }`}
      style={{ backdropFilter: scrolled ? 'blur(10px)' : 'none' }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2 font-bold text-xl transition-all duration-300 hover:scale-105 ${
              scrolled ? 'text-blue-600' : 'text-white'
            }`}
          >
            <span className="text-2xl animate-float">🤖</span>
            <span>AI Learning Coach</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive(link.href)
                    ? scrolled
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white/20 text-white'
                    : scrolled
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-sm">{link.icon}</span>
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Auth Button */}
          <div className="hidden lg:flex items-center gap-3">
            {hasToken ? (
              <button
                onClick={onLogout}
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  scrolled
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Đăng xuất
              </button>
            ) : (
              <Link
                href="/login"
                className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 ${
                  scrolled
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                Đăng nhập
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 animate-fade-in-down">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3 ${
                    isActive(link.href)
                      ? scrolled
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-white/20 text-white'
                      : scrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white/90 hover:bg-white/10'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              ))}
              <div className="mt-2 pt-2 border-t border-white/20">
                {hasToken ? (
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      scrolled
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Đăng xuất
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className={`block text-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      scrolled
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
