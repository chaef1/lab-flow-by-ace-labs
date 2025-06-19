
import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('admin' | 'creator' | 'brand' | 'agency' | 'influencer')[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isLoading, userProfile } = useAuth();
  const location = useLocation();
  const redirectAttempted = useRef(false);

  // Enhanced debugging
  useEffect(() => {
    console.log('ProtectedRoute - Path:', location.pathname);
    console.log('ProtectedRoute - User:', user ? 'Authenticated' : 'Not authenticated');
    console.log('ProtectedRoute - UserProfile:', userProfile);
    console.log('ProtectedRoute - AllowedRoles:', allowedRoles);
    console.log('ProtectedRoute - IsLoading:', isLoading);
    
    // Reset redirect attempt if we have a user
    if (user) {
      redirectAttempted.current = false;
    }
  }, [user, userProfile, allowedRoles, isLoading, location.pathname]);

  // Show loading state while authentication is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Don't redirect if already on auth page
  if (location.pathname === "/auth") {
    return <>{children}</>;
  }

  // If no user and we haven't attempted redirect, go to auth
  if (!user && !redirectAttempted.current) {
    redirectAttempted.current = true;
    console.log(`Redirecting to auth from ${location.pathname}`);
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // If we have a user but no profile yet, show loading
  if (user && !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If allowedRoles is specified, check if user has one of the allowed roles
  if (allowedRoles && userProfile) {
    if (!allowedRoles.includes(userProfile.role)) {
      console.log(`Access denied: User role ${userProfile.role} not in allowed roles:`, allowedRoles);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
