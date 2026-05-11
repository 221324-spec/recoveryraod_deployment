import React, { useState, useEffect, useId } from 'react';
import { FaSignOutAlt, FaHome, FaSmile, FaBolt, FaDumbbell, FaCalendarAlt, FaEnvelope, FaChevronLeft, FaChevronDown, FaFlag, FaChartLine, FaBullseye, FaGamepad, FaBook, FaTrophy, FaAward, FaCertificate, FaExclamationTriangle, FaBrain, FaMapMarkerAlt, FaArrowUp, FaPlus, FaClock, FaHeart, FaPhone } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import FloatingChat from './FloatingChat';
import CrisisButton from './CrisisButton';
import Messages from './Messages';
import MoodLoggingScreen from './MoodLoggingScreen';
import TriggerLoggingScreen from './TriggerLoggingScreen';
import ActivityLoggingScreen from './ActivityLoggingScreen';
import AppointmentsScreen from './AppointmentsScreen';
import RelapseLoggingScreen from './RelapseLoggingScreen';
import GameDashboard from './GameDashboard';
import Goals from './Goals';
import LearningLibrary from './LearningLibrary';
import Leaderboard from './Leaderboard';
import AIMoodPromptModal from './AIMoodPromptModal';
import AIMoodScanScreen from './AIMoodScanScreen';
import EventsCalendar from './EventsCalendar';
import './PatientDashboard.css';
import '../supervisor/SupervisorDashboardNavigation.css';
import socketService from '../../services/socketService';
import NotificationPanel from '../../components/common/NotificationPanel';
import ThemeToggle from '../../components/common/ThemeToggle';
import { RecoveryRoadWordmark } from '../../components/common/RecoveryRoadLogoMark';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import patientWelcomeImg from '../../assets/patientpng.png';
import doctorProfileImg from '../../assets/doctorimagee.jpg';
import { apiFetch } from '../../config/env';

function resolvedAssignedSupervisor(user) {
  if (!user) return null;
  const raw = user.assignedSupervisor;
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    const hasPayload =
      raw.name != null || raw.email || raw.phone || raw.specialization != null;
    if (raw._id != null || hasPayload) return raw;
  }
  return null;
}

function formatDoctorSpecialization(spec) {
  const fallback = 'RECOVERY COACH';
  if (spec == null || spec === '') return fallback;
  const s = Array.isArray(spec)
    ? spec
        .map((x) => (typeof x === 'string' ? x.trim() : String(x ?? '')))
        .filter(Boolean)
        .join(', ')
    : String(spec).trim();
  return (s || 'Recovery Coach').toUpperCase();
}

function formatDoctorLocation(doc) {
  if (!doc) return 'Awaiting assignment';
  if (doc.location != null && String(doc.location).trim()) return String(doc.location).trim();
  if (doc.city != null && String(doc.city).trim()) return String(doc.city).trim();
  const a = doc.address;
  if (a && typeof a === 'object') {
    const cityState = [a.city, a.state].filter(Boolean).map(String);
    if (cityState.length) return cityState.join(', ');
    if (a.street && String(a.street).trim()) return String(a.street).trim();
  }
  if (doc.organizationName != null && String(doc.organizationName).trim()) {
    return String(doc.organizationName).trim();
  }
  return 'Recovery Support Team';
}

/* ---------- Reusable visual primitives for the patient dashboard overview ---------- */

