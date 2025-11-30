import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getToken, isAdmin } from './api';

/**
 * Higher-order component to protect admin routes
 * Redirects to login if not authenticated or not admin
 */
export default function withAdminAuth<P extends object>(
  Component: React.ComponentType<P>
) {
  return function ProtectedRoute(props: P) {
    const router = useRouter();

    useEffect(() => {
      const token = getToken();
      
      // Not logged in - redirect to admin login
      if (!token) {
        router.replace('/admin/login');
        return;
      }

      // Logged in but not admin - redirect to student dashboard
      if (!isAdmin()) {
        router.replace('/');
        return;
      }
    }, [router]);

    // Only render if authenticated and admin
    const token = getToken();
    if (!token || !isAdmin()) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-600">Verifying access...</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

