import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaUser, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import api from '../../api';
import socketService from '../../services/socketService';
import './AdminComponents.css';

const ViewGeoFenceAlerts = ({ syncRef, onLastUpdatedChange, onRefreshingChange } = {}) => {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchAlerts();
    
    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(fetchAlerts, 30000);

    // Listen for real-time geo-fence alerts
    socketService.on('geofence:alert', (data) => {
      console.log('New geo-fence alert received:', data);
      const newAlert = formatAlert(data);
      setAlerts(prev => [newAlert, ...prev].slice(0, 50));
      setLastUpdated(new Date());
    });

    // Listen for stats updates which may include new alerts
    socketService.on('stats:updated', () => {
      fetchAlerts();
    });

    // Listen for geofence zone changes
    socketService.on('geofence:created', () => {
      fetchAlerts();
    });

    socketService.on('geofence:updated', () => {
      fetchAlerts();
    });

    return () => {
      clearInterval(refreshInterval);
      socketService.off('geofence:alert');
      socketService.off('stats:updated');
      socketService.off('geofence:created');
      socketService.off('geofence:updated');
    };
  }, []);

  // Wire refresh to parent header (Refresh button + Last Updated indicator)
  useEffect(() => {
    if (syncRef) syncRef.current = fetchAlerts;
    return () => { if (syncRef) syncRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRef]);

  useEffect(() => { onLastUpdatedChange?.(lastUpdated); }, [lastUpdated, onLastUpdatedChange]);
  useEffect(() => { onRefreshingChange?.(loading); }, [loading, onRefreshingChange]);

  const formatAlert = (alert) => ({
    id: alert._id || alert.id || Date.now(),
    patient: alert.patientName || alert.patient?.name || 'Unknown Patient',
    zone: alert.zoneName || alert.geoFence?.name || alert.zone || 'Unknown Zone',
    alertType: alert.eventType === 'entered' ? 'Enter' : alert.eventType === 'exited' ? 'Exit' : alert.alertType || 'Alert',
    severity: alert.alertSeverity || alert.severity || 'Moderate',
    time: alert.createdAt || alert.timestamp || new Date().toISOString(),
    coordinates: alert.location?.coordinates ? 
      `${alert.location.coordinates[1]?.toFixed(4)},${alert.location.coordinates[0]?.toFixed(4)}` : 
      alert.coordinates || 'N/A',
    notifiedSupervisor: alert.notifiedSupervisor || alert.alertSent || false,
    supervisor: alert.supervisorName || alert.supervisor?.name || null,
    riskScore: alert.riskScore || 50
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Use api module instead of direct fetch
      const response = await api.get('/geofence/alerts?limit=50');
      
      if (response.data && response.data.success && response.data.data) {
        const formattedAlerts = response.data.data.map(formatAlert);
        setAlerts(formattedAlerts);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Try alternative endpoint
      try {
        const altResponse = await api.get('/admin/alerts?limit=50');
        if (altResponse.data && altResponse.data.success && altResponse.data.data) {
          const formattedAlerts = altResponse.data.data.map(formatAlert);
          setAlerts(formattedAlerts);
          setLastUpdated(new Date());
        }
      } catch (altError) {
        console.error('Error fetching from alternative endpoint:', altError);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getAlertTypeColor = (type) => {
    return type === 'Enter' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading alerts...</span>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <FaExclamationTriangle className="text-5xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Alerts Found</h3>
          <p className="text-gray-500">No geo-fence alerts have been recorded yet.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Table */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Recent Alerts</h3>
              <span className="text-sm text-gray-500">{alerts.length} alerts</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alert Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GPS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {alerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{alert.patient}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{alert.zone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAlertTypeColor(alert.alertType)}`}>
                          {alert.alertType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500" title={new Date(alert.time).toLocaleString()}>
                          {formatTimeAgo(alert.time)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 font-mono">{alert.coordinates}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {alert.notifiedSupervisor ? (
                            <span className="text-green-600">✓ {alert.supervisor}</span>
                          ) : (
                            <span className="text-red-600">✗ Not notified</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alert Details Panel */}
        <div className="lg:col-span-1">
          {selectedAlert ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Alert Details</h3>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <FaUser className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedAlert.patient}</div>
                    <div className="text-xs text-gray-500">Patient</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedAlert.zone}</div>
                    <div className="text-xs text-gray-500">Zone</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FaExclamationTriangle className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{selectedAlert.alertType} Zone</div>
                    <div className="text-xs text-gray-500">Alert Type</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FaClock className="text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{new Date(selectedAlert.time).toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Time</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Risk Score</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedAlert.riskScore > 80 ? 'bg-red-100 text-red-800' :
                      selectedAlert.riskScore > 60 ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedAlert.riskScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        selectedAlert.riskScore > 80 ? 'bg-red-500' :
                        selectedAlert.riskScore > 60 ? 'bg-orange-500' :
                        'bg-yellow-500'
                      }`}
                      style={{ width: `${selectedAlert.riskScore}%` }}
                    ></div>
                  </div>
                </div>

                {selectedAlert.supervisor && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-600">
                      <strong>Supervisor:</strong> {selectedAlert.supervisor}
                    </div>
                  </div>
                )}
              </div>

              {/* Map Preview */}
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Location</h4>
                <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <FaMapMarkerAlt className="text-2xl mx-auto mb-1" />
                    <p className="text-xs">Alert location</p>
                    <p className="text-xs font-mono">{selectedAlert.coordinates}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <FaExclamationTriangle className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Select an alert to view details</p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default ViewGeoFenceAlerts;