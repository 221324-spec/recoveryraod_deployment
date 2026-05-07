import React from 'react';
import './Profile.css';
import { FaUserMd, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaVenusMars } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function SupervisorProfile() {
  const { user } = useAuth();
  const profile = {
    name: user?.name || 'Supervisor Name',
    email: user?.email || 'supervisor@email.com',
    role: user?.role || 'Supervisor',
    phone: user?.phone || '+1234567890',
    address: user?.address || 'Office Address',
    dob: user?.dob || '1980-01-01',
    gender: user?.gender || 'Male',
  };

  return (
    <div className="profile-bg">
      <div className="profile-container">
  <button type="button" className="profile-back-btn" onClick={() => window.location.href = '/supervisor/dashboard'}>Back to Dashboard</button>
        <div className="profile-title">Supervisor Profile</div>
        <div className="profile-info-cards">
          <div className="profile-card">
            <span className="profile-card-icon"><FaUserMd /></span>
            <div>
              <div className="profile-card-label">Name</div>
              <div className="profile-card-value">{profile.name}</div>
            </div>
          </div>
          <div className="profile-card">
            <span className="profile-card-icon"><FaEnvelope /></span>
            <div>
              <div className="profile-card-label">Email</div>
              <div className="profile-card-value">{profile.email}</div>
            </div>
          </div>
          <div className="profile-card">
            <span className="profile-card-icon"><FaPhone /></span>
            <div>
              <div className="profile-card-label">Phone</div>
              <div className="profile-card-value">{profile.phone}</div>
            </div>
          </div>
          <div className="profile-card">
            <span className="profile-card-icon"><FaMapMarkerAlt /></span>
            <div>
              <div className="profile-card-label">Address</div>
              <div className="profile-card-value">{profile.address}</div>
            </div>
          </div>
          <div className="profile-card">
            <span className="profile-card-icon"><FaBirthdayCake /></span>
            <div>
              <div className="profile-card-label">Date of Birth</div>
              <div className="profile-card-value">{profile.dob}</div>
            </div>
          </div>
          <div className="profile-card">
            <span className="profile-card-icon"><FaVenusMars /></span>
            <div>
              <div className="profile-card-label">Gender</div>
              <div className="profile-card-value">{profile.gender}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
