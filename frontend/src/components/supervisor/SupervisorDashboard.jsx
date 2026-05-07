import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaClipboardList, FaExclamationTriangle, FaBullseye, FaComments, FaChevronLeft, FaSignOutAlt, FaChevronDown, FaFlag, FaBell, FaBrain, FaCalendarAlt } from 'react-icons/fa';

import PatientOverviewPanel from './PatientOverviewPanel';
import DailyLogsViewer from './DailyLogsViewer';
import SmartAlerts from './SmartAlerts';
import RelapseTracker from './RelapseTracker';
import CommunicationHub from './CommunicationHub';
import AssignGoal from './AssignGoal';
import GoalsList from './GoalsList';
import PatientGoals from './PatientGoals';
import ChatbotAlerts from './ChatbotAlerts';
import SupervisorAIMoodScansPanel from './SupervisorAIMoodScansPanel';
import EventsManager from './EventsManager';
import './SupervisorDashboardNavigation.css';
import './SupervisorDashboard.css';
import socketService from '../../services/socketService';
import NotificationPanel from '../../components/common/NotificationPanel';
import ThemeToggle from '../../components/common/ThemeToggle';
import { RecoveryRoadWordmark } from '../../components/common/RecoveryRoadLogoMark';
import { useAuth } from '../../context/AuthContext';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Note: Real authentication is handled by AuthContext
  // Demo mode has been disabled - users must log in properly

  useEffect(() => {
    // Connect to socket and subscribe to supervisor events when user id is available
    try {
      // Get userId from user context or localStorage
      let userId = user && (user.id || user._id);
      
      // If not available from context, try localStorage directly
      if (!userId) {
        try {
          const stored = localStorage.getItem('user');
          if (stored) {
            const parsed = JSON.parse(stored);
            userId = parsed.id || parsed._id || parsed.userId;
          }
        } catch (e) { /* ignore */ }
      }
      
      console.log('🔌 Supervisor connecting socket with userId:', userId);
      
      if (userId) {
        const sock = socketService.connect(userId);
        // Join dashboard subscription and appointment/alerts channels
        sock.emit('join', { userId });
        sock.emit('dashboard:subscribe', { userId });
        sock.emit('appointment:subscribe', { userId });
        sock.emit('alerts:subscribe', { userId });
      }

      // Listen for patient-scoped events that supervisors receive
      const handlePatientMood = (payload) => {
        console.log('sup: patient mood created', payload);
        setNotifications(prev => [{ type: 'mood', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };
      const handlePatientTrigger = (payload) => {
        console.log('sup: patient trigger created', payload);
        setNotifications(prev => [{ type: 'trigger', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };
      const handlePatientActivity = (payload) => {
        console.log('sup: patient activity created', payload);
        setNotifications(prev => [{ type: 'activity', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };
      const handleDashboardStats = (payload) => {
        console.log('sup: dashboard stats update', payload);
        // keep a small update notification
        setNotifications(prev => [{ type: 'stats', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };
      const handleCrisis = (payload) => {
        console.log('sup: crisis alert', payload);
        setNotifications(prev => [{ type: 'crisis', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };

      const handleMessageNew = (payload) => {
        console.log('sup: message:new', payload);
        setUnreadMessages(prev => prev + 1);
        setNotifications(prev => [{ type: 'message', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };

      // Goal event handlers
      const handleGoalCreated = (payload) => {
        console.log('sup: goal:assigned', payload);
        setNotifications(prev => [{ type: 'goal', message: 'New goal assigned successfully', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };

      const handleGoalProgress = (payload) => {
        console.log('sup: goal:progress:updated', payload);
        setNotifications(prev => [{ type: 'goal_progress', message: payload.message || 'Goal progress updated', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };

      // Chatbot high-risk alert handler
      const handleChatbotAlert = (payload) => {
        console.log('sup: new_alert (chatbot)', payload);
        setNotifications(prev => [{ type: 'chatbot_alert', message: `⚠️ High-risk chatbot alert: ${payload.patientName || 'Patient'}`, payload, ts: Date.now() }, ...prev].slice(0, 50));
      };

      socketService.on('patient:mood:created', handlePatientMood);
      socketService.on('patient:trigger:created', handlePatientTrigger);
      socketService.on('patient:activity:created', handlePatientActivity);
      socketService.on('dashboard:stats:update', handleDashboardStats);
      socketService.on('crisis:alert', handleCrisis);
      socketService.on('message:new', handleMessageNew);
      socketService.on('goal:assigned', handleGoalCreated);
      socketService.on('goal:progress:updated', handleGoalProgress);
      socketService.on('new_alert', handleChatbotAlert);

      return () => {
        socketService.off('patient:mood:created', handlePatientMood);
        socketService.off('patient:trigger:created', handlePatientTrigger);
        socketService.off('patient:activity:created', handlePatientActivity);
        socketService.off('dashboard:stats:update', handleDashboardStats);
        socketService.off('crisis:alert', handleCrisis);
        socketService.off('message:new', handleMessageNew);
        socketService.off('goal:assigned', handleGoalCreated);
        socketService.off('goal:progress:updated', handleGoalProgress);
        socketService.off('new_alert', handleChatbotAlert);
      };
    } catch (e) {
      console.error('Supervisor socket error', e);
    }
  }, [user && (user.id || user._id)]);
  const [currentView, setCurrentView] = useState('overview');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [goalMenuExpanded, setGoalMenuExpanded] = useState(false);
  const [goalView, setGoalView] = useState('assign'); // 'assign', 'list', 'patient'

  const handleNavigation = (view, context = {}) => {
    setCurrentView(view);
    if (context.selectedPatient) {
      setSelectedPatient(context.selectedPatient);
    }
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

  const effectiveCollapsed = sidebarCollapsed;
  const isGoalActive = currentView === 'goals';

  // Auto-expand goals submenu when active
  useEffect(() => {
    if (isGoalActive) setGoalMenuExpanded(true);
  }, [isGoalActive]);

  const getHeaderContent = () => {
    switch (currentView) {
      case 'overview':
        return {
          title: 'Patient Overview Dashboard',
          subtitle: 'Monitor and support patient recovery journeys',
          icon: FaUsers,
          status: 'Live Monitoring Active',
          profileTitle: 'Patient Management',
          profileSubtitle: 'Overview & Support'
        };
      case 'logs':
        return {
          title: selectedPatient ? `${selectedPatient.name} - Daily Progress` : 'Daily Logs Viewer',
          subtitle: 'Monitor daily check-ins and recovery analytics',
          icon: FaClipboardList,
          status: 'Live Monitoring Active',
          profileTitle: selectedPatient?.name || 'Select Patient',
          profileSubtitle: 'Daily Progress'
        };
      case 'alerts':
        return {
          title: 'Smart Alerts & Risk Detection',
          subtitle: 'AI-powered monitoring and intelligent risk assessment system',
          icon: FaExclamationTriangle,
          status: 'Live Monitoring Active',
          profileTitle: 'Alert System',
          profileSubtitle: 'AI-Powered Detection'
        };
      case 'chatbot-alerts':
        return {
          title: 'Chatbot Risk Alerts',
          subtitle: 'High-risk alerts from patient chatbot conversations',
          icon: FaExclamationTriangle,
          status: 'Live Monitoring Active',
          profileTitle: 'Chatbot Alerts',
          profileSubtitle: 'Patient Safety'
        };
      case 'relapse':
        return {
          title: 'Relapse Prevention Hub',
          subtitle: 'Monitor recovery milestones and manage relapse incidents',
          icon: FaBullseye,
          status: 'Live Monitoring Active',
          profileTitle: 'Prevention Hub',
          profileSubtitle: 'Risk Management'
        };
      case 'communication':
        return {
          title: 'Communication Hub',
          subtitle: 'Secure patient messaging and real-time communication platform',
          icon: FaComments,
          status: 'Live Messaging Active',
          profileTitle: 'Communication Center',
          profileSubtitle: 'HIPAA Compliant'
        };
      case 'goals':
        return {
          title: 'Goal Management System',
          subtitle: 'Assign, track, and manage patient recovery goals',
          icon: FaFlag,
          status: 'Goal Tracking Active',
          profileTitle: 'Goal Management',
          profileSubtitle: 'Recovery Objectives'
        };
      case 'ai-mood-scans':
        return {
          title: 'AI Mood Detection Scans',
          subtitle: 'Review facial emotion analysis results and patient mood patterns',
          icon: FaBrain,
          status: 'AI Analysis Active',
          profileTitle: 'AI Mood Scans',
          profileSubtitle: 'Emotion Detection'
        };
      case 'events':
        return {
          title: 'Events & Campaigns Manager',
          subtitle: 'Create and manage recovery events, awareness campaigns, and drives',
          icon: FaCalendarAlt,
          status: 'Event Management',
          profileTitle: 'Events Hub',
          profileSubtitle: 'Campaigns & Drives'
        };
      default:
        return {
          title: 'RecoveryRoad Supervisor Portal',
          subtitle: 'Comprehensive patient recovery management',
          icon: FaUsers,
          status: 'Live Monitoring Active',
          profileTitle: 'Supervisor Portal',
          profileSubtitle: 'Recovery Management'
        };
    }
  };

  const headerContent = getHeaderContent();

  const NAV_ITEM_BASE = 'group w-full flex items-center gap-3 rounded-lg transition-all duration-200';
  const navItemClasses = (active) => `${NAV_ITEM_BASE} ${effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'} ${
    active
      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200 dark:shadow-blue-950/60'
      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
  }`;
  const navIconClasses = (active) => `text-lg flex-shrink-0 ${active ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`;

  return (
    <div className="supervisor-dashboard h-screen flex bg-gray-50 dark:bg-slate-950 overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
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
        <nav className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide ${effectiveCollapsed ? 'px-2 pt-4' : 'px-3'} gap-1 pb-4`}>
          <button
            onClick={() => { expandSidebarOnClick(); setCurrentView('overview'); }}
            className={navItemClasses(currentView === 'overview')}
            title={effectiveCollapsed ? "Patient Overview" : ""}
          >
            <FaUsers className={navIconClasses(currentView === 'overview')} />
            {!effectiveCollapsed && <span className="text-sm font-semibold">Patient Overview</span>}
          </button>

          <button
            onClick={() => { expandSidebarOnClick(); setCurrentView('logs'); }}
            className={navItemClasses(currentView === 'logs')}
            title={effectiveCollapsed ? "Daily Logs" : ""}
          >
            <FaClipboardList className={navIconClasses(currentView === 'logs')} />
            {!effectiveCollapsed && <span className="text-sm font-semibold">Daily Logs</span>}
          </button>

          <button
            onClick={() => { expandSidebarOnClick(); setCurrentView('alerts'); }}
            className={navItemClasses(currentView === 'alerts')}
            title={effectiveCollapsed ? "Smart Alerts" : ""}
          >
            <FaExclamationTriangle className={navIconClasses(currentView === 'alerts')} />
            {!effectiveCollapsed && <span className="text-sm font-semibold">Smart Alerts</span>}
          </button>

          <button
            onClick={() => { expandSidebarOnClick(); setCurrentView('chatbot-alerts'); }}
            className={navItemClasses(currentView === 'chatbot-alerts')}
            title={effectiveCollapsed ? "Chatbot Alerts" : ""}
          >
            <FaBell className={navIconClasses(currentView === 'chatbot-alerts')} />
            {!effectiveCollapsed && <span className="text-sm font-semibold">Chatbot Alerts</span>}
          </button>

          <button
            onClick={() => { expandSidebarOnClick(); setCurrentView('relapse'); }}
            className={navItemClasses(currentView === 'relapse')}
            title={effectiveCollapsed ? "Relapse Prevention" : ""}
          >
            <FaBullseye className={navIconClasses(currentView === 'relapse')} />
            {!effectiveCollapsed && <span className="text-sm font-semibold">Relapse Prevention</span>}
          </button>

          <button
            onClick={() => {
              expandSidebarOnClick();
              setCurrentView('communication');
              setUnreadMessages(0);
            }}
            className={navItemClasses(currentView === 'communication')}
            title={effectiveCollapsed ? "Communication" : ""}
          >
            <span className="relative flex-shrink-0">
              <FaComments className={navIconClasses(currentView === 'communication')} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center animate-pulse leading-none">
                  {unreadMessages}
                </span>
              )}
            </span>
            {!effectiveCollapsed && (
              <span className="text-sm font-semibold flex items-center justify-between flex-1">
                Communication
                {unreadMessages > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                    {unreadMessages}
                  </span>
                )}
              </span>
            )}
          </button>

          <button
            onClick={() => { expandSidebarOnClick(); setCurrentView('ai-mood-scans'); }}
            className={navItemClasses(currentView === 'ai-mood-scans')}
            title={effectiveCollapsed ? "AI Mood Scans" : ""}
          >
            <FaBrain className={navIconClasses(currentView === 'ai-mood-scans')} />
            {!effectiveCollapsed && <span className="text-sm font-semibold">AI Mood Scans</span>}
          </button>

          <button
            onClick={() => { expandSidebarOnClick(); setCurrentView('events'); }}
            className={navItemClasses(currentView === 'events')}
            title={effectiveCollapsed ? "Events & Campaigns" : ""}
          >
            <FaCalendarAlt className={navIconClasses(currentView === 'events')} />
            {!effectiveCollapsed && <span className="text-sm font-semibold">Events</span>}
          </button>

          {/* Goal Management with Expandable Menu */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setGoalMenuExpanded(true); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isGoalActive) setGoalMenuExpanded(false); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('goals');
                setGoalView('assign');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isGoalActive
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/45 dark:text-blue-200'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300'
              }`}
              title={effectiveCollapsed ? "Goal Management" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaFlag className={`text-lg flex-shrink-0 ${isGoalActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Goals</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isGoalActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${goalMenuExpanded ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && goalMenuExpanded ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 dark:border-slate-600 space-y-0.5">
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'goals' && goalView === 'assign' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={(e) => { e.preventDefault(); setCurrentView('goals'); setGoalView('assign'); }}>Assign Goals</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'goals' && goalView === 'list' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={(e) => { e.preventDefault(); setCurrentView('goals'); setGoalView('list'); }}>Goals List</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'goals' && goalView === 'patient' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={(e) => { e.preventDefault(); setCurrentView('goals'); setGoalView('patient'); }}>Patient Goals</a>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer: profile + logout */}
        <div className={`flex-shrink-0 border-t border-gray-100 dark:border-slate-700 ${effectiveCollapsed ? 'p-2' : 'p-3'}`}>
          {!effectiveCollapsed ? (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-bold text-xs">{(user?.name || 'SUP').slice(0, 3).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'Supervisor'}</p>
                <p className="text-xs text-gray-500 dark:text-slate-400 truncate">{user?.email || 'Recovery Support'}</p>
              </div>
              <button
                title="Logout"
                onClick={() => { try { logout(); } catch (e) { localStorage.removeItem('token'); localStorage.removeItem('role'); } navigate('/login'); }}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">{(user?.name || 'SUP').slice(0, 3).toUpperCase()}</span>
              </div>
              <button
                title="Logout"
                onClick={() => { try { logout(); } catch (e) { localStorage.removeItem('token'); localStorage.removeItem('role'); } navigate('/login'); }}
                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-slate-800 transition-colors"
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0 bg-gray-50 dark:bg-slate-950">
        {/* Professional Header */}
        <header className="flex-shrink-0 w-full bg-gradient-to-r from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 shadow-lg border-b border-blue-100 dark:border-slate-700 px-6 py-4 flex justify-between items-center gap-4">
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
            <div className="hidden sm:flex items-center space-x-3 bg-sky-50 dark:bg-sky-950/50 px-4 py-2 rounded-full border border-sky-200 dark:border-sky-800 shrink-0">
              <div className="w-3 h-3 bg-sky-500 rounded-full animate-pulse shadow-sm"></div>
              <span className="text-sm text-sky-700 dark:text-sky-300 font-semibold whitespace-nowrap">{headerContent.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <NotificationPanel notifications={notifications} onDismiss={(item) => setNotifications(prev => prev.filter(n => n !== item))} />
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 min-h-0 p-6 overflow-y-auto scrollbar-hide overscroll-contain dark:bg-transparent">
          {currentView === 'overview' && <PatientOverviewPanel onNavigate={handleNavigation} />}
          {currentView === 'logs' && (
            <DailyLogsViewer
              selectedPatient={selectedPatient}
              onSelectPatient={(patient) => {
                setSelectedPatient(patient);
                setCurrentView('logs');
              }}
            />
          )}
          {currentView === 'alerts' && <SmartAlerts />}
          {currentView === 'chatbot-alerts' && <ChatbotAlerts />}
          {currentView === 'relapse' && <RelapseTracker />}
          {currentView === 'communication' && <CommunicationHub />}
          {currentView === 'goals' && (
            <>
              {goalView === 'assign' && <AssignGoal />}
              {goalView === 'list' && <GoalsList />}
              {goalView === 'patient' && <PatientGoals />}
            </>
          )}
          {currentView === 'ai-mood-scans' && <SupervisorAIMoodScansPanel />}
          {currentView === 'events' && <EventsManager />}
        </section>
      </main>
    </div>
  );
}