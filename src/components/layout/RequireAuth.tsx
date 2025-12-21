import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
interface RequireAuthProps {
  children: React.ReactNode;
}
export function RequireAuth({ children }: RequireAuthProps) {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const location = useLocation();
  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}