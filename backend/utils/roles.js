const ROLE_MAP = {
  admin: 'Admin',
  supervisor: 'Supervisor',
  patient: 'Patient',
  ngo: 'NGO'
};

function normalizeRole(role) {
  if (!role) return null;
  const value = String(role).trim();
  if (!value) return null;

  const key = value.toLowerCase();
  return ROLE_MAP[key] || value;
}

function roleKey(role) {
  const normalized = normalizeRole(role);
  return normalized ? normalized.toLowerCase() : null;
}

function rolesMatch(actualRole, expectedRole) {
  return roleKey(actualRole) === roleKey(expectedRole);
}

function getDashboardPath(role) {
  switch (roleKey(role)) {
    case 'admin':
      return '/admin/dashboard';
    case 'supervisor':
      return '/supervisor/dashboard';
    case 'patient':
      return '/patient/dashboard';
    case 'ngo':
      return '/ngo/dashboard';
    default:
      return '/login';
  }
}

module.exports = {
  normalizeRole,
  roleKey,
  rolesMatch,
  getDashboardPath
};