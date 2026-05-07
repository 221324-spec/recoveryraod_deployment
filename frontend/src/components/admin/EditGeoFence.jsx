import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaMapMarkerAlt, FaEye, FaCheckCircle, FaSearch } from 'react-icons/fa';
import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api';
import socketService from '../../services/socketService';
import './AdminComponents.css';

// Fix for default marker icons in Leaflet — guard against double-init crash
try {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
} catch (e) {
  // Already patched — safe to ignore
}

// Custom marker icon
const createCustomIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = createCustomIcon('red');
const orangeIcon = createCustomIcon('orange');
const yellowIcon = createCustomIcon('gold');
const greenIcon = createCustomIcon('green');

const EditGeoFence = ({ syncRef, onLastUpdatedChange, onRefreshingChange } = {}) => {
  const [zones, setZones] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchGeoFences = async () => {
    try {
      setLoading(true);
      const response = await api.get('/geofence');
      if (response.data && response.data.data) {
        const zonesData = response.data.data.map(zone => ({
          id: zone._id,
          name: zone.name,
          severity: zone.severity || zone.riskCategory || 'Medium',
          createdBy: zone.createdBy?.name || 'Admin',
          createdOn: new Date(zone.createdAt).toLocaleDateString(),
          coordinates: zone.center ? `${zone.center.lat?.toFixed(4) || 0},${zone.center.lng?.toFixed(4) || 0}` : 'N/A',
          radius: zone.radius || 0,
          isActive: zone.isActive !== false,
          description: zone.description || ''
        }));
        setZones(zonesData);
        setFilteredZones(zonesData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch geo-fences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeoFences();

    socketService.on('geofence:created', fetchGeoFences);
    socketService.on('geofence:updated', fetchGeoFences);
    socketService.on('geofence:deleted', fetchGeoFences);

    return () => {
      socketService.off('geofence:created', fetchGeoFences);
      socketService.off('geofence:updated', fetchGeoFences);
      socketService.off('geofence:deleted', fetchGeoFences);
    };
  }, []);

  // Wire refresh to parent header
  useEffect(() => {
    if (syncRef) syncRef.current = fetchGeoFences;
    return () => { if (syncRef) syncRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRef]);

  useEffect(() => { onLastUpdatedChange?.(lastUpdated); }, [lastUpdated, onLastUpdatedChange]);
  useEffect(() => { onRefreshingChange?.(loading); }, [loading, onRefreshingChange]);

  useEffect(() => {
    let filtered = zones;
    if (searchQuery) {
      filtered = filtered.filter(z => 
        z.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterSeverity !== 'all') {
      filtered = filtered.filter(z => z.severity === filterSeverity);
    }
    setFilteredZones(filtered);
  }, [searchQuery, filterSeverity, zones]);

  const getSeverityConfig = (severity) => {
    const configs = {
      Critical: { badge: 'critical', icon: '🔴', color: 'text-red-600', bg: 'bg-red-100', mapColor: '#ef4444', markerIcon: redIcon },
      High: { badge: 'high', icon: '🟠', color: 'text-orange-600', bg: 'bg-orange-100', mapColor: '#f97316', markerIcon: orangeIcon },
      Medium: { badge: 'medium', icon: '🟡', color: 'text-yellow-600', bg: 'bg-yellow-100', mapColor: '#eab308', markerIcon: yellowIcon },
      Low: { badge: 'low', icon: '🟢', color: 'text-green-600', bg: 'bg-green-100', mapColor: '#22c55e', markerIcon: greenIcon }
    };
    return configs[severity] || configs.Medium;
  };

  const handleEdit = (zone) => {
    setSelectedZone({...zone});
    setEditMode(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedZone) return;
    
    try {
      setSaving(true);
      await api.put(`/geofence/${selectedZone.id}`, {
        name: selectedZone.name,
        severity: selectedZone.severity,
        description: selectedZone.description
      });
      setEditMode(false);
      setSuccessMessage('Zone updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchGeoFences();
    } catch (error) {
      console.error('Failed to save zone:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (zoneId) => {
    if (window.confirm('Are you sure you want to delete this zone? This action cannot be undone.')) {
      try {
        await api.delete(`/geofence/${zoneId}`);
        if (selectedZone?.id === zoneId) {
          setSelectedZone(null);
          setEditMode(false);
        }
        setSuccessMessage('Zone deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchGeoFences();
      } catch (error) {
        console.error('Failed to delete zone:', error);
        alert('Failed to delete zone');
      }
    }
  };

  const severityCounts = {
    Critical: zones.filter(z => z.severity === 'Critical').length,
    High: zones.filter(z => z.severity === 'High').length,
    Medium: zones.filter(z => z.severity === 'Medium').length,
    Low: zones.filter(z => z.severity === 'Low').length
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 fade-in">
          <FaCheckCircle className="text-green-500 text-xl" />
          <span className="text-green-700 font-medium">{successMessage}</span>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(severityCounts).map(([severity, count]) => {
          const config = getSeverityConfig(severity);
          return (
            <div 
              key={severity}
              onClick={() => setFilterSeverity(filterSeverity === severity ? 'all' : severity)}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                filterSeverity === severity ? `${config.bg} ring-2 ring-offset-2` : 'bg-white border border-gray-100'
              } hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{config.icon}</span>
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{severity} Zones</p>
            </div>
          );
        })}
      </div>

      {/* Search and Filter */}
      <div className="filters-panel">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search zones by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-11"
              />
            </div>
          </div>
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="form-select"
            >
              <option value="all">All Severities</option>
              <option value="Critical">🔴 Critical</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Showing {filteredZones.length} of {zones.length} zones • Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading zones...</p>
        </div>
      ) : zones.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaMapMarkerAlt />
          </div>
          <h3 className="empty-state-title">No Geo-Fence Zones</h3>
          <p className="empty-state-description">Create your first high-risk zone to start monitoring patient locations.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Zones Table */}
          <div className="lg:col-span-2">
            <div className="data-table-container">
              <div className="data-table-header">
                <h3 className="data-table-title">
                  <FaMapMarkerAlt className="text-blue-500" />
                  All Zones
                </h3>
                <span className="data-card-badge">{filteredZones.length} zones</span>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Zone Name</th>
                      <th>Severity</th>
                      <th>Created By</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredZones.map((zone) => {
                      const config = getSeverityConfig(zone.severity);
                      return (
                        <tr 
                          key={zone.id} 
                          className={selectedZone?.id === zone.id ? 'bg-blue-50' : ''}
                        >
                          <td>
                            <div className="cell-primary font-semibold">{zone.name}</div>
                          </td>
                          <td>
                            <span className={`status-badge ${config.badge}`}>
                              {config.icon} {zone.severity}
                            </span>
                          </td>
                          <td>
                            <div className="cell-secondary">{zone.createdBy}</div>
                          </td>
                          <td>
                            <div className="cell-secondary">{zone.createdOn}</div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedZone(zone)}
                                className="btn-icon blue"
                                title="View Details"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleEdit(zone)}
                                className="btn-icon purple"
                                title="Edit Zone"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(zone.id)}
                                className="btn-icon red"
                                title="Delete Zone"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Zone Details Panel */}
          <div className="lg:col-span-1">
            {selectedZone ? (
              <div className="detail-panel slide-in">
                <div className="detail-panel-header">
                  <h3 className="detail-panel-title">Zone Details</h3>
                  {editMode ? (
                    <button
                      onClick={() => setEditMode(false)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEdit(selectedZone)}
                      className="btn-icon blue"
                    >
                      <FaEdit />
                    </button>
                  )}
                </div>
                <div className="detail-panel-body">
                  <div className="space-y-4">
                    <div className="form-group mb-0">
                      <label className="form-label text-xs">Zone Name</label>
                      {editMode ? (
                        <input
                          type="text"
                          value={selectedZone.name}
                          onChange={(e) => setSelectedZone({...selectedZone, name: e.target.value})}
                          className="form-input"
                        />
                      ) : (
                        <div className="text-sm font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">
                          {selectedZone.name}
                        </div>
                      )}
                    </div>

                    <div className="form-group mb-0">
                      <label className="form-label text-xs">Severity Level</label>
                      {editMode ? (
                        <select
                          value={selectedZone.severity}
                          onChange={(e) => setSelectedZone({...selectedZone, severity: e.target.value})}
                          className="form-select"
                        >
                          <option value="Critical">🔴 Critical</option>
                          <option value="High">🟠 High</option>
                          <option value="Medium">🟡 Medium</option>
                          <option value="Low">🟢 Low</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${getSeverityConfig(selectedZone.severity).badge}`}>
                          {getSeverityConfig(selectedZone.severity).icon} {selectedZone.severity}
                        </span>
                      )}
                    </div>

                    <div className="detail-item">
                      <div className="detail-item-icon">
                        <FaMapMarkerAlt />
                      </div>
                      <div className="detail-item-content">
                        <div className="detail-item-label">Coordinates</div>
                        <div className="detail-item-value font-mono text-xs">{selectedZone.coordinates}</div>
                      </div>
                    </div>

                    {selectedZone.radius > 0 && (
                      <div className="detail-item">
                        <div className="detail-item-icon">⭕</div>
                        <div className="detail-item-content">
                          <div className="detail-item-label">Radius</div>
                          <div className="detail-item-value">{selectedZone.radius}m</div>
                        </div>
                      </div>
                    )}

                    {/* Mini Map Preview */}
                    <div className="mt-4">
                      <label className="form-label text-xs">Zone Preview</label>
                      <div className="h-40 rounded-xl overflow-hidden border border-gray-200">
                        {selectedZone.coordinates && selectedZone.coordinates !== 'N/A' ? (
                          <MapContainer
                            center={selectedZone.coordinates.split(',').map(Number)}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                            scrollWheelZoom={false}
                            zoomControl={false}
                            dragging={false}
                          >
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker 
                              position={selectedZone.coordinates.split(',').map(Number)}
                              icon={getSeverityConfig(selectedZone.severity).markerIcon}
                            />
                            {selectedZone.radius > 0 && (
                              <Circle
                                center={selectedZone.coordinates.split(',').map(Number)}
                                radius={selectedZone.radius}
                                pathOptions={{
                                  color: getSeverityConfig(selectedZone.severity).mapColor,
                                  fillColor: getSeverityConfig(selectedZone.severity).mapColor,
                                  fillOpacity: 0.3
                                }}
                              />
                            )}
                          </MapContainer>
                        ) : (
                          <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                            <div className="text-center">
                              <FaMapMarkerAlt className={`text-2xl mx-auto mb-1 ${getSeverityConfig(selectedZone.severity).color}`} />
                              <p className="text-xs text-gray-500">No coordinates available</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {editMode && (
                      <button 
                        onClick={handleSaveChanges}
                        disabled={saving}
                        className="btn-success w-full mt-4"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state h-96">
                <div className="empty-state-icon">
                  <FaEye />
                </div>
                <h3 className="empty-state-title">Select a Zone</h3>
                <p className="empty-state-description">Click on a zone to view its details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EditGeoFence;