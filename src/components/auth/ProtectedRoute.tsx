
import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'creator' | 'brand' | 'agency' | 'influencer')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading, userProfile } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute - State:', {
      path: location.pathname,
      user: user ? 'Authenticated' : 'Not authenticated',
      profile: userProfile?.role || 'No profile',
      allowedRoles,
      isLoading
    });
  }, [user, userProfile, allowedRoles, isLoading, location.pathname]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    console.log('ProtectedRoute - Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-300/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  // Don't redirect if already on auth page
  if (location.pathname === "/auth") {
    console.log('ProtectedRoute - On auth page, allowing access');
    return <>{children}</>;
  }

  // If no user, redirect to auth
  if (!user) {
    console.log('ProtectedRoute - No user, redirecting to auth');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // If user is authenticated but no profile yet, show loading
  // This prevents premature access denials while profile is being fetched
  if (!userProfile) {
    console.log('ProtectedRoute - User authenticated but no profile yet, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-300/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-ace-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  // If allowedRoles is specified, check if user has one of the allowed roles
  if (allowedRoles && userProfile) {
    if (!allowedRoles.includes(userProfile.role)) {
      console.log('ProtectedRoute - Access denied for role:', userProfile.role, 'Required roles:', allowedRoles);
      console.log('ProtectedRoute - Redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }

  console.log('ProtectedRoute - Access granted for role:', userProfile.role);
  return <>{children}</>;
};

export default ProtectedRoute;
