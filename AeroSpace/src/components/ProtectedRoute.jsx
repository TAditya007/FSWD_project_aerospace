import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute
 * 
 * Checks if user is logged in AND has the required role.
 * If not logged in → redirect to /login
 * If logged in but wrong role → redirect to their own dashboard
 * 
 * NOTE: This is FRONTEND-ONLY protection (Phase 2 learning).
 * Real server-side authorization will be enforced in Phase 5 using JWT middleware.
 */
export default function ProtectedRoute({ children, requiredRole }) {
  // ── TEMP: Read mock session from localStorage ──
  const raw = localStorage.getItem('aerospec_user');

  // Not logged in at all
  if (!raw) return <Navigate to="/login" replace />;

  const user = JSON.parse(raw);

  // Logged in but wrong role
  if (requiredRole && user.role !== requiredRole) {
    // Redirect to their correct dashboard
    return user.role === 'admin'
      ? <Navigate to="/admin/dashboard" replace />
      : <Navigate to="/user/dashboard" replace />;
  }

  // All good — render the actual page
  return children;
}
