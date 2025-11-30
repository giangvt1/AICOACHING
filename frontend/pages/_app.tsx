import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/theme.css';
import '../styles/animations.css';
import NavBar from '../components/NavBar';
import ChatWidget from '../components/ChatWidget';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getToken } from '../utils/api';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [showNav, setShowNav] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const noNavRoutes = ['/login', '/register'];
    const isAdminRoute = router.pathname.startsWith('/admin');
    
    // Don't show regular nav on admin routes or no-nav routes
    setShowNav(!noNavRoutes.includes(router.pathname) && !isAdminRoute);
    
    // Only show chat widget for non-admin logged-in users
    setShowChat(!!getToken() && !noNavRoutes.includes(router.pathname) && !isAdminRoute);
  }, [router.pathname]);

  // Admin routes handle their own layout (AdminLayout component)
  const isAdminRoute = router.pathname.startsWith('/admin');
  const isAuthRoute = router.pathname === '/login' || router.pathname === '/register';

  if (isAdminRoute || isAuthRoute) {
    // Admin pages and auth pages render their own complete layouts
    return <Component {...pageProps} />;
  }

  // Student pages use the regular layout
  return (
    <>
      {showNav && <NavBar />}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Component {...pageProps} />
      </div>
      {showChat && <ChatWidget />}
    </>
  );
}
