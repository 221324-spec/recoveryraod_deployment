import React from 'react';
import { Navigate } from 'react-router-dom';

/** Registration UI lives on the login page (split-shell). Direct links here keep working. */
export default function Register() {
  return <Navigate to="/login?flow=register" replace />;
}
