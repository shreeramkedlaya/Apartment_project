import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '@/types/auth.types';
import { useAuth } from '@/context/AuthContext';

interface Props { role?: UserRole | null }

/**
 * Wraps a route tree to:
 * 1. Redirect unauthenticated users to /login
 * 2. Redirect wrong-role users to their correct home
 */
export default function ProtectedRoute({ role = null }: Props) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // wait for session restore

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
