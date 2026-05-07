import React from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardSelector.css';

export default function DashboardSelector() {
  const navigate = useNavigate();

  const handleDashboardSelect = (role) => {
    // Store the selected role for after authentication
    localStorage.setItem('selectedRole', role);

    // Navigate to login page
    navigate('/login');
  };

  return (
    <div className="dashboard-selector min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Recovery Road</h1>
          <p className="text-xl text-gray-600">Choose your dashboard to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Admin Dashboard */}
          <div
            onClick={() => handleDashboardSelect('admin')}
            className="dashboard-card bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-blue-300 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="text-3xl">👑</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Admin</h3>
              <p className="text-gray-600 text-sm">System administration and management</p>
            </div>
          </div>

          {/* Supervisor Dashboard */}
          <div
            onClick={() => handleDashboardSelect('supervisor')}
            className="dashboard-card bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-green-300 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Supervisor</h3>
              <p className="text-gray-600 text-sm">Patient oversight and coordination</p>
            </div>
          </div>

          {/* Patient Dashboard */}
          <div
            onClick={() => handleDashboardSelect('patient')}
            className="dashboard-card bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-purple-300 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <span className="text-3xl">🙋‍♂️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Patient</h3>
              <p className="text-gray-600 text-sm">Recovery tracking and support</p>
            </div>
          </div>

          {/* NGO Dashboard */}
          <div
            onClick={() => handleDashboardSelect('ngo')}
            className="dashboard-card bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-orange-300 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">NGO</h3>
              <p className="text-gray-600 text-sm">Community support and resources</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Select a dashboard to explore the Recovery Road system
          </p>
        </div>
      </div>
    </div>
  );
}