// Tiny SVG sparkline used inside the metric cards.
const Sparkline = ({ data = [], color = '#3b82f6' }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 100;
      const y = 32 - ((v - min) / range) * 24 - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `0,32 ${points} 100,32`;
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="w-full h-9 md:h-10">
      <polygon points={area} fill={color} fillOpacity="0.15" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

// Animated donut — optional multi-color stroke for the wellness gauge.
const Donut = ({
  percent = 0,
  color = '#3b82f6',
  gradientStops,
  size = 140,
  strokeWidth = 12,
  label = 'WELLNESS',
  trackColor = '#e5e7eb',
  innerClassName = '',
  labelClassName = ''
}) => {
  const gid = `wellring_${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, percent)) / 100) * circumference;
  const strokePaint = gradientStops && gradientStops.length >= 2 ? `url(#${gid}-well-ring)` : color;
  return (
    <div className={`relative shrink-0 ${gradientStops ? 'drop-shadow-md' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {gradientStops && gradientStops.length >= 2 && (
          <defs>
            <linearGradient id={`${gid}-well-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
              {gradientStops.map((stop, idx) => (
                <stop key={idx} offset={`${(idx / (gradientStops.length - 1)) * 100}%`} stopColor={stop} />
              ))}
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokePaint}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 650ms cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className={`absolute inset-0 flex flex-col items-center justify-center ${innerClassName}`}>
        <span className="font-extrabold leading-none md:text-[3.35rem]" style={{ fontSize: `${Math.round(size * 0.172)}px` }}>{Math.round(percent)}%</span>
        <span className={`text-[11px] md:text-xs mt-2 md:mt-3 font-bold tracking-[0.22em] ${labelClassName}`}>{label}</span>
      </div>
    </div>
  );
};

// Mini month calendar with today highlighted.
const MiniCalendar = ({ dark }) => {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const monthName = today.toLocaleString('en-US', { month: 'long' });
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`text-xs font-bold tracking-[0.2em] ${dark ? 'text-slate-400' : 'text-gray-600'}`}>MY CALENDAR</h3>
        <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${dark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>
          {monthName}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className={`text-[10px] font-bold uppercase pb-0.5 ${dark ? 'text-slate-500' : 'text-gray-600'}`}>
            {d.slice(0, 3)}
          </div>
        ))}
        {cells.map((d, i) => {
          const isToday = d === today.getDate();
          return (
            <div
              key={i}
              className={`text-[11px] h-7 flex items-center justify-center rounded-md transition-colors ${
                isToday
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : d
                  ? dark
                  ? 'text-slate-200 hover:bg-blue-950/70 cursor-pointer'
                  : 'text-gray-700 hover:bg-blue-50 cursor-pointer'
                  : ''
              }`}
            >
              {d || ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function PatientDashboard() {
  console.log('PatientDashboard mounted (patched) -', new Date().toISOString());
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const { resolvedTheme } = useTheme();
  const darkMode = resolvedTheme === 'dark';
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeDialog, setActiveDialog] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isManuallyExpanded, setIsManuallyExpanded] = useState(false);
  const [hoverExpanded, setHoverExpanded] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    dashboard: false,
    communication: false,
    goals: false,
    learning: false,
    challenges: false,
    achievements: false
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [learningView, setLearningView] = useState('library');
  const [goalsView, setGoalsView] = useState('my-goals');
  const [notifications, setNotifications] = useState([]);
  const [showAIMoodPrompt, setShowAIMoodPrompt] = useState(false);
  const [aiMoodPromptReasons, setAiMoodPromptReasons] = useState([]);
  // Demo mode has been disabled - users must log in properly

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Only show loading spinner on the very first load
        // Background refreshes (after mood/activity entries) update silently
        const isInitialLoad = !dashboardData;
        if (isInitialLoad) setLoading(true);

        const authToken = token || localStorage.getItem('token');
        let response = await apiFetch('/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (!response || !response.ok) {
          if (isInitialLoad) {
            const statusInfo = response ? `${response.status} ${response.statusText}` : 'no-response';
            throw new Error(`Failed to fetch dashboard data (${statusInfo})`);
          }
          return; // silently ignore background refresh failures
        }

        const data = await response.json();
        if (data.success) {
          setDashboardData(data.data);
          setUnreadMessages(data.data.stats?.unreadMessages || 0);
          // Connect to socket and subscribe to realtime updates for this patient
          try {
            let userId = data.data.user && data.data.user._id;
            if (!userId) {
              try {
                const stored = localStorage.getItem('user');
                if (stored) {
                  const parsed = JSON.parse(stored);
                  userId = parsed && (parsed.id || parsed._id || parsed.userId) ? (parsed.id || parsed._id || parsed.userId) : null;
                }
              } catch (e) {
                // ignore
              }
            }

            console.log('🔌 Patient connecting socket with userId:', userId);

            if (userId) {
              const sock = socketService.connect(userId);
              sock.emit('join', { userId });
              sock.emit('dashboard:subscribe', { userId });
              sock.emit('appointment:subscribe', { userId });
            }
          } catch (e) {
            console.error('Patient socket error', e);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        if (!dashboardData) setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [refreshTrigger]);

  // Socket event handlers
  useEffect(() => {
    try {
      const patchSupervisorGoals = async () => {
        try {
          const authToken = token || localStorage.getItem('token');
          if (!authToken) return;
          const response = await apiFetch('/api/dashboard', {
            headers: { Authorization: `Bearer ${authToken}` },
          });
          if (!response.ok) return;
          const data = await response.json();
          if (!data.success || !data.data) return;
          setDashboardData((prev) =>
            prev
              ? {
                  ...prev,
                  supervisorAssignedGoals: data.data.supervisorAssignedGoals ?? prev.supervisorAssignedGoals,
                }
              : data.data
          );
        } catch {
          /* ignore transient refresh errors */
        }
      };

      const handleMessageNew = (payload) => {
        console.log('patient: message:new', payload);
        setUnreadMessages(prev => prev + 1);
        setNotifications(prev => [{ type: 'message', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };

      const handleAppointmentUpdate = (payload) => {
        console.log('patient: appointment update', payload);
        setNotifications(prev => [{ type: 'appointment', payload, ts: Date.now() }, ...prev].slice(0, 50));
      };

      // Goal event handlers for patient
      const handleGoalCreated = (payload) => {
        console.log('patient: goal:created', payload);
        setNotifications(prev => [{ type: 'goal', message: 'New goal assigned to you!', payload, ts: Date.now() }, ...prev].slice(0, 50));
        patchSupervisorGoals();
      };

      const handleGoalProgress = (payload) => {
        console.log('patient: goal:progress:updated', payload);
        setNotifications(prev => [{ type: 'goal_progress', message: payload.message || 'Goal progress updated', payload, ts: Date.now() }, ...prev].slice(0, 50));
        patchSupervisorGoals();
      };

      const handleGoalDeleted = (payload) => {
        console.log('patient: goal:deleted', payload);
        setNotifications(prev => [{ type: 'goal_deleted', message: 'A goal has been removed', payload, ts: Date.now() }, ...prev].slice(0, 50));
        patchSupervisorGoals();
      };

      // Real-time stats update — updates the 3 mini stats cards instantly
      const handleDashboardStats = (stats) => {
        console.log('patient: dashboard:stats', stats);
        setDashboardData((prev) =>
          prev ? { ...prev, stats: { ...prev.stats, ...stats } } : prev
        );
      };

      // When mood/activity/trigger is logged, silently refresh dashboard data
      const handleDataLogged = () => {
        setRefreshTrigger((prev) => prev + 1);
      };

      socketService.on('message:new', handleMessageNew);
      socketService.on('appointment:update', handleAppointmentUpdate);
      socketService.on('goal:created', handleGoalCreated);
      socketService.on('goal:progress:updated', handleGoalProgress);
      socketService.on('goal:deleted', handleGoalDeleted);
      socketService.on('dashboard:stats', handleDashboardStats);
      socketService.on('mood:logged', handleDataLogged);
      socketService.on('activity:logged', handleDataLogged);
      socketService.on('trigger:logged', handleDataLogged);

      return () => {
        socketService.off('message:new', handleMessageNew);
        socketService.off('appointment:update', handleAppointmentUpdate);
        socketService.off('goal:created', handleGoalCreated);
        socketService.off('goal:progress:updated', handleGoalProgress);
        socketService.off('goal:deleted', handleGoalDeleted);
        socketService.off('dashboard:stats', handleDashboardStats);
        socketService.off('mood:logged', handleDataLogged);
        socketService.off('activity:logged', handleDataLogged);
        socketService.off('trigger:logged', handleDataLogged);
      };
    } catch (e) {
      console.error('Patient socket setup error', e);
    }
  }, [token]);

  // AI Mood Prompt — check on mount if patient should be prompted
  useEffect(() => {
    const checkAIMoodPrompt = async () => {
      try {
        const authToken = token || localStorage.getItem('token');
        const stored = localStorage.getItem('user');
        let userId = null;
        if (stored) { try { const p = JSON.parse(stored); userId = p.id || p._id || p.userId; } catch {} }
        if (!userId) return;
        const res = await apiFetch(`/api/patients/${userId}/ai-mood/should-prompt`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.data?.shouldPrompt) {
          setAiMoodPromptReasons(data.data.reasons || []);
          setShowAIMoodPrompt(true);
        }
      } catch (e) {
        console.error('AI mood prompt check error:', e);
      }
    };
    checkAIMoodPrompt();
  }, [token]);

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

  const isDashboardActive = ['dashboard', 'mood', 'trigger', 'activity', 'relapse'].includes(currentView);
  const isGoalsActive = currentView === 'goals';
  const isCommunicationActive = ['messages', 'appointments'].includes(currentView);
  const isLearningActive = currentView === 'learning';
  const isChallengesActive = ['games', 'leaderboard'].includes(currentView);
  const isAchievementsActive = ['badges', 'certificates'].includes(currentView);

  // Auto-expand the menu of the active section
  useEffect(() => {
    if (['mood', 'trigger', 'activity', 'relapse'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, dashboard: true }));
    } else if (['messages', 'appointments'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, communication: true }));
    } else if (['games', 'leaderboard'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, challenges: true }));
    } else if (['badges', 'certificates'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, achievements: true }));
    } else if (currentView === 'goals') {
      setExpandedMenus(prev => ({ ...prev, goals: true }));
    } else if (currentView === 'learning') {
      setExpandedMenus(prev => ({ ...prev, learning: true }));
    }
  }, [currentView]);

  const handleMessagesClick = () => {
    setCurrentView('messages');
    setUnreadMessages(0);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    // Always refresh dashboard data when returning from any screen
    // This ensures today's mood, streak, and all stats are current
    setRefreshTrigger(prev => prev + 1);
  };

  const getHeaderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return {
          title: 'My Recovery Dashboard',
          subtitle: 'Track your progress and stay motivated on your recovery journey',
          icon: FaHome,
          status: 'Recovery Journey Active',
          profileTitle: 'Personal Dashboard',
          profileSubtitle: 'Recovery Progress'
        };
      case 'messages':
        return {
          title: 'Messages & Communication',
          subtitle: 'Connect with your support team and healthcare providers',
          icon: FaEnvelope,
          status: 'Secure Communication',
          profileTitle: 'Message Center',
          profileSubtitle: 'HIPAA Compliant'
        };
      case 'mood':
        return {
          title: 'Mood Tracking',
          subtitle: 'Monitor your emotional well-being and identify patterns',
          icon: FaSmile,
          status: 'Daily Check-ins Active',
          profileTitle: 'Mood Journal',
          profileSubtitle: 'Emotional Wellness'
        };
      case 'trigger':
        return {
          title: 'Trigger Management',
          subtitle: 'Identify and manage situations that challenge your recovery',
          icon: FaBolt,
          status: 'Risk Awareness Active',
          profileTitle: 'Trigger Log',
          profileSubtitle: 'Risk Management'
        };
      case 'activity':
        return {
          title: 'Activity Tracking',
          subtitle: 'Log your daily activities and coping strategies',
          icon: FaDumbbell,
          status: 'Activity Monitoring',
          profileTitle: 'Activity Journal',
          profileSubtitle: 'Daily Progress'
        };
      case 'appointments':
        return {
          title: 'My Appointments',
          subtitle: 'View and manage your scheduled appointments',
          icon: FaCalendarAlt,
          status: 'Appointment System',
          profileTitle: 'Schedule Manager',
          profileSubtitle: 'Healthcare Appointments'
        };
      case 'games':
        return {
          title: 'Recovery Games',
          subtitle: 'Engage in therapeutic games designed for recovery support',
          icon: FaGamepad,
          status: 'Therapeutic Gaming',
          profileTitle: 'Game Center',
          profileSubtitle: 'Interactive Therapy'
        };
      case 'goals':
        return {
          title: 'My Goals',
          subtitle: 'Set, track, and achieve your recovery objectives',
          icon: FaBullseye,
          status: 'Goal Tracking Active',
          profileTitle: 'Goal Management',
          profileSubtitle: 'Recovery Objectives'
        };
      case 'relapse':
        return {
          title: 'Relapse Logging',
          subtitle: 'Log a setback honestly — no judgement, only support',
          icon: FaExclamationTriangle,
          status: 'Incident Reporting',
          profileTitle: 'Relapse Log',
          profileSubtitle: 'Recovery Support'
        };
      case 'progress':
        return {
          title: 'Progress Tracking',
          subtitle: 'Visualize your recovery journey and celebrate milestones',
          icon: FaChartLine,
          status: 'Progress Monitoring',
          profileTitle: 'Progress Dashboard',
          profileSubtitle: 'Recovery Analytics'
        };
      case 'learning':
        return {
          title: 'Learning Center',
          subtitle: 'Expand your knowledge about addiction and recovery',
          icon: FaBook,
          status: 'Educational Resources',
          profileTitle: 'Knowledge Hub',
          profileSubtitle: 'Recovery Education'
        };
      case 'leaderboard':
        return {
          title: 'Recovery Leaderboard',
          subtitle: 'See how you compare with others on their recovery journey',
          icon: FaTrophy,
          status: 'Community Engagement',
          profileTitle: 'Achievement Board',
          profileSubtitle: 'Peer Comparison'
        };
      case 'milestones':
        return {
          title: 'Milestones Tracker',
          subtitle: 'Track and celebrate your recovery milestones',
          icon: FaFlag,
          status: 'Milestone Tracking',
          profileTitle: 'Milestone Manager',
          profileSubtitle: 'Achievement Tracking'
        };
      case 'badges':
        return {
          title: 'Achievement Badges',
          subtitle: 'View and collect badges for your recovery achievements',
          icon: FaAward,
          status: 'Badge Collection',
          profileTitle: 'Badge Gallery',
          profileSubtitle: 'Achievement Rewards'
        };
      case 'certificates':
        return {
          title: 'Certificates',
          subtitle: 'Download certificates for completed goals and achievements',
          icon: FaCertificate,
          status: 'Certificate Center',
          profileTitle: 'Certificate Hub',
          profileSubtitle: 'Official Recognition'
        };
      case 'ai-mood-scan':
        return {
          title: 'AI Mood Detection',
          subtitle: 'Facial emotion analysis powered by AI',
          icon: FaBrain,
          status: 'AI Analysis Ready',
          profileTitle: 'Mood Scanner',
          profileSubtitle: 'Emotion Detection'
        };
      case 'events':
        return {
          title: 'Events & Campaigns',
          subtitle: 'Join recovery events, awareness campaigns, and earn rewards',
          icon: FaCalendarAlt,
          status: 'Recovery Calendar',
          profileTitle: 'Events Hub',
          profileSubtitle: 'Campaigns & Rewards'
        };
      default:
        return {
          title: 'RecoveryRoad Patient Portal',
          subtitle: 'Your personal recovery companion and support system',
          icon: FaHome,
          status: 'Recovery Support Active',
          profileTitle: 'Patient Portal',
          profileSubtitle: 'Recovery Companion'
        };
    }
  };

  const headerContent = getHeaderContent();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your recovery dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 overflow-hidden" style={{ position: 'fixed', inset: 0 }}>
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const SubLink = ({ view, onClick, children }) => (
    <a
      href="#"
      className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === view ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`}
      onClick={(e) => { e.preventDefault(); onClick(); }}
    >
      {children}
    </a>
  );

  return (
    <div className={`patient-dashboard h-screen flex overflow-hidden ${darkMode ? 'patient-dashboard--dark bg-slate-950' : 'bg-gray-50'}`} style={{ position: 'fixed', inset: 0 }}>
      <aside
        className={`flex-shrink-0 flex flex-col transition-all duration-200 overflow-hidden patient-sidebar-shell ${effectiveCollapsed ? 'w-[70px]' : 'w-[280px]'} ${
          darkMode ? 'bg-slate-900 border-r border-slate-700/80' : 'bg-white border-r border-gray-200'
        }`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {/* Brand Header */}
        <div className={`flex items-center flex-shrink-0 ${darkMode ? 'border-b border-slate-700' : 'border-b border-gray-100'} ${effectiveCollapsed ? 'justify-center px-3 py-5' : 'px-5 py-5'}`}>
          {!effectiveCollapsed ? (
            <div className="flex items-center justify-between w-full">
              <RecoveryRoadWordmark forceDark={darkMode} expanded className="min-w-0 flex-1 pr-2" />
              <button
                onClick={toggleSidebar}
                className={`p-1.5 rounded-md transition-colors ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                title="Collapse Sidebar"
              >
                <FaChevronLeft className="text-sm" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <RecoveryRoadWordmark forceDark={darkMode} expanded={false} />
            </div>
          )}
        </div>

        {/* Menu Label */}
        {!effectiveCollapsed && (
          <div className="px-5 pt-5 pb-2">
            <span className={`text-[11px] font-semibold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-gray-400'}`}>Menu</span>
          </div>
        )}

        {/* Navigation */}
        <nav className={`flex-1 flex flex-col overflow-y-auto overflow-x-hidden scrollbar-hide ${effectiveCollapsed ? 'px-2 pt-4' : 'px-3'} gap-1 pb-4`}>
          {/* Dashboard */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, dashboard: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && currentView !== 'dashboard' && !['mood', 'trigger', 'activity', 'relapse'].includes(currentView)) setExpandedMenus(prev => ({ ...prev, dashboard: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('dashboard');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isDashboardActive
                ? (currentView === 'dashboard'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                  : 'bg-blue-50 text-blue-700')
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={effectiveCollapsed ? "Dashboard" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaHome className={`text-lg flex-shrink-0 ${currentView === 'dashboard' ? 'text-white' : (isDashboardActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600')}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Dashboard</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${currentView === 'dashboard' ? 'text-white' : (isDashboardActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600')} ${expandedMenus.dashboard ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.dashboard ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 space-y-0.5">
                <SubLink view="mood" onClick={() => setCurrentView('mood')}>Mood Check-in</SubLink>
                <SubLink view="trigger" onClick={() => setCurrentView('trigger')}>Trigger Log</SubLink>
                <SubLink view="activity" onClick={() => setCurrentView('activity')}>Activity Log</SubLink>
                <SubLink view="relapse" onClick={() => setCurrentView('relapse')}>Log Relapse</SubLink>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, goals: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isGoalsActive) setExpandedMenus(prev => ({ ...prev, goals: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('goals');
                setGoalsView('my-goals');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isGoalsActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={effectiveCollapsed ? "Goals" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaBullseye className={`text-lg flex-shrink-0 ${isGoalsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Goals</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isGoalsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.goals ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.goals ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 space-y-0.5">
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'goals' && goalsView === 'my-goals' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={(e) => { e.preventDefault(); setCurrentView('goals'); setGoalsView('my-goals'); }}>My Goals</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'goals' && goalsView === 'milestones' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={(e) => { e.preventDefault(); setCurrentView('goals'); setGoalsView('milestones'); }}>Milestones</a>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'goals' && goalsView === 'progress' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={(e) => { e.preventDefault(); setCurrentView('goals'); setGoalsView('progress'); }}>Progress</a>
              </div>
            </div>
          </div>

          {/* Communication */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, communication: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isCommunicationActive) setExpandedMenus(prev => ({ ...prev, communication: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                handleMessagesClick();
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isCommunicationActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={effectiveCollapsed ? "Communication" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex-shrink-0">
                  <FaEnvelope className={`text-lg ${isCommunicationActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center animate-pulse leading-none">
                      {unreadMessages}
                    </span>
                  )}
                </span>
                {!effectiveCollapsed && <span className="text-sm font-semibold">Communication</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isCommunicationActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.communication ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.communication ? 'max-h-60 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 space-y-0.5">
                <SubLink view="appointments" onClick={() => setCurrentView('appointments')}>Appointments</SubLink>
                <a href="#" className={`block px-3 py-2 text-sm rounded-md transition-colors ${currentView === 'messages' ? 'text-blue-700 bg-blue-50 font-semibold' : 'text-gray-500 hover:text-blue-700 hover:bg-blue-50'}`} onClick={(e) => { e.preventDefault(); handleMessagesClick(); }}>
                  <span className="flex items-center justify-between">
                    Messages
                    {unreadMessages > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadMessages}
                      </span>
                    )}
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Learning */}
          <div>
            <button
              onClick={() => { expandSidebarOnClick(); setCurrentView('learning'); }}
              className={`group w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isLearningActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={effectiveCollapsed ? "Learning" : ""}
            >
              <FaBook className={`text-lg flex-shrink-0 ${isLearningActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
              {!effectiveCollapsed && <span className="text-sm font-semibold">Learning</span>}
            </button>
          </div>

          {/* Challenges & Rewards */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, challenges: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isChallengesActive) setExpandedMenus(prev => ({ ...prev, challenges: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('games');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isChallengesActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={effectiveCollapsed ? "Challenges" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaGamepad className={`text-lg flex-shrink-0 ${isChallengesActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Challenges</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isChallengesActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.challenges ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.challenges ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 space-y-0.5">
                <SubLink view="games" onClick={() => setCurrentView('games')}>Games</SubLink>
                <SubLink view="leaderboard" onClick={() => setCurrentView('leaderboard')}>Leaderboard</SubLink>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div
            onMouseEnter={() => { if (!effectiveCollapsed) setExpandedMenus(prev => ({ ...prev, achievements: true })); }}
            onMouseLeave={() => { if (!effectiveCollapsed && !isAchievementsActive) setExpandedMenus(prev => ({ ...prev, achievements: false })); }}
          >
            <button
              onClick={() => {
                if (effectiveCollapsed) { expandSidebarOnClick(); return; }
                setCurrentView('badges');
              }}
              className={`group w-full flex items-center justify-between rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${isAchievementsActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={effectiveCollapsed ? "Achievements" : ""}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FaTrophy className={`text-lg flex-shrink-0 ${isAchievementsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                {!effectiveCollapsed && <span className="text-sm font-semibold">Achievements</span>}
              </div>
              {!effectiveCollapsed && (
                <FaChevronDown className={`text-xs transition-transform duration-200 ${isAchievementsActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'} ${expandedMenus.achievements ? 'rotate-180' : ''}`} />
              )}
            </button>

            <div className={`overflow-hidden transition-all duration-200 ${
                !effectiveCollapsed && expandedMenus.achievements ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}>
              <div className="ml-5 pl-4 border-l-2 border-gray-200 space-y-0.5">
                <SubLink view="badges" onClick={() => setCurrentView('badges')}>Badges</SubLink>
                <SubLink view="certificates" onClick={() => setCurrentView('certificates')}>Certificates</SubLink>
              </div>
            </div>
          </div>

          {/* Events & Campaigns */}
          <div>
            <button
              onClick={() => { expandSidebarOnClick(); setCurrentView('events'); }}
              className={`group w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${currentView === 'events'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={effectiveCollapsed ? "Events" : ""}
            >
              <FaCalendarAlt className={`text-lg flex-shrink-0 ${currentView === 'events' ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
              {!effectiveCollapsed && <span className="text-sm font-semibold">Events</span>}
            </button>
          </div>

          {/* AI Mood Scan */}
          <div>
            <button
              onClick={() => { expandSidebarOnClick(); setCurrentView('ai-mood-scan'); }}
              className={`group w-full flex items-center gap-3 rounded-lg transition-all duration-200 ${
                effectiveCollapsed ? 'justify-center p-3' : 'px-3 py-2.5'
              } ${currentView === 'ai-mood-scan'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-200'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
              }`}
              title={effectiveCollapsed ? "AI Mood Scan" : ""}
            >
              <FaBrain className={`text-lg flex-shrink-0 ${currentView === 'ai-mood-scan' ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
              {!effectiveCollapsed && <span className="text-sm font-semibold">AI Mood Scan</span>}
            </button>
          </div>
        </nav>

        {/* Sidebar Footer: profile + logout */}
        <div className={`flex-shrink-0 ${darkMode ? 'border-t border-slate-700' : 'border-t border-gray-100'} ${effectiveCollapsed ? 'p-2' : 'p-3'}`}>
          {!effectiveCollapsed ? (
            <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800/80' : 'hover:bg-gray-50'}`}>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-bold text-xs">{(dashboardData?.user?.name || 'PT').slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dashboardData?.user?.name || 'Patient'}</p>
                <p className={`text-xs truncate ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{dashboardData?.user?.email || 'Recovery Journey'}</p>
              </div>
              <button
                title="Logout"
                onClick={() => { try { logout(); } catch (e) { localStorage.removeItem('token'); localStorage.removeItem('role'); } navigate('/login'); }}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${darkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-xs">{(dashboardData?.user?.name || 'PT').slice(0, 2).toUpperCase()}</span>
              </div>
              <button
                title="Logout"
                onClick={() => { try { logout(); } catch (e) { localStorage.removeItem('token'); localStorage.removeItem('role'); } navigate('/login'); }}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
              >
                <FaSignOutAlt className="text-sm" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col overflow-hidden min-w-0 ${darkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
        {/* Professional Header - Fixed */}
                <header className={`flex-shrink-0 p-4 flex justify-between items-center z-20 border-b shadow-sm ${darkMode ? 'bg-[#171a26] border-slate-700/80 shadow-black/40' : 'bg-gradient-to-r from-white to-blue-50 shadow-lg border-blue-100'}`}>
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <headerContent.icon className="text-white text-xl" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-2xl font-bold leading-tight truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{headerContent.title}</h1>
                <p className={`text-sm font-semibold truncate ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{headerContent.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThemeToggle className="w-11 h-11" />
            <NotificationPanel notifications={notifications} onDismiss={(item) => setNotifications(prev => prev.filter(n => n !== item))} />
          </div>
        </header>

        {/* Content Area — fixed below header, scrollable */}
        <section className={`patient-main-scroll flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hide px-4 py-5 pt-2 lg:px-5 lg:py-6 ${darkMode ? 'patient-main-scroll--dark' : 'patient-main-scroll--light'}`}>
          {currentView === 'dashboard' && (() => {
            const now = new Date();
            const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
            const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

            const doctor = resolvedAssignedSupervisor(dashboardData?.user);
            const doctorName =
              doctor == null ? 'Not Assigned Yet' : doctor.name?.trim() || 'Care provider';
            const doctorSpec = formatDoctorSpecialization(doctor?.specialization);
            const doctorLocation = formatDoctorLocation(doctor);
            const doctorPhone = doctor?.phone || doctor?.contact || '—';
            const doctorAvatarSrc =
              doctor?.profilePicture &&
              typeof doctor.profilePicture === 'string' &&
              doctor.profilePicture.trim()
                ? doctor.profilePicture.trim()
                : doctorProfileImg;
            const memberSince = doctor?.createdAt
              ? new Date(doctor.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : '—';

            const sg = dashboardData?.supervisorAssignedGoals;
            const assignedGoalPreview = Array.isArray(sg?.items) ? sg.items : [];
            const activeAssignedGoals =
              typeof sg?.activeCount === 'number'
                ? sg.activeCount
                : assignedGoalPreview.filter((x) => !x.completed).length;
            const assignedGoalLines = assignedGoalPreview.slice(0, 3);
            const incompleteInPreview = assignedGoalLines.filter((g) => !g.completed).length;
            const moreActiveGoalsHint = Math.max(0, activeAssignedGoals - incompleteInPreview);

            const moodScore = dashboardData?.stats?.todayMood ?? 0;
            const goalsCompleted = dashboardData?.stats?.completedGoals ?? 0;
            const streakDays = dashboardData?.stats?.streakDays ?? 0;
            const messages = dashboardData?.stats?.unreadMessages ?? 0;
            const totalGoals = dashboardData?.stats?.totalGoals ?? 0;

            const wellnessPercent = Math.min(
              100,
              Math.round(
                (moodScore ? (moodScore / 4) * 40 : 0) +
                  Math.min(streakDays * 2, 30) +
                  (totalGoals ? Math.min((goalsCompleted / totalGoals) * 30, 30) : 15)
              ) || 65
            );

            const dailyGoalPct = totalGoals ? Math.min(100, Math.round((goalsCompleted / totalGoals) * 100)) : 64;
            const weeklyActivityPct = Math.min(100, Math.round((streakDays / 7) * 100)) || 50;
            const monthlyTrendPct = Math.min(100, Math.round((streakDays / 30) * 100)) || 33;

            const moodSeries = [3, 2, 3, 4, 3, 4, moodScore || 3];
            const activitySeries = [2, 4, 3, 5, 4, 6, Math.max(streakDays % 7, 3)];
            const goalsSeries = [1, 2, 2, 3, 3, 4, goalsCompleted || 4];

            const todaysPlan = [
              { time: '08:00 am', label: 'Morning mood check-in', detail: 'Log how you feel today', view: 'mood', color: 'bg-blue-500' },
              { time: '11:00 am', label: 'Activity log', detail: 'Track your wellness activities', view: 'activity', color: 'bg-green-500' },
              { time: '03:00 pm', label: 'Goals review', detail: 'Update progress on your goals', view: 'goals', color: 'bg-purple-500' },
              { time: '07:00 pm', label: 'Trigger reflection', detail: 'Reflect on today’s triggers', view: 'trigger', color: 'bg-orange-500' },
              { time: '09:00 pm', label: 'Evening journal', detail: 'Wrap up your recovery day', view: 'mood', color: 'bg-indigo-500' },
            ];

            const donutTrack = darkMode ? '#334155' : '#e7e9ef';
            const donutStops = ['#818cf8', '#c026d3', '#3b82f6'];
            const card = darkMode
              ? 'rounded-[1.35rem] border border-slate-700/85 bg-slate-900/90 shadow-xl shadow-black/35 backdrop-blur-md'
              : 'rounded-[1.35rem] border border-gray-100/95 bg-white shadow-md';
            const muted = darkMode ? 'text-slate-300' : 'text-gray-700';
            const mutedSoft = darkMode ? 'text-slate-400' : 'text-gray-600';
            const headline = darkMode ? 'text-white' : 'text-gray-900';

            return (
              <div className="space-y-3 lg:space-y-4 patient-overview">
                {/* ROW 1 — Welcome banner + Doctor profile */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 items-stretch">
                  {/* Welcome Banner */}
                  <div className={`lg:col-span-2 relative overflow-hidden rounded-[1.5rem] min-h-[260px] sm:min-h-[290px] md:min-h-[310px] text-white shadow-2xl ring-1 patient-welcome-shell bg-[#e8f3f8] dark:bg-slate-900 ${darkMode ? 'ring-white/20' : 'ring-black/[0.12]'}`}>
                    <img
                      src={patientWelcomeImg}
                      alt=""
                      width={960}
                      height={540}
                      loading="eager"
                      decoding="async"
                      fetchPriority="high"
                      draggable={false}
                      className="pointer-events-none absolute inset-0 h-full w-full object-contain object-right object-bottom [-webkit-transform:translateZ(0)] [transform:translateZ(0)] [image-rendering:auto]"
                      style={{ objectPosition: '92% 65%' }}
                    />
                    {darkMode && <div className="absolute inset-0 bg-black/18 pointer-events-none" aria-hidden />}
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/52 via-transparent to-transparent sm:from-black/46 md:bg-gradient-to-r md:from-[rgba(14,36,62,0.78)] md:via-black/[0.12] md:to-transparent dark:from-black/62 dark:via-transparent"
                      aria-hidden
                    />
                    <div className="absolute top-5 left-5 md:left-8 z-20 inline-flex items-center gap-2 rounded-xl border border-white/50 bg-slate-900/82 px-3.5 py-2 shadow-lg backdrop-blur-md">
                      <FaCalendarAlt className="text-white text-xs" />
                      <span className="text-xs font-semibold tracking-wide text-white">{dateStr} · {timeStr}</span>
                    </div>
                    <div className="relative z-10 px-5 py-9 pt-[4.25rem] sm:py-10 md:px-8 md:py-11 flex flex-col justify-center min-h-[inherit] max-w-xl">
                      <div>
                        <p className="text-white/95 text-xs font-bold uppercase tracking-[0.3em] mb-2 md:mb-3 drop-shadow-md [text-shadow:0_1px_4px_rgba(0,0,0,.5)]">
                          Overview
                        </p>
                        <h2 className="text-white text-3xl sm:text-4xl md:text-[2.65rem] font-extrabold mb-3 leading-[1.12] tracking-tight [text-shadow:0_2px_14px_rgba(0,0,0,.45)]">
                          Good Day, {dashboardData?.user?.name || 'Recovery Champion'}!
                        </h2>
                        <p className="text-white text-[15px] md:text-[1.065rem] leading-relaxed max-w-xl font-semibold opacity-[0.99] md:leading-snug">
                          Have a beautiful {dayName}. Keep showing up — your care team is here for every step forward.
                        </p>
                        <div className="mt-5 md:mt-6 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => setCurrentView('mood')}
                            className="inline-flex items-center gap-2.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-900 shadow-lg ring-2 ring-white/95 transition-colors hover:bg-blue-50/95"
                          >
                            <FaSmile className="text-lg text-blue-600" aria-hidden />
                            Log Today&apos;s Mood
                          </button>
                          <button
                            type="button"
                            onClick={() => setCurrentView('activity')}
                            className="inline-flex items-center gap-2 rounded-xl border-[2.5px] border-white/95 bg-black/42 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.65)] backdrop-blur-[2px] transition-colors hover:border-white hover:bg-black/52"
                          >
                            <FaDumbbell className="text-[15px] text-white opacity-95" aria-hidden />
                            Log activity
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* My Doctor card */}
                  <div className={`${card} relative p-4 md:p-5 flex flex-col`}>
                    <div className="mb-3">
                      <h3 className={`text-[10px] md:text-[11px] font-bold tracking-[0.28em] ${muted}`}>MY DOCTOR</h3>
                      <p className={`text-xl font-bold ${headline} mt-1 tracking-tight`}>Care Provider</p>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-5 flex-1">
                      <div className={`relative shrink-0 h-[108px] w-[108px] md:h-[118px] md:w-[118px] rounded-full overflow-hidden ring-[7px] ${darkMode ? 'ring-blue-500/35' : 'ring-blue-100'}`}>
                        <img
                          src={doctorAvatarSrc}
                          alt={doctor ? `Care provider, ${doctorName}` : 'Care provider'}
                          className="h-full w-full object-cover"
                          draggable={false}
                        />
                      </div>
                      <div className="flex-1 min-w-0 w-full text-center lg:text-left">
                        <div className="inline-flex lg:block rounded-full lg:rounded-xl px-2 py-0.5 lg:px-0 lg:py-0 mb-2">
                          <h4 className={`text-xl font-bold ${headline} truncate`}>{doctorName}</h4>
                        </div>
                        <p className={`text-[12px] font-bold tracking-[0.2em] uppercase ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{doctorSpec}</p>
                        <div className={`mt-3 flex flex-wrap gap-x-3 gap-y-2 justify-center text-sm lg:justify-start ${mutedSoft}`}>
                          <span className="inline-flex items-center gap-1.5 truncate max-w-[200px]" title={doctorLocation}>
                            <FaMapMarkerAlt className="shrink-0" aria-hidden />
                            <span className={`truncate ${headline}`}>{doctorLocation}</span>
                          </span>
                          {doctor && doctorPhone && doctorPhone !== '—' ? (
                            <span className="inline-flex items-center gap-1.5 truncate max-w-[180px]" title={doctorPhone}>
                              <FaPhone className="shrink-0 text-[11px] opacity-75" aria-hidden />
                              <span className={`truncate ${headline}`}>{doctorPhone}</span>
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className={`grid grid-cols-3 gap-2 mt-5 pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-gray-100'}`}>
                      <div>
                        <p className={`text-[10px] font-bold tracking-wider ${mutedSoft} mb-1`}>MEMBER</p>
                        <p className={`text-sm md:text-[15px] font-bold truncate ${headline}`}>{memberSince}</p>
                      </div>
                      <div className="min-w-0 flex flex-col">
                        <p className={`text-[10px] font-bold tracking-wider ${mutedSoft} mb-1`}>ASSIGNED GOALS</p>
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentView('goals');
                            setGoalsView('my-goals');
                          }}
                          title="Open My Goals"
                          className={`text-left w-full rounded-lg min-w-0 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500/60 ${darkMode ? 'focus-visible:ring-offset-slate-900' : 'focus-visible:ring-offset-white'}`}
                        >
                          {!doctor ? (
                            <p className={`text-xs font-semibold leading-snug ${mutedSoft}`}>
                              Assign a provider to receive goals from your doctor.
                            </p>
                          ) : assignedGoalPreview.length === 0 ? (
                            <p className={`text-xs font-semibold leading-snug ${mutedSoft}`}>No goals from this provider yet.</p>
                          ) : (
                            <ul className="space-y-1.5 min-w-0">
                              {assignedGoalLines.map((g) => (
                                <li key={g._id} className="min-w-0">
                                  <p className={`text-xs md:text-[13px] font-bold truncate ${headline}`} title={g.title}>
                                    {g.title}
                                  </p>
                                  <p className={`text-[10px] font-semibold uppercase tracking-wide mt-px ${mutedSoft}`}>
                                    {g.completed ? 'Completed' : `${Math.round(Number(g.progress) || 0)}% progress`}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          )}
                          {doctor && moreActiveGoalsHint > 0 ? (
                            <p className={`text-[10px] font-bold mt-1.5 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              +{moreActiveGoalsHint} more active · tap to view all
                            </p>
                          ) : doctor && assignedGoalPreview.length > 0 ? (
                            <p className={`text-[10px] mt-1.5 opacity-85 ${mutedSoft}`}>Tap to view all</p>
                          ) : null}
                        </button>
                      </div>
                      <div className="text-right md:text-center">
                        <p className={`text-[10px] font-bold tracking-wider ${mutedSoft} mb-1`}>PLAN DAYS</p>
                        <p className={`text-sm md:text-[15px] font-bold ${headline}`}>{streakDays}<span className={`ml-1 text-xs font-medium ${mutedSoft}`}>streak</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 2 — 3 metric cards + calendar */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
                    <button type="button" onClick={() => setCurrentView('mood')} className={`${card} text-left p-3 md:p-4 hover:shadow-lg transition-shadow`}>
                      <div className="flex flex-col h-full gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[10px] md:text-[11px] font-bold tracking-[0.22em] ${muted}`}>MOOD CHECK-INS</p>
                          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'}`}>
                            <FaSmile className="text-lg" />
                          </span>
                        </div>
                        <div className="flex-grow flex flex-col gap-3">
                          <div>
                            <p className={`text-4xl lg:text-[2.85rem] font-black leading-none mb-2 ${headline}`}>{moodScore || 0}</p>
                            <p className={`text-[13px] font-semibold mb-3 ${muted}`}>Today&apos;s score</p>
                            <Sparkline data={moodSeries} color={darkMode ? '#60a5fa' : '#3b82f6'} />
                            <div className="mt-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-green-500 bg-green-500/12 px-2 py-1 rounded-lg">
                              <FaArrowUp className="text-[10px]" />
                              +5% than average
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                    <button type="button" onClick={() => setCurrentView('activity')} className={`${card} text-left p-3 md:p-4 hover:shadow-lg transition-shadow`}>
                      <div className="flex flex-col h-full gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[10px] md:text-[11px] font-bold tracking-[0.22em] ${muted}`}>ACTIVITY LOGS</p>
                          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-emerald-500/18 text-emerald-300' : 'bg-green-50 text-green-600'}`}>
                            <FaDumbbell className="text-lg" />
                          </span>
                        </div>
                        <div>
                          <p className={`text-4xl lg:text-[2.85rem] font-black leading-none mb-2 ${headline}`}>{streakDays}</p>
                          <p className={`text-[13px] font-semibold mb-3 ${muted}`}>Day streak</p>
                          <Sparkline data={activitySeries} color={darkMode ? '#34d399' : '#10b981'} />
                          <div className={`mt-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-green-500 bg-green-500/12 px-2 py-1 rounded-lg`}>
                            <FaArrowUp className="text-[10px]" />
                            +12% this week
                          </div>
                        </div>
                      </div>
                    </button>
                    <button type="button" onClick={() => setCurrentView('goals')} className={`${card} text-left p-3 md:p-4 hover:shadow-lg transition-shadow`}>
                      <div className="flex flex-col h-full gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[10px] md:text-[11px] font-bold tracking-[0.22em] ${muted}`}>GOALS DONE</p>
                          <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-violet-500/22 text-violet-300' : 'bg-purple-50 text-purple-600'}`}>
                            <FaBullseye className="text-lg" />
                          </span>
                        </div>
                        <div>
                          <p className={`text-4xl lg:text-[2.85rem] font-black leading-none mb-2 ${headline}`}>{goalsCompleted}</p>
                          <p className={`text-[13px] font-semibold mb-3 ${muted}`}>Completed total</p>
                          <Sparkline data={goalsSeries} color={darkMode ? '#c4b5fd' : '#8b5cf6'} />
                          <div className="mt-auto inline-flex items-center gap-1.5 text-[11px] font-bold text-green-500 bg-green-500/12 px-2 py-1 rounded-lg">
                            <FaArrowUp className="text-[10px]" />
                            On track
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                  {/* Calendar */}
                  <div className={`${card} p-4 md:p-5 min-h-0`}>
                    <MiniCalendar dark={darkMode} />
                  </div>
                </div>

                {/* ROW 3 — Wellness + plans + agenda */}
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-12 xl:items-stretch">
                  <section className={`${card} flex min-h-0 flex-col p-4 md:p-5 xl:col-span-5`}>
                    <header
                      className={`mb-2.5 flex flex-wrap items-start justify-between gap-2 border-b pb-2.5 ${darkMode ? 'border-slate-700/90' : 'border-gray-100'}`}
                    >
                      <div className="min-w-0 pr-2">
                        <h3 className={`text-[10px] md:text-[11px] font-bold tracking-[0.28em] ${muted}`}>WELLNESS PROGRESS</h3>
                        <p className={`mt-0.5 text-base font-bold tracking-tight sm:text-[1.0625rem] md:text-lg ${headline}`}>
                          Weekly overview
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider md:px-3 md:py-1.5 md:text-[11px] ${
                          darkMode ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        Today
                      </span>
                    </header>
                    <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
                      <div className="flex shrink-0 justify-center lg:justify-start lg:pl-0.5 lg:pr-3">
                        <Donut
                          percent={wellnessPercent}
                          gradientStops={donutStops}
                          size={darkMode ? 228 : 214}
                          strokeWidth={darkMode ? 17 : 16}
                          label="WELLNESS"
                          trackColor={donutTrack}
                          innerClassName={darkMode ? 'text-white' : 'text-gray-900'}
                          labelClassName={`${darkMode ? 'text-slate-400' : 'text-gray-700'} !mt-1.5 md:!mt-2 !text-[10px]`}
                        />
                      </div>
                      <dl className="flex w-full flex-1 min-w-0 flex-col justify-center gap-2 md:gap-2 lg:gap-2.5">
                        {[
                          ['Mood check-ins', moodScore ?? 0, 'bg-blue-500'],
                          ['Streak days', streakDays, 'bg-emerald-500'],
                          ['Goals completed', goalsCompleted, 'bg-violet-500'],
                          ['Unread messages', messages, 'bg-amber-400'],
                        ].map(([labelText, val, dot]) => (
                          <div key={labelText} className="flex items-center gap-2 sm:gap-3 md:gap-3.5">
                            <span className={`h-3.5 w-3.5 sm:h-[15px] sm:w-[15px] shrink-0 rounded-full ${dot}`} aria-hidden />
                            <dt className={`min-w-0 flex-1 truncate text-sm font-semibold sm:text-[0.9375rem] md:text-base ${muted}`}>{labelText}</dt>
                            <dd className={`shrink-0 text-2xl font-black tabular-nums sm:text-3xl md:text-[2.125rem] lg:text-[2.375rem] ${headline}`}>
                              {val}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </section>

                  <section className={`${card} flex min-h-0 flex-col p-4 md:p-5 xl:col-span-4`}>
                    <header
                      className={`mb-3 flex flex-wrap items-start justify-between gap-2 border-b pb-3 ${darkMode ? 'border-slate-700/90' : 'border-gray-100'}`}
                    >
                      <div>
                        <h3 className={`text-[11px] font-bold tracking-[0.28em] ${muted}`}>MY PLANS DONE</h3>
                        <p className={`mt-1 text-xl font-black tracking-tight md:text-[1.9375rem] ${headline}`}>Recovery milestones</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide md:text-xs ${
                          darkMode ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        Today
                      </span>
                    </header>
                    <div className="flex flex-1 flex-col gap-3.5">
                      {[
                        { label: 'Daily goals', value: dailyGoalPct, gradient: 'from-blue-500 to-blue-700' },
                        { label: 'Weekly activity', value: weeklyActivityPct, gradient: 'from-fuchsia-500 to-purple-700' },
                        { label: 'Monthly streak', value: monthlyTrendPct, gradient: 'from-amber-400 to-orange-600' },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="mb-1.5 flex items-baseline justify-between gap-2">
                            <span className={`text-base font-bold md:text-lg ${darkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                              {row.label}
                            </span>
                            <span className={`text-2xl font-black tabular-nums md:text-3xl ${headline}`}>{row.value}%</span>
                          </div>
                          <div
                            className="h-4 w-full overflow-hidden rounded-full md:h-[18px]"
                            style={{ backgroundColor: darkMode ? 'rgba(51,65,85,0.88)' : 'rgb(229,231,235)' }}
                          >
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${row.gradient} transition-[width] duration-500`}
                              style={{ width: `${row.value}%` }}
                              role="presentation"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentView('goals')}
                      className={`mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border-[3px] border-dashed text-base font-semibold transition-colors ${
                        darkMode
                          ? 'border-slate-600 text-slate-300 hover:border-blue-500 hover:bg-slate-800 hover:text-blue-300'
                          : 'border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      <FaPlus className="text-sm" aria-hidden />
                      Add plan +
                    </button>
                  </section>

                  <section className={`${card} flex min-h-0 flex-col overflow-hidden xl:col-span-3 xl:overflow-visible p-4 md:p-5`}>
                    <header className={`mb-2 flex items-start justify-between gap-2`}>
                      <div>
                        <h3 className={`text-[10px] md:text-[11px] font-bold uppercase tracking-[0.35em] ${muted}`}>{dateStr.split(',')[0].toUpperCase()}</h3>
                        <p className={`mt-1 text-xl font-extrabold leading-tight md:text-2xl ${headline}`}>{dayName}&apos;s schedule</p>
                      </div>
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl md:h-12 md:w-12 ${
                          darkMode ? 'bg-blue-600/35 text-blue-200' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        <FaClock className="text-lg" aria-hidden />
                      </div>
                    </header>
                    <div className={`scrollbar-hide max-h-[min(260px,45vh)] flex-1 overflow-y-auto xl:max-h-none pr-1 divide-y divide-dashed ${darkMode ? 'divide-slate-600' : 'divide-gray-200'}`}>
                      {todaysPlan.map((item, idx) => (
                        <button
                          key={`${item.label}-${idx}`}
                          type="button"
                          onClick={() => setCurrentView(item.view)}
                          className={`flex w-full gap-3 py-2.5 text-left transition-colors first:pt-0 last:pb-0 md:gap-3 ${
                            darkMode ? 'hover:bg-white/8' : 'hover:bg-slate-50/90'
                          }`}
                        >
                          <span className={`mt-1 h-[14px] w-[14px] shrink-0 rounded-full ${item.color}`} aria-hidden />
                          <div className="min-w-0 flex-1">
                            <p className={`text-lg font-bold md:text-xl ${darkMode ? 'text-slate-100' : 'text-gray-900'}`}>{item.label}</p>
                            <p className={`mt-0.5 text-sm leading-snug md:text-base ${muted}`}>{item.detail}</p>
                          </div>
                          <span
                            className={`shrink-0 self-start whitespace-nowrap text-[11px] font-bold md:text-[12px] ${
                              darkMode ? 'text-slate-500' : 'text-gray-400'
                            }`}
                          >
                            {item.time}
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            );
          })()}

          {currentView === 'messages' && <Messages onBack={handleBackToDashboard} supervisorProp={dashboardData?.user?.assignedSupervisor} />}
          {currentView === 'mood' && <MoodLoggingScreen onBack={handleBackToDashboard} userId={dashboardData?.user?._id} />}
          {currentView === 'trigger' && <TriggerLoggingScreen onBack={handleBackToDashboard} userId={dashboardData?.user?._id} />}
          {currentView === 'activity' && <ActivityLoggingScreen onBack={handleBackToDashboard} userId={dashboardData?.user?._id} />}
          {currentView === 'relapse' && <RelapseLoggingScreen onBack={handleBackToDashboard} userId={dashboardData?.user?._id} />}
          {currentView === 'appointments' && <AppointmentsScreen onBack={handleBackToDashboard} />}
          {currentView === 'games' && <GameDashboard />}
          {currentView === 'goals' && <Goals currentView={goalsView} userId={dashboardData?.user?._id} onBack={handleBackToDashboard} />}
          {currentView === 'learning' && <LearningLibrary onViewChange={setLearningView} currentView={learningView} />}
          {currentView === 'leaderboard' && <Leaderboard />}
          {currentView === 'badges' && <div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="text-xl font-bold text-gray-800 mb-4">Achievement Badges</h3><p className="text-gray-600">Badge collection feature coming soon!</p></div>}
          {currentView === 'certificates' && <div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="text-xl font-bold text-gray-800 mb-4">Certificates</h3><p className="text-gray-600">Certificate download feature coming soon!</p></div>}
          {currentView === 'ai-mood-scan' && <AIMoodScanScreen onBack={handleBackToDashboard} userId={dashboardData?.user?._id} />}
          {currentView === 'events' && <EventsCalendar />}
        </section>
      </main>

      {/* AI Mood Prompt Modal */}
      {showAIMoodPrompt && (
        <AIMoodPromptModal
          reasons={aiMoodPromptReasons}
          patientId={dashboardData?.user?._id}
          onAccept={() => { setShowAIMoodPrompt(false); setCurrentView('ai-mood-scan'); }}
          onDecline={() => setShowAIMoodPrompt(false)}
          onDismiss={() => setShowAIMoodPrompt(false)}
        />
      )}

      {/* Floating Action Buttons */}
      <FloatingChat
        isOpen={activeDialog === 'chat'}
        onToggle={() => setActiveDialog(activeDialog === 'chat' ? null : 'chat')}
      />
      <CrisisButton
        isOpen={activeDialog === 'crisis'}
        onToggle={() => setActiveDialog(activeDialog === 'crisis' ? null : 'crisis')}
        userId={dashboardData?.user?._id}
      />
    </div>
  );
}
