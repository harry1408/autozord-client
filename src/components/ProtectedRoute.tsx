import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    const fallback =
      user.role === 'GLOBAL_ADMIN' ? '/admin/shops' :
      user.role === 'CUSTOMER' ? '/shops' :
      '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
