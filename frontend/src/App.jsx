import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PrivateRoute from './pages/PrivateRoute';
import { VideoCallProvider } from './context/VideoCallContext';
import { IncomingCallModal, VideoCallScreen } from './components/VideoCall';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Register = lazy(() => import('./pages/Register'));
const ChooseRolePage = lazy(() => import('./pages/ChooseRolePage'));
const DashboardSelector = lazy(() => import('./pages/DashboardSelector'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const SupervisorDashboard = lazy(() => import('./components/supervisor/SupervisorDashboard'));
const PatientDashboard = lazy(() => import('./components/patient/PatientDashboard'));
const NgoDashboard = lazy(() => import('./components/ngo/NgoDashboard'));

function RouteFallback() {
  return (
    <div className="app-route-loading" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
      Loading…
    </div>
  );
}

function App() {
  const portalRoles = ['admin', 'supervisor', 'patient', 'ngo'];

  return (
    <VideoCallProvider>
      <IncomingCallModal />
      <VideoCallScreen />

      <Router>
        <div className="App">
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<Register />} />
                <Route path="/choose-role" element={<ChooseRolePage />} />
                <Route path="/dashboard" element={<PrivateRoute allowedRoles={portalRoles}><DashboardSelector /></PrivateRoute>} />
                <Route path="/admin/dashboard" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />
                <Route path="/supervisor/dashboard" element={<PrivateRoute allowedRoles={['supervisor']}><SupervisorDashboard /></PrivateRoute>} />
                <Route path="/patient/dashboard" element={<PrivateRoute allowedRoles={['patient']}><PatientDashboard /></PrivateRoute>} />
                <Route path="/ngo/dashboard" element={<PrivateRoute allowedRoles={['ngo']}><NgoDashboard /></PrivateRoute>} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
      </Router>
    </VideoCallProvider>
  );
}

export default App;
