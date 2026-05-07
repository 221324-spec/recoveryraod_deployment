import { useEffect } from 'react';

// Demo data initialization component
const DemoDataInitializer = () => {
  useEffect(() => {
    // Initialize demo users if they don't exist
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

    if (existingUsers.length === 0) {
      const demoUsers = [
        {
          id: 1,
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@recoveryroad.com',
          password: 'supervisor123',
          role: 'supervisor',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          name: 'John Smith',
          email: 'john.smith@recoveryroad.com',
          password: 'patient123',
          role: 'patient',
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          name: 'Hope Center NGO',
          email: 'admin@hopecenter.org',
          password: 'ngo123',
          role: 'ngo',
          createdAt: new Date().toISOString()
        }
      ];

      localStorage.setItem('registeredUsers', JSON.stringify(demoUsers));
      console.log('Demo users initialized:', demoUsers);
    }
  }, []);

  return null; // This component doesn't render anything
};

export default DemoDataInitializer;
