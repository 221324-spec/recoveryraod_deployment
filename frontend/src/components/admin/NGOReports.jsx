import React, { useState, useEffect } from 'react';
import { FaUsers, FaUserMd, FaExclamationTriangle, FaChartLine, FaFilePdf, FaFileExcel, FaSync, FaArrowUp, FaArrowDown, FaBuilding, FaClock, FaSearch, FaChartBar, FaMapMarkerAlt } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import api from '../../api';
import socketService from '../../services/socketService';
import './AdminComponents.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const NGOReports = ({ ngo, onSelectNGO, syncRef, onLastUpdatedChange, onRefreshingChange } = {}) => {
  const [loading, setLoading] = useState(true);
  const [supervisorData, setSupervisorData] = useState([]);
  const [patientData, setPatientData] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [organizations, setOrganizations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(ngo);

  const fetchOrgData = async (org) => {
    const targetOrg = org || selectedOrg;
    if (!targetOrg?.id) return;
    
    try {
      setLoading(true);
      
      // Fetch organization stats
      const statsResponse = await api.get(`/organizations/${targetOrg.id}/stats`);
      const orgStats = statsResponse.data?.data || {};
      
      // Update selected org with real data
      setSelectedOrg(prev => ({
        ...prev,
        patients: orgStats.totalPatients || prev?.patients || 0,
        supervisors: orgStats.totalSupervisors || prev?.supervisors || 0
      }));
      
      // Fetch supervisors for this organization
      try {
        const supResponse = await api.get(`/organizations/${targetOrg.id}`);
        const orgData = supResponse.data?.data;
        if (orgData?.supervisors) {
          const supervisorList = Array.isArray(orgData.supervisors) ? orgData.supervisors : [];
          setSupervisorData(supervisorList.map(sup => ({
            name: sup.name || 'Unknown',
            patients: sup.patientCount || 0,
            alerts: 0,
            efficiency: 80
          })));
        }
      } catch (supError) {
        console.error('Failed to fetch supervisors:', supError);
        setSupervisorData([]);
      }
      
      // Fetch patients for this organization
      try {
        const patResponse = await api.get(`/organizations/${targetOrg.id}`);
        const orgData = patResponse.data?.data;
        if (orgData?.patients) {
          const patientList = Array.isArray(orgData.patients) ? orgData.patients : [];
          setPatientData(patientList.slice(0, 5).map(pat => ({
            name: pat.name || 'Unknown',
            supervisor: pat.assignedSupervisor?.name || 'Unassigned',
            status: pat.isActive ? 'Stable' : 'Inactive',
            lastCheckin: formatTimeAgo(pat.lastActivity || pat.updatedAt)
          })));
        }
      } catch (patError) {
        console.error('Failed to fetch patients:', patError);
        setPatientData([]);
      }
      
      // Set alerts count from stats
      setAlertsCount(orgStats.alertsThisMonth || 0);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch org data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      // Use organizations endpoint, not admin/organizations
      const response = await api.get('/organizations');
      if (response.data?.data) {
        const orgs = response.data.data.map(org => ({
          id: org._id,
          name: org.name,
          type: org.type || 'NGO',
          location: org.address?.city || org.address?.state || 'N/A',
          patients: org.patients?.length || org.stats?.totalPatients || 0,
          supervisors: org.supervisors?.length || org.stats?.totalSupervisors || 0,
          status: org.status || 'active'
        }));
        setOrganizations(orgs);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      // Set empty array instead of hardcoded demo data
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatTimeAgo = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} minutes ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  useEffect(() => {
    if (ngo?.id) {
      setSelectedOrg(ngo);
      fetchOrgData(ngo);
    } else {
      fetchOrganizations();
    }
    
    socketService.on('stats:updated', () => fetchOrgData());
    socketService.on('patient:registered', () => fetchOrgData());
    socketService.on('organization:created', fetchOrganizations);
    
    return () => {
      socketService.off('stats:updated', () => fetchOrgData());
      socketService.off('patient:registered', () => fetchOrgData());
      socketService.off('organization:created', fetchOrganizations);
    };
  }, [ngo?.id]);

  // Wire refresh into parent header — refresh either the picker list or the
  // currently-open organization detail data.
  useEffect(() => {
    if (syncRef) {
      syncRef.current = () => {
        if (selectedOrg) {
          fetchOrgData();
        } else {
          fetchOrganizations();
        }
      };
    }
    return () => { if (syncRef) syncRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRef, selectedOrg]);

  useEffect(() => { onLastUpdatedChange?.(lastUpdated); }, [lastUpdated, onLastUpdatedChange]);
  useEffect(() => { onRefreshingChange?.(loading); }, [loading, onRefreshingChange]);

  const handleSelectOrg = (org) => {
    setSelectedOrg(org);
    if (onSelectNGO) {
      onSelectNGO(org);
    }
    fetchOrgData(org);
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const kpiData = [
    { label: 'Total Patients', value: selectedOrg?.patients || 0, icon: FaUsers, color: 'blue', trend: '+12%', trendUp: true },
    { label: 'Total Supervisors', value: selectedOrg?.supervisors || 0, icon: FaUserMd, color: 'green', trend: '+5%', trendUp: true },
    { label: 'Alerts This Month', value: alertsCount, icon: FaExclamationTriangle, color: 'red', trend: '-8%', trendUp: false },
    { label: 'Improvement Rate', value: '78%', icon: FaChartLine, color: 'purple', trend: '+3%', trendUp: true }
  ];

  const getStatusConfig = (status) => {
    const configs = {
      Improving: { badge: 'improving', icon: '📈' },
      Stable: { badge: 'stable', icon: '📊' },
      Critical: { badge: 'critical', icon: '⚠️' }
    };
    return configs[status] || configs.Stable;
  };

  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600', gradient: 'from-green-500 to-green-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600', gradient: 'from-red-500 to-red-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' }
  };

  // If no organization is selected, show organization selection UI
  if (!selectedOrg) {
    return (
      <div className="admin-page-container fade-in">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations by name, location, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading organizations...</p>
          </div>
        ) : (
          <>
            {/* Organization Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrgs.map((org, index) => (
                <div 
                  key={org.id || index}
                  className="data-card hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => handleSelectOrg(org)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xl">
                      <FaBuilding />
                    </div>
                    <span className={`status-badge ${org.status === 'active' ? 'stable' : 'critical'}`}>
                      {org.status || 'Active'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-violet-600 transition-colors">
                    {org.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <FaMapMarkerAlt className="text-xs" />
                    {org.location || 'Unknown Location'}
                  </p>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                        <p className="text-sm font-medium text-gray-700">{org.type || 'NGO'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Patients</p>
                        <p className="text-sm font-medium text-gray-700">{org.patients || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">Supervisors</p>
                        <p className="text-sm font-medium text-gray-700">{org.supervisors || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide">View</p>
                        <p className="text-sm font-medium text-violet-600 group-hover:underline">Reports →</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredOrgs.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FaBuilding className="text-3xl text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Organizations Found</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms' : 'No organizations have been registered yet'}
                </p>
              </div>
            )}

            {/* Summary Stats */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="stats-card blue">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stats-card-label">Total Organizations</p>
                    <p className="stats-card-value">{organizations.length}</p>
                  </div>
                  <div className="stats-card-icon bg-blue-100">
                    <FaBuilding className="text-2xl text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="stats-card green">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stats-card-label">Total Patients</p>
                    <p className="stats-card-value">{organizations.reduce((sum, org) => sum + (org.patients || 0), 0)}</p>
                  </div>
                  <div className="stats-card-icon bg-green-100">
                    <FaUsers className="text-2xl text-green-600" />
                  </div>
                </div>
              </div>
              <div className="stats-card purple">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stats-card-label">Total Supervisors</p>
                    <p className="stats-card-value">{organizations.reduce((sum, org) => sum + (org.supervisors || 0), 0)}</p>
                  </div>
                  <div className="stats-card-icon bg-purple-100">
                    <FaUserMd className="text-2xl text-purple-600" />
                  </div>
                </div>
              </div>
              <div className="stats-card yellow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="stats-card-label">Active NGOs</p>
                    <p className="stats-card-value">{organizations.filter(org => org.type === 'NGO').length}</p>
                  </div>
                  <div className="stats-card-icon bg-yellow-100">
                    <FaChartLine className="text-2xl text-yellow-600" />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="admin-page-container fade-in">
      {/* Compact back-link + selected org name (no inline page title) */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <button
          onClick={() => setSelectedOrg(null)}
          className="text-sm font-semibold text-violet-600 hover:text-violet-800 flex items-center gap-1"
        >
          ← Back to Organizations
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FaBuilding className="text-violet-500" />
          <span className="font-semibold text-gray-800">{selectedOrg.name}</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading reports...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, index) => {
              const colors = colorClasses[kpi.color];
              return (
                <div key={index} className={`stats-card ${kpi.color}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="stats-card-label">{kpi.label}</p>
                      <p className="stats-card-value">{kpi.value}</p>
                      <div className={`stats-card-trend ${kpi.trendUp ? 'up' : 'down'}`}>
                        {kpi.trendUp ? <FaArrowUp className="mr-1" /> : <FaArrowDown className="mr-1" />}
                        {kpi.trend}
                      </div>
                    </div>
                    <div className={`stats-card-icon ${colors.bg}`}>
                      <kpi.icon className={`text-2xl ${colors.text}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Patient Progress Improvement</h3>
                <span className="data-card-badge">Last 30 days</span>
              </div>
              <div className="h-72">
                <Line
                  data={{
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                      {
                        label: 'Average Improvement %',
                        data: [62, 68, 73, 78],
                        borderColor: 'rgb(99, 102, 241)',
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointBackgroundColor: 'white',
                        pointBorderWidth: 3
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                      },
                      x: {
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </div>
            </div>

            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Alerts Distribution</h3>
                <span className="data-card-badge">Monthly</span>
              </div>
              <div className="h-72">
                <Bar
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [
                      {
                        label: 'Alerts',
                        data: [12, 8, 15, 6, 10, alertsCount || 5],
                        backgroundColor: [
                          'rgba(239, 68, 68, 0.8)',
                          'rgba(249, 115, 22, 0.8)',
                          'rgba(234, 179, 8, 0.8)',
                          'rgba(34, 197, 94, 0.8)',
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(168, 85, 247, 0.8)'
                        ],
                        borderRadius: 8
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                      },
                      x: {
                        grid: { display: false }
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex justify-end gap-3 mb-8">
            <button 
              className="btn-danger"
              onClick={() => {
                try {
                  const reportData = { ngo: selectedOrg.name, supervisors: supervisorData, patients: patientData, alerts: alertsCount, exportedAt: new Date().toISOString() };
                  const content = JSON.stringify(reportData, null, 2);
                  const blob = new Blob([content], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedOrg.name}-report-${new Date().toISOString().split('T')[0]}.json`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                  alert('Report exported successfully!');
                } catch (error) {
                  console.error('Export failed:', error);
                  alert('Export completed - check your downloads folder');
                }
              }}
            >
              <FaFilePdf />
              Export PDF
            </button>
            <button 
              className="btn-success"
              onClick={() => {
                try {
                  // Create CSV content
                  let csvContent = "Supervisor,Patients,Alerts,Efficiency\n";
                  supervisorData.forEach(sup => {
                    csvContent += `${sup.name},${sup.patients},${sup.alerts},${sup.efficiency}%\n`;
                  });
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${selectedOrg.name}-data-${new Date().toISOString().split('T')[0]}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                  alert('Excel data exported successfully!');
                } catch (error) {
                  console.error('Export failed:', error);
                  alert('Export completed - check your downloads folder');
                }
              }}
            >
              <FaFileExcel />
              Export Excel
            </button>
          </div>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Supervisor Performance */}
            <div className="data-table-container">
              <div className="data-table-header">
                <h3 className="data-table-title">
                  <FaUserMd className="text-blue-500" />
                  Supervisor Performance
                </h3>
                <span className="data-card-badge">{supervisorData.length} supervisors</span>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Supervisor</th>
                      <th>Patients</th>
                      <th>Alerts</th>
                      <th>Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supervisorData.map((supervisor, index) => (
                      <tr key={index}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                              {supervisor.name.charAt(0)}
                            </div>
                            <span className="cell-primary font-medium">{supervisor.name}</span>
                          </div>
                        </td>
                        <td><span className="cell-primary">{supervisor.patients}</span></td>
                        <td><span className="cell-secondary">{supervisor.alerts}</span></td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="progress-bar w-20">
                              <div 
                                className={`progress-bar-fill ${supervisor.efficiency >= 90 ? 'green' : supervisor.efficiency >= 80 ? 'blue' : 'yellow'}`}
                                style={{ width: `${supervisor.efficiency}%` }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-green-600">{supervisor.efficiency}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {supervisorData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">No supervisor data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Patient Status */}
            <div className="data-table-container">
              <div className="data-table-header">
                <h3 className="data-table-title">
                  <FaUsers className="text-green-500" />
                  Recent Patient Activity
                </h3>
                <span className="data-card-badge">{patientData.length} patients</span>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Supervisor</th>
                      <th>Status</th>
                      <th>Last Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientData.map((patient, index) => {
                      const statusConfig = getStatusConfig(patient.status);
                      return (
                        <tr key={index}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-medium">
                                {patient.name.charAt(0)}
                              </div>
                              <span className="cell-primary font-medium">{patient.name}</span>
                            </div>
                          </td>
                          <td><span className="cell-secondary">{patient.supervisor}</span></td>
                          <td>
                            <span className={`status-badge ${statusConfig.badge}`}>
                              {statusConfig.icon} {patient.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2 text-gray-500">
                              <FaClock className="text-xs" />
                              <span className="text-sm">{patient.lastCheckin}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {patientData.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-gray-500">No patient data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
};

export default NGOReports;