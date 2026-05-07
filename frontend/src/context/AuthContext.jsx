import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDashboardPathForRole, normalizeRoleKey } from '../utils/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
 
  const [user, setUser] = useState({ role: 'guest' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const stored = localStorage.getItem('user');
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser({ token, ...parsed, roleKey: parsed.roleKey || normalizeRoleKey(parsed.role) });
      } catch (e) {
        setUser({ role: 'guest' });
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userObj) => {
    
    console.log('🔐 AuthContext login - userObj received:', JSON.stringify(userObj, null, 2));
    localStorage.setItem('token', token);
    try {
      const roleKey = normalizeRoleKey(userObj.role);
      const store = {
        id: userObj._id || userObj.id,
        role: userObj.role,
        roleKey,
        name: userObj.name || '',
        
        assignedSupervisor: userObj.assignedSupervisor || null,
        assignedOrganization: userObj.assignedOrganization || null,
        status: userObj.status || null
      };
      console.log('🔐 AuthContext login - storing:', JSON.stringify(store, null, 2));
      localStorage.setItem('user', JSON.stringify(store));
      setUser({ token, ...store });
    } catch (e) {
      localStorage.setItem('user', JSON.stringify({ role: userObj.role }));
      setUser({ token, role: userObj.role });
    }
    
    try {
      const normalizedRole = normalizeRoleKey(userObj && userObj.role);
      localStorage.removeItem('selectedRole');
      window.location.href = getDashboardPathForRole(normalizedRole);
    } catch (e) {
      window.location.href = '/dashboard';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setUser({ role: 'guest' });
    try { window.location.href = '/login'; } catch (e) {}
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  
  const token = user?.token || localStorage.getItem('token');

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
