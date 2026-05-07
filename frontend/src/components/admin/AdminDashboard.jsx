import React from 'react';
import { FaSignOutAlt, FaHome, FaMapMarkerAlt, FaBuilding, FaChartLine, FaChevronLeft, FaChevronDown, FaSync } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../config/env';
import socketService from '../../services/socketService';
import NotificationPanel from '../../components/common/NotificationPanel';
import ThemeToggle from '../../components/common/ThemeToggle';
import { RecoveryRoadWordmark } from '../../components/common/RecoveryRoadLogoMark';
import './AdminDashboard.css';
import '../supervisor/SupervisorDashboardNavigation.css';

// Import all admin components
import SystemDashboard from './SystemDashboard';
import CreateGeoFence from './CreateGeoFence';
import EditGeoFence from './EditGeoFence';
import ViewGeoFenceAlerts from './ViewGeoFenceAlerts';
import ViewNGOs from './ViewNGOs';
import EditNGO from './EditNGO';
import NGOReports from './NGOReports';
import NGOImpactComparison from './NGOImpactComparison';
import RehabCenterPerformance from './RehabCenterPerformance';
import ExportReports from './ExportReports';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard'); // Main view states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ dashboard: true, geofence: false, ngo: false, analytics: false });

  // NGO Management state
  const [ngoView, setNgoView] = useState('list'); // 'list', 'edit', 'reports'
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Header-level live status (driven by current section + socket events)
  const [connectionStatus, setConnectionStatus] = useState(
    socketService.isConnected ? 'connected' : 'connecting'
  );
  const [viewLastUpdated, setViewLastUpdated] = useState(null);
  const [viewRefreshing, setViewRefreshing] = useState(false);
  const viewSyncRef = useRef(null);

  const handleViewSync = useCallback(() => {
    if (typeof viewSyncRef.current === 'function') {
      viewSyncRef.current();
    }
  }, []);

  // Reset header sync state when navigating between views so stale "Updated"
  // / "Syncing..." doesn't bleed over from the previous section.
  useEffect(() => {
    setViewLastUpdated(null);
    setViewRefreshing(false);
    viewSyncRef.current = null;
  }, [currentView]);

  // Auto-expand the sub-menu of the active section
  useEffect(() => {
    if (['create', 'edit', 'view'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, geofence: true }));
    } else if (['ngo-list', 'ngo-edit', 'ngo-reports'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, ngo: true }));
    } else if (['comparison', 'performance', 'export-all'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, analytics: true }));
    }
  }, [currentView]);

  // Which views render their own data with a refresh handler we want to expose.
  const SYNCABLE_VIEWS = new Set([
    'dashboard',
    'edit',
    'view',
    'ngo-list',
    'ngo-reports',
    'comparison',
    'performance',
    'export-all'
  ]);
  const viewHasSync = SYNCABLE_VIEWS.has(currentView);

  useEffect(() => {
    try {
      const userId = user && (user.id || user._id);
      const sock = socketService.connect(userId);
      if (userId) {
        sock.emit('join', { userId });
        sock.emit('dashboard:subscribe', { userId });
        sock.emit('alerts:subscribe', { userId });
        sock.emit('appointment:subscribe', { userId });
        // Subscribe to admin stats room for real-time updates
        sock.emit('admin:subscribe', { userId, role: 'admin' });
      }

      const handler = (payload) => setNotifications(prev => [{ type: 'update', payload, ts: Date.now() }, ...prev].slice(0,50));
      socketService.on('patient:mood:created', handler);
      socketService.on('patient:trigger:created', handler);
      socketService.on('patient:activity:created', handler);
      socketService.on('dashboard:stats:update', handler);
      socketService.on('crisis:alert', handler);
      
      // Subscribe to admin-specific events
      socketService.on('stats:updated', handler);
      socketService.on('mood:logged', handler);
      socketService.on('geofence:alert', handler);
      socketService.on('patient:registered', handler);
      socketService.on('organization:created', handler);

      // Connection status tracking for header pill
      const onConnect = () => setConnectionStatus('connected');
      const onDisconnect = () => setConnectionStatus('disconnected');
      socketService.on('connect', onConnect);
      socketService.on('disconnect', onDisconnect);
      if (socketService.isConnected) setConnectionStatus('connected');

      return () => {
        socketService.off('patient:mood:created', handler);
        socketService.off('patient:trigger:created', handler);
        socketService.off('patient:activity:created', handler);
        socketService.off('dashboard:stats:update', handler);
        socketService.off('crisis:alert', handler);
        socketService.off('stats:updated', handler);
        socketService.off('mood:logged', handler);
        socketService.off('geofence:alert', handler);
        socketService.off('patient:registered', handler);
        socketService.off('organization:created', handler);
        socketService.off('connect', onConnect);
        socketService.off('disconnect', onDisconnect);
      };
    } catch (e) {
      console.error('Admin socket wiring error', e);
    }
  }, []);

  // Derived header status pill content based on socket state
  // NOTE: AdminDashboard.css neutralizes green/emerald/teal classes, so we use sky for "online".
  const statusPill = (() => {
    if (connectionStatus === 'connected') {
      return {
        label: 'System Online',
        wrap: 'bg-sky-50 border-sky-200',
        dot: 'bg-sky-500',
        text: 'text-sky-700',
        pulse: true
      };
    }
    if (connectionStatus === 'connecting') {
      return {
        label: 'Connecting...',
        wrap: 'bg-amber-50 border-amber-200',
        dot: 'bg-amber-500',
        text: 'text-amber-700',
        pulse: true
      };
    }
    return {
      label: 'Offline',
      wrap: 'bg-red-50 border-red-200',
      dot: 'bg-red-500',
      text: 'text-red-700',
      pulse: false
    };
  })();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Track whether the expansion was triggered by hover (temporary) or click (persistent)
  const [hoverExpanded, setHoverExpanded] = useState(false);

  const toggleSidebar = () => {
    if (sidebarCollapsed || hoverExpanded) {
      // Manual expand via toggle button
      setSidebarCollapsed(false);
      setIsManuallyExpanded(true);
      setHoverExpanded(false);
    } else {
      // Manual collapse
      setSidebarCollapsed(true);
      setIsManuallyExpanded(false);
      setHoverExpanded(false);
    }
  };

  const handleSidebarMouseEnter = () => {
    // Only hover-expand if collapsed AND not already manually expanded
    if (sidebarCollapsed && !isManuallyExpanded) {
      setSidebarCollapsed(false);
      setHoverExpanded(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    // Only auto-collapse if it was opened via hover (not click)
    if (hoverExpanded && !isManuallyExpanded) {
      setSidebarCollapsed(true);
      setHoverExpanded(false);
    }
  };

  // Click on a nav icon while collapsed -> expand permanently
  const expandSidebarOnClick = () => {
    if (sidebarCollapsed || hoverExpanded) {
      setSidebarCollapsed(false);
      setIsManuallyExpanded(true);
      setHoverExpanded(false);
    }
  };

  const isDashboardActive = currentView === 'dashboard';
  const isGeofenceActive = ['create', 'edit', 'view'].includes(currentView);
  const isNgoActive = ['ngo-list', 'ngo-edit', 'ngo-reports'].includes(currentView);
  const isAnalyticsActive = ['comparison', 'performance', 'export-all'].includes(currentView);

  // Visual collapsed state: true only when sidebar is collapsed AND not hover/click expanded
  const effectiveCollapsed = sidebarCollapsed;

  const getHeaderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'System Administration Dashboard',
          subtitle: 'Global system monitoring and management overview',
          icon: FaHome,
          status: 'System Online',
          profileTitle: 'Admin Portal',
          profileSubtitle: 'System Management'
        };
      case 'create':
      case 'edit':
      case 'view':
        return {
          title: 'Geo-Fence Management',
          subtitle: 'Manage high-risk zones and location-based alerts',
          icon: FaMapMarkerAlt,
          status: 'System Online',
          profileTitle: 'Geo-Fence Hub',
          profileSubtitle: 'Zone Management'
        };
      case 'ngo-list':
      case 'ngo-edit':
      case 'ngo-reports':
        return {
          title: 'NGO / Rehab Center Management',
          subtitle: 'Oversee organizations and their performance',
          icon: FaBuilding,
          status: 'System Online',
          profileTitle: 'Organization Hub',
          profileSubtitle: 'NGO Management'
        };
      case 'comparison':
      case 'performance':
      case 'export-all':
        return {
          title: 'Organization-Level Analytics',
          subtitle: 'Comprehensive analytics and performance insights',
          icon: FaChartLine,
          status: 'System Online',
          profileTitle: 'Analytics Center',
          profileSubtitle: 'Performance Analysis'
        };
      default:
        return {
          title: 'System Administration Portal',
          subtitle: 'Global system management and analytics',
          icon: FaHome,
          status: 'System Online',
          profileTitle: 'Admin Portal',
          profileSubtitle: 'System Management'
        };
    }
  };

  const headerContent = getHeaderContent();

  // NGO Management handlers
  const handleEditNGO = (ngo) => {
    setSelectedNGO(ngo);
    setNgoView('edit');
    setCurrentView('ngo-edit');
  };

  const handleViewNGOReports = (ngo) => {
    setSelectedNGO(ngo);
    setNgoView('reports');
    setCurrentView('ngo-reports');
  };

  const handleSaveNGO = async (ngoData) => {
    try {
      const token = localStorage.getItem('token');
      const url = ngoData.id 
        ? `/api/organizations/${ngoData.id}`
        : '/api/organizations';
      const method = ngoData.id ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ngoData)
      });
      
      const result = await response.json();
      if (result.success) {
        alert('Organization saved successfully!');
        setCurrentView('ngo-list');
        setNgoView('list');
        setSelectedNGO(null);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error saving NGO:', error);
      alert('Failed to save organization');
    }
  };

  const handleCancelNGOEdit = () => {
    setCurrentView('ngo-list');
    setNgoView('list');
    setSelectedNGO(null);
  };

  return (
    <div className="admin-dashboard h-screen flex bg-gray-50 dark:bg-slate-950 overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
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
          {/* System Dashboard */}
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

          {/* Geo-Fence Management */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, geofence: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isGeofenceActive) setExpandedMenus(prev => ({ ...prev, geofence: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('create');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isGeofenceActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
              }`}
              title={effectiveCollapsed ? "Geo-Fence" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaMapMarkerAlt className={`text-lg flex-shrink-0 ${isGeofenceActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Geo-Fence</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isGeofenceActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.geofence ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.geofence ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 dark:border-slate-600 space-y-0.5">
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'create' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('create')}>Create Zones</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'edit' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('edit')}>Edit / Delete Zones</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'view' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('view')}>View Alerts</a>
              </div>
            </div>
          </div>

          {/* NGO / Rehab Center Management */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, ngo: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isNgoActive) setExpandedMenus(prev => ({ ...prev, ngo: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('ngo-list');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isNgoActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
              }`}
              title={effectiveCollapsed ? "NGO" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaBuilding className={`text-lg flex-shrink-0 ${isNgoActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Organizations</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isNgoActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.ngo ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.ngo ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 dark:border-slate-600 space-y-0.5">
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'ngo-list' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('ngo-list')}>All NGOs</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'ngo-edit' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => { setSelectedNGO(null); setCurrentView('ngo-edit'); }}>Add / Edit</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'ngo-reports' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('ngo-reports')}>Reports</a>
              </div>
            </div>
          </div>

          {/* Organization-Level Analytics */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, analytics: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isAnalyticsActive) setExpandedMenus(prev => ({ ...prev, analytics: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('comparison');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isAnalyticsActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
              }`}
              title={effectiveCollapsed ? "Analytics" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaChartLine className={`text-lg flex-shrink-0 ${isAnalyticsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Analytics</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isAnalyticsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.analytics ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.analytics ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 dark:border-slate-600 space-y-0.5">
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'comparison' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('comparison')}>NGO Comparison</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'performance' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('performance')}>Performance</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'export-all' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={() => setCurrentView('export-all')}>Export Reports</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer: profile + logout */}
        <div className={`flex-shrink-0 border-t border-gray-100 dark:border-slate-700 ${effectiveCollapsed ? 'p-2' : 'p-3'}`}>
          {!effectiveCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-bold text-xs">{(user?.name || 'ADM').slice(0, 3).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email || 'System Manager'}</p>
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
                <span className="text-white font-bold text-xs">{(user?.name || 'ADM').slice(0, 3).toUpperCase()}</span>
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
        <header className="flex-shrink-0 w-full bg-gradient-to-r from-white via-white to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-lg border-b border-blue-100 dark:border-slate-700 px-6 py-4 flex justify-between items-center gap-4">
          <div className="flex items-center space-x-5 min-w-0 flex-1">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <headerContent.icon className="text-white text-xl" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-slate-100 leading-tight truncate">{headerContent.title}</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 font-medium truncate">{headerContent.subtitle}</p>
              </div>
            </div>
            <div className={`hidden lg:flex items-center space-x-2 ${statusPill.wrap} px-3 py-1.5 rounded-full border flex-shrink-0`}>
              <div className={`w-2.5 h-2.5 ${statusPill.dot} rounded-full ${statusPill.pulse ? 'animate-pulse' : ''} shadow-sm`}></div>
              <span className={`text-xs ${statusPill.text} font-semibold whitespace-nowrap`}>{statusPill.label}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            {viewHasSync && (
              <div className="flex items-center space-x-2 pr-3 border-r border-gray-200 dark:border-slate-600">
                {viewLastUpdated && (
                  <div className="hidden md:flex flex-col leading-tight text-right">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-slate-500 font-semibold">Last Updated</span>
                    <span className="text-xs text-gray-700 dark:text-slate-200 font-semibold">{viewLastUpdated.toLocaleTimeString()}</span>
                  </div>
                )}
                <button
                  onClick={handleViewSync}
                  disabled={viewRefreshing}
                  title="Refresh"
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <FaSync className={viewRefreshing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">{viewRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            )}
            <ThemeToggle />
            <NotificationPanel notifications={notifications} onDismiss={(item) => setNotifications(prev => prev.filter(n => n !== item))} />
          </div>
        </header>

        <section className="flex-1 min-h-0 overflow-y-auto scrollbar-hide overscroll-contain bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6 lg:p-8">
          {currentView === 'dashboard' && (
            <SystemDashboard
              syncRef={viewSyncRef}
              onConnectionStatusChange={setConnectionStatus}
              onLastUpdatedChange={setViewLastUpdated}
              onRefreshingChange={setViewRefreshing}
            />
          )}
          {currentView === 'create' && <CreateGeoFence />}
          {currentView === 'edit' && (
            <EditGeoFence
              syncRef={viewSyncRef}
              onLastUpdatedChange={setViewLastUpdated}
              onRefreshingChange={setViewRefreshing}
            />
          )}
          {currentView === 'view' && (
            <ViewGeoFenceAlerts
              syncRef={viewSyncRef}
              onLastUpdatedChange={setViewLastUpdated}
              onRefreshingChange={setViewRefreshing}
            />
          )}
          {currentView === 'ngo-list' && (
            <ViewNGOs
              onEdit={handleEditNGO}
              onViewReports={handleViewNGOReports}
              syncRef={viewSyncRef}
              onLastUpdatedChange={setViewLastUpdated}
              onRefreshingChange={setViewRefreshing}
            />
          )}
          {currentView === 'ngo-edit' && <EditNGO ngo={selectedNGO} onSave={handleSaveNGO} onCancel={handleCancelNGOEdit} />}
          {currentView === 'ngo-reports' && (
            <NGOReports
              ngo={selectedNGO}
              syncRef={viewSyncRef}
              onLastUpdatedChange={setViewLastUpdated}
              onRefreshingChange={setViewRefreshing}
            />
          )}
          {currentView === 'comparison' && (
            <NGOImpactComparison
              syncRef={viewSyncRef}
              onLastUpdatedChange={setViewLastUpdated}
              onRefreshingChange={setViewRefreshing}
            />
          )}
          {currentView === 'performance' && (
            <RehabCenterPerformance
              syncRef={viewSyncRef}
              onLastUpdatedChange={setViewLastUpdated}
              onRefreshingChange={setViewRefreshing}
            />
          )}
          {currentView === 'export-all' && (
            <ExportReports
              syncRef={viewSyncRef}
              onLastUpdatedChange={setViewLastUpdated}
              onRefreshingChange={setViewRefreshing}
            />
          )}
        </section>
      </main>
    </div>
  );
}