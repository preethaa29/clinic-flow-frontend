import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../models/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasPatientProfile } = useAuth();
  const location = useLocation();

  const isProfileLoading = user?.role === 'PATIENT' && hasPatientProfile === null;

  if (isLoading || isProfileLoading) {
    return (
      <div className="page-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Intercept patient profile status
  if (user?.role === 'PATIENT') {
    if (hasPatientProfile === false && location.pathname !== '/profile/setup') {
      return <Navigate to="/profile/setup" replace />;
    }
    if (hasPatientProfile === true && location.pathname === '/profile/setup') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

