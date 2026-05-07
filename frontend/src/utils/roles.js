const ROLE_PATHS = {
  admin: '/admin/dashboard',
  supervisor: '/supervisor/dashboard',
  patient: '/patient/dashboard',
  ngo: '/ngo/dashboard'
};

export function normalizeRoleKey(role) {
  return (role || '').toString().trim().toLowerCase();
}

export function getDashboardPathForRole(role) {
  return ROLE_PATHS[normalizeRoleKey(role)] || '/login';
}
