
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForRole, normalizeRoleKey } from '../utils/roles';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();
  const role = normalizeRoleKey(user?.role || user?.roleKey);

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.map(normalizeRoleKey).includes(role)) {
    return <Navigate to={getDashboardPathForRole(role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
