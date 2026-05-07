import React, { useState, useEffect, useRef } from 'react';
import { FaSignOutAlt, FaHome, FaUsers, FaUserMd, FaChartBar, FaChevronLeft, FaChevronDown, FaSync } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import socketService from '../../services/socketService';
import NotificationPanel from '../../components/common/NotificationPanel';
import ThemeToggle from '../../components/common/ThemeToggle';
import { RecoveryRoadWordmark } from '../../components/common/RecoveryRoadLogoMark';
import './NgoDashboard.css';
import '../supervisor/SupervisorDashboardNavigation.css';

// Import NGO components
import OrganizationDashboard from './OrganizationDashboard';
import SupervisorManagement from './SupervisorManagement';
import PatientManagement from './PatientManagement';
import ImpactReports from './ImpactReports';

export default function NgoDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'supervisors', 'patients', 'reports'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ dashboard: true, supervisors: false, patients: false, reports: false });

  const [notifications, setNotifications] = useState([]);
  const contentRefreshRef = useRef(null);

  useEffect(() => {
    try {
      const userId = user && (user.id || user._id);
      const sock = socketService.connect(userId);
      if (userId) {
        sock.emit('join', { userId });
        sock.emit('dashboard:subscribe', { userId });
        sock.emit('alerts:subscribe', { userId });
        sock.emit('appointment:subscribe', { userId });
      }

      const handler = (payload) => setNotifications(prev => [{ type: 'update', payload, ts: Date.now() }, ...prev].slice(0,50));
      socketService.on('patient:mood:created', handler);
      socketService.on('patient:trigger:created', handler);
      socketService.on('patient:activity:created', handler);
      socketService.on('dashboard:stats:update', handler);
      socketService.on('crisis:alert', handler);
      socketService.on('patient:registered', handler);
      socketService.on('supervisor:registered', handler);

      return () => {
        socketService.off('patient:mood:created', handler);
        socketService.off('patient:trigger:created', handler);
        socketService.off('patient:activity:created', handler);
        socketService.off('dashboard:stats:update', handler);
        socketService.off('crisis:alert', handler);
        socketService.off('patient:registered', handler);
        socketService.off('supervisor:registered', handler);
      };
    } catch (e) {
      console.error('NGO socket wiring error', e);
    }
  }, [user && (user.id || user._id)]);

  // Sub-view states
  const [supervisorView, setSupervisorView] = useState('list'); // 'list', 'assign', 'add'
  const [patientView, setPatientView] = useState('list'); // 'list', 'progress', 'risks'
  const [reportsView, setReportsView] = useState('monthly'); // 'monthly', 'quarterly', 'export'

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (sidebarCollapsed || hoverExpanded) {
      setSidebarCollapsed(false);
      setIsManuallyExpanded(true);
      setHoverExpanded(false);
    } else {
      setSidebarCollapsed(true);
      setIsManuallyExpanded(false);
      setHoverExpanded(false);
    }
  };

  const handleSidebarMouseEnter = () => {
    if (sidebarCollapsed && !isManuallyExpanded) {
      setSidebarCollapsed(false);
      setHoverExpanded(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (hoverExpanded && !isManuallyExpanded) {
      setSidebarCollapsed(true);
      setHoverExpanded(false);
    }
  };

  const expandSidebarOnClick = () => {
    if (sidebarCollapsed || hoverExpanded) {
      setSidebarCollapsed(false);
      setIsManuallyExpanded(true);
      setHoverExpanded(false);
    }
  };

  const isDashboardActive = currentView === 'dashboard';
  const isSupervisorsActive = ['supervisors', 'assign', 'add'].includes(currentView);
  const isPatientsActive = ['patients', 'progress', 'risks'].includes(currentView);
  const isReportsActive = ['reports', 'monthly', 'quarterly', 'export'].includes(currentView);

  const effectiveCollapsed = sidebarCollapsed;

  // Auto-expand the sub-menu of the active section
  useEffect(() => {
    if (['supervisors', 'assign', 'add'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, supervisors: true }));
    } else if (['patients', 'progress', 'risks'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, patients: true }));
    } else if (['monthly', 'quarterly', 'export', 'reports'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, reports: true }));
    }
  }, [currentView]);

  const getHeaderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'Organization Dashboard',
          subtitle: 'Monitor overall NGO performance and key metrics',
          icon: FaHome,
          status: 'Live Monitoring Active',
          profileTitle: 'NGO Portal',
          profileSubtitle: 'Organization Management'
        };
      case 'supervisors':
      case 'assign':
      case 'add':
        return {
          title: 'Supervisor Management',
          subtitle: 'Manage supervisor assignments and oversight',
          icon: FaUserMd,
          status: 'Live Monitoring Active',
          profileTitle: 'Supervisor Hub',
          profileSubtitle: 'Team Management'
        };
      case 'patients':
      case 'progress':
      case 'risks':
        return {
          title: 'Patient Management',
          subtitle: 'Monitor patient recovery and risk assessment',
          icon: FaUsers,
          status: 'Live Monitoring Active',
          profileTitle: 'Patient Care',
          profileSubtitle: 'Recovery Support'
        };
      case 'monthly':
      case 'quarterly':
      case 'export':
        return {
          title: 'Impact Reports & Analytics',
          subtitle: 'Comprehensive reporting and performance analysis',
          icon: FaChartBar,
          status: 'Live Monitoring Active',
          profileTitle: 'Analytics Center',
          profileSubtitle: 'Impact Assessment'
        };
      default:
        return {
          title: 'NGO Organization Portal',
          subtitle: 'Comprehensive NGO management and analytics',
          icon: FaHome,
          status: 'Live Monitoring Active',
          profileTitle: 'NGO Portal',
          profileSubtitle: 'Organization Management'
        };
    }
  };

  const headerContent = getHeaderContent();
  const hideLiveMonitoringPill = ['supervisors', 'assign', 'add'].includes(currentView);

  return (
    <div className="ngo-dashboard h-screen flex bg-gray-50 dark:bg-slate-950 overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
      <aside
        className={`flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-300 overflow-hidden ${effectiveCollapsed ? 'w-[70px]' : 'w-[280px]'}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {/* Brand Header */}
        <div className={`flex items-center flex-shrink-0 border-b border-gray-100 dark:border-slate-700 ${effectiveCollapsed ? 'justify-center px-3 py-5' : 'px-5 py-5'}`}>
          {!effectiveCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <RecoveryRoadWordmark expanded className="min-w-0 flex-1 pr-2" />
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                title="Collapse Sidebar"
              >
                <FaChevronLeft className="text-sm" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <RecoveryRoadWordmark expanded={false} />
            </div>
          )}
        </div>

        {/* Menu Label */}
        {!effectiveCollapsed && (
          <div className="px-5 pt-5 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500">Menu</span>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide ${effectiveCollapsed ? 'px-2 pt-4' : 'px-3'} gap-1`}>
          {/* Dashboard */}
          <div>
            <button
              onClick={() => { expandSidebarOnClick(); setCurrentView('dashboard'); }}
              className={`group w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isDashboardActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-blue-950/60'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
              }`}
              title={effectiveCollapsed ? "Dashboard" : ""}
            >
              <FaHome className={`text-lg flex-shrink-0 ${isDashboardActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
              {!effectiveCollapsed && <span className="text-sm font-semibold">Dashboard</span>}
            </button>
          </div>

          {/* Supervisor Management */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, supervisors: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isSupervisorsActive) setExpandedMenus(prev => ({ ...prev, supervisors: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('supervisors');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isSupervisorsActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
              }`}
              title={effectiveCollapsed ? "Supervisors" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaUserMd className={`text-lg flex-shrink-0 ${isSupervisorsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Supervisors</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isSupervisorsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.supervisors ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.supervisors ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 dark:border-slate-600 space-y-0.5">
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'supervisors' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('supervisors')}>View Supervisors</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'assign' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('assign')}>Assign / Unassign</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'add' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('add')}>Add New</a>
              </div>
            </div>
          </div>

          {/* Patient Management */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, patients: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isPatientsActive) setExpandedMenus(prev => ({ ...prev, patients: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('patients');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isPatientsActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
              }`}
              title={effectiveCollapsed ? "Patients" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaUsers className={`text-lg flex-shrink-0 ${isPatientsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Patients</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isPatientsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.patients ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.patients ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 dark:border-slate-600 space-y-0.5">
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'patients' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('patients')}>Patient List</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'progress' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('progress')}>Progress</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'risks' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('risks')}>Risk Levels</a>
              </div>
            </div>
          </div>

          {/* Reports */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, reports: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isReportsActive) setExpandedMenus(prev => ({ ...prev, reports: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('monthly');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isReportsActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
              }`}
              title={effectiveCollapsed ? "Reports" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaChartBar className={`text-lg flex-shrink-0 ${isReportsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Reports</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isReportsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.reports ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.reports ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 dark:border-slate-600 space-y-0.5">
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'monthly' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('monthly')}>Monthly</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'quarterly' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('quarterly')}>Quarterly</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'export' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('export')}>Export</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer: profile + logout */}
        <div className={`flex-shrink-0 border-t border-gray-100 dark:border-slate-700 ${effectiveCollapsed ? 'p-2' : 'p-3'}`}>
          {!effectiveCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-bold text-xs">{(user?.name || 'NGO').slice(0, 3).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'NGO Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email || 'Organization'}</p>
              </div>
              <button
                title="Logout"
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">{(user?.name || 'NGO').slice(0, 3).toUpperCase()}</span>
              </div>
              <button
                title="Logout"
                onClick={handleLogout}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Professional Header */}
        <header className="flex-shrink-0 w-full bg-gradient-to-r from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 shadow-lg border-b border-blue-100 dark:border-slate-700 p-6 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-6 min-w-0 flex-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <headerContent.icon className="text-white text-xl" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 leading-tight truncate">{headerContent.title}</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium truncate">{headerContent.subtitle}</p>
              </div>
            </div>
            {!hideLiveMonitoringPill && (
              <div className="hidden sm:flex items-center space-x-3 bg-sky-50 dark:bg-sky-950/50 px-4 py-2 rounded-full border border-sky-200 dark:border-sky-800 shrink-0">
                <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse shadow-sm"></div>
                <span className="text-sm text-sky-700 dark:text-sky-300 font-semibold whitespace-nowrap">{headerContent.status}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => contentRefreshRef.current?.()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Refresh"
            >
              <FaSync className="text-sm" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <NotificationPanel notifications={notifications} onDismiss={(item) => setNotifications(prev => prev.filter(n => n !== item))} />
          </div>
        </header>

        <section className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overscroll-contain bg-gray-50 dark:bg-slate-950 p-8">
          {currentView === 'dashboard' && (
            <OrganizationDashboard
              onNavigate={setCurrentView}
              onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }}
            />
          )}
          {currentView === 'supervisors' && (
            <SupervisorManagement
              view="list"
              onNavigate={setCurrentView}
              onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }}
            />
          )}
          {currentView === 'assign' && (
            <SupervisorManagement view="assign" onNavigate={setCurrentView} onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }} />
          )}
          {currentView === 'add' && (
            <SupervisorManagement view="add" onNavigate={setCurrentView} onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }} />
          )}
          {currentView === 'patients' && (
            <PatientManagement view="list" onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }} />
          )}
          {currentView === 'progress' && (
            <PatientManagement view="progress" onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }} />
          )}
          {currentView === 'risks' && (
            <PatientManagement view="risks" onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }} />
          )}
          {currentView === 'monthly' && (
            <ImpactReports view="monthly" onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }} />
          )}
          {currentView === 'quarterly' && (
            <ImpactReports view="quarterly" onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }} />
          )}
          {currentView === 'export' && (
            <ImpactReports view="export" onRegisterContentRefresh={(fn) => { contentRefreshRef.current = fn; }} />
          )}
        </section>
      </main>
    </div>
  );
}