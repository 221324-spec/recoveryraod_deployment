import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForRole, normalizeRoleKey } from '../utils/roles';

export default function PrivateRoute({ children, allowedRoles }) {
  const { user, token } = useAuth();
  const location = useLocation();

  if (!token) return <Navigate to="/login" state={{ from: location }} replace />;

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch (error) {
      return {};
    }
  })();

  const role = normalizeRoleKey(user?.role || user?.roleKey || storedUser.role);
  const allowed = (allowedRoles || []).map(normalizeRoleKey).filter(Boolean);

  if (allowed.length && !allowed.includes(role) && !allowed.includes('all')) {
    return <Navigate to={getDashboardPathForRole(role)} replace />;
  }

  return children;
}
