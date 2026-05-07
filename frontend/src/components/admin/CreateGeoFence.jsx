import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaDrawPolygon, FaCircle, FaUndo, FaTrash, FaSave, FaMapMarkerAlt, FaExclamationTriangle, FaCheckCircle, FaInfoCircle, FaSearchPlus, FaSearchMinus, FaCrosshairs } from 'react-icons/fa';
import { MapContainer, TileLayer, Polygon, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../api';
import './AdminComponents.css';
import socketService from '../../services/socketService';

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

// Custom marker icons for different purposes
const createCustomIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const redIcon = createCustomIcon('red');
const blueIcon = createCustomIcon('blue');
const greenIcon = createCustomIcon('green');

// Map click handler component
const MapClickHandler = ({ onMapClick, drawingMode }) => {
  useMapEvents({
    click: (e) => {
      if (drawingMode) {
        onMapClick(e.latlng);
      }
    },
  });
  return null;
};

// Map controls component
const MapControls = ({ onLocate }) => {
  const map = useMap();
  
  return (
    <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="Zoom In"
      >
        <FaSearchPlus className="text-gray-600" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="Zoom Out"
      >
        <FaSearchMinus className="text-gray-600" />
      </button>
      <button
        onClick={onLocate}
        className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="My Location"
      >
        <FaCrosshairs className="text-gray-600" />
      </button>
    </div>
  );
};

const CreateGeoFence = () => {
  const [zoneName, setZoneName] = useState('');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [drawingMode, setDrawingMode] = useState(null);
  const [polygonPoints, setPolygonPoints] = useState([]);
  const [circleCenter, setCircleCenter] = useState(null);
  const [radius, setRadius] = useState(500);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [totalZones, setTotalZones] = useState(0);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // NYC default
  const mapRef = useRef(null);

  useEffect(() => {
    // Fetch existing zones count
    const fetchZonesCount = async () => {
      try {
        const response = await api.get('/geofence');
        if (response.data && response.data.data) {
          setTotalZones(response.data.data.length);
        }
      } catch (err) {
        console.error('Error fetching zones:', err);
      }
    };
    fetchZonesCount();

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
        }
      );
    }

    // Listen for real-time updates
    socketService.on('geofence:created', fetchZonesCount);
    socketService.on('geofence:deleted', fetchZonesCount);

    return () => {
      socketService.off('geofence:created', fetchZonesCount);
      socketService.off('geofence:deleted', fetchZonesCount);
    };
  }, []);

  // Handle map clicks for drawing
  const handleMapClick = useCallback((latlng) => {
    if (drawingMode === 'polygon') {
      setPolygonPoints(prev => [...prev, [latlng.lat, latlng.lng]]);
    } else if (drawingMode === 'circle') {
      setCircleCenter([latlng.lat, latlng.lng]);
    }
  }, [drawingMode]);

  // Undo last point
  const handleUndo = () => {
    if (drawingMode === 'polygon' && polygonPoints.length > 0) {
      setPolygonPoints(prev => prev.slice(0, -1));
    } else if (drawingMode === 'circle') {
      setCircleCenter(null);
    }
  };

  // Clear all drawing
  const handleClear = () => {
    setDrawingMode(null);
    setPolygonPoints([]);
    setCircleCenter(null);
  };

  // Locate user on map
  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 15);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setErrorMessage('Unable to get your location');
          setTimeout(() => setErrorMessage(''), 3000);
        }
      );
    }
  };

  // Get severity color for map drawing
  const getSeverityColor = (sev) => {
    const colors = {
      Critical: '#ef4444',
      High: '#f97316',
      Medium: '#eab308',
      Low: '#22c55e'
    };
    return colors[sev] || colors.Medium;
  };

  const getSeverityConfig = (sev) => {
    const configs = {
      Critical: { color: 'bg-red-500', bgLight: 'bg-red-50', textColor: 'text-red-700', borderColor: 'border-red-200' },
      High: { color: 'bg-orange-500', bgLight: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' },
      Medium: { color: 'bg-yellow-500', bgLight: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' },
      Low: { color: 'bg-green-500', bgLight: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200' }
    };
    return configs[sev] || configs.Medium;
  };

  const handleSave = async () => {
    if (!zoneName.trim()) {
      setErrorMessage('Please enter a zone name');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // Validate drawing
    if (drawingMode === 'polygon' && polygonPoints.length < 3) {
      setErrorMessage('Please draw at least 3 points for a polygon');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    if (drawingMode === 'circle' && !circleCenter) {
      setErrorMessage('Please click on the map to set circle center');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    // If no drawing mode selected, use default values for demo
    const usePolygon = drawingMode === 'polygon' && polygonPoints.length >= 3;
    const useCircle = drawingMode === 'circle' && circleCenter;

    const zoneData = {
      name: zoneName,
      description,
      zoneType: useCircle ? 'circle' : 'polygon',
      riskCategory: severity,
      ...(useCircle ? {
        center: { latitude: circleCenter[0], longitude: circleCenter[1] },
        radius: radius
      } : {
        coordinates: usePolygon 
          ? polygonPoints.map(point => ({ latitude: point[0], longitude: point[1] }))
          : [
              { latitude: mapCenter[0] + 0.001, longitude: mapCenter[1] - 0.001 },
              { latitude: mapCenter[0] + 0.001, longitude: mapCenter[1] + 0.001 },
              { latitude: mapCenter[0] - 0.001, longitude: mapCenter[1] + 0.001 },
              { latitude: mapCenter[0] - 0.001, longitude: mapCenter[1] - 0.001 }
            ]
      })
    };

    try {
      setSaving(true);
      setErrorMessage('');
      
      // Use api module for consistent authentication handling
      const response = await api.post('/geofence', zoneData);

      if (response.data && response.data.success) {
        setSuccessMessage('Geo-fence zone created successfully!');
        setZoneName('');
        setDescription('');
        setSeverity('High');
        setDrawingMode(null);
        setPolygonPoints([]);
        setCircleCenter(null);
        setTotalZones(prev => prev + 1);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(response.data?.message || 'Failed to create zone');
        setTimeout(() => setErrorMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error creating geo-fence:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to create geo-fence zone');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const severityConfig = getSeverityConfig(severity);

  return (
    <div className="admin-page-container fade-in">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 fade-in">
          <FaCheckCircle className="text-green-500 text-xl" />
          <span className="text-green-700 font-medium">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 fade-in">
          <FaExclamationTriangle className="text-red-500 text-xl" />
          <span className="text-red-700 font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="map-container">
            <div className="map-toolbar">
              <span className="text-sm font-medium text-gray-700 mr-4">Drawing Tools:</span>
              <button
                onClick={() => {
                  setDrawingMode('polygon');
                  setCircleCenter(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${
                  drawingMode === 'polygon'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaDrawPolygon />
                <span>Polygon</span>
              </button>
              <button
                onClick={() => {
                  setDrawingMode('circle');
                  setPolygonPoints([]);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${
                  drawingMode === 'circle'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaCircle className="text-xs" />
                <span>Circle</span>
              </button>
              <div className="flex-1" />
              <button
                onClick={handleUndo}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all text-sm"
                disabled={drawingMode === 'polygon' ? polygonPoints.length === 0 : !circleCenter}
              >
                <FaUndo />
                <span>Undo</span>
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-sm"
              >
                <FaTrash />
                <span>Clear</span>
              </button>
            </div>

            {/* Leaflet Map */}
            <div style={{ height: '400px', width: '100%', position: 'relative' }} className="rounded-b-2xl overflow-hidden">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Map click handler */}
                <MapClickHandler onMapClick={handleMapClick} drawingMode={drawingMode} />
                
                {/* Map controls */}
                <MapControls onLocate={handleLocate} />
                
                {/* Polygon markers and shape */}
                {polygonPoints.map((point, index) => (
                  <Marker 
                    key={`marker-${index}`} 
                    position={point}
                    icon={index === 0 ? greenIcon : blueIcon}
                  />
                ))}
                {polygonPoints.length >= 3 && (
                  <Polygon
                    positions={polygonPoints}
                    pathOptions={{
                      color: getSeverityColor(severity),
                      fillColor: getSeverityColor(severity),
                      fillOpacity: 0.3,
                      weight: 3
                    }}
                  />
                )}
                
                {/* Circle center marker and shape */}
                {circleCenter && (
                  <>
                    <Marker position={circleCenter} icon={redIcon} />
                    <Circle
                      center={circleCenter}
                      radius={radius}
                      pathOptions={{
                        color: getSeverityColor(severity),
                        fillColor: getSeverityColor(severity),
                        fillOpacity: 0.3,
                        weight: 3
                      }}
                    />
                  </>
                )}
              </MapContainer>
              
              {/* Drawing instructions overlay */}
              {drawingMode && (
                <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <FaInfoCircle className="text-blue-500" />
                    <span className="font-medium text-gray-700">
                      {drawingMode === 'polygon' 
                        ? `Click to add points (${polygonPoints.length} points placed)`
                        : circleCenter 
                          ? 'Circle placed! Adjust radius below'
                          : 'Click to set circle center'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Zone Configuration Card */}
          <div className="detail-panel">
            <div className="detail-panel-header">
              <h3 className="detail-panel-title">Zone Configuration</h3>
            </div>
            <div className="detail-panel-body">
              <div className="space-y-5">
                <div className="form-group mb-0">
                  <label className="form-label">
                    Zone Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                    className="form-input"
                    placeholder="e.g., Downtown Bar District"
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="form-select"
                  >
                    <option value="Critical">🔴 Critical</option>
                    <option value="High">🟠 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                {/* Severity Preview */}
                <div className={`p-4 rounded-xl ${severityConfig.bgLight} ${severityConfig.borderColor} border`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${severityConfig.color}`} />
                    <span className={`font-semibold ${severityConfig.textColor}`}>{severity} Risk Zone</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {severity === 'Critical' && 'Immediate alert when patient enters this zone'}
                    {severity === 'High' && 'High priority alert with supervisor notification'}
                    {severity === 'Medium' && 'Standard monitoring with periodic checks'}
                    {severity === 'Low' && 'Basic tracking, informational only'}
                  </p>
                </div>

                {drawingMode === 'circle' && (
                  <div className="form-group mb-0">
                    <label className="form-label">Radius (meters)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="flex-1"
                        min="100"
                        max="5000"
                        step="100"
                      />
                      <input
                        type="number"
                        value={radius}
                        onChange={(e) => setRadius(Number(e.target.value))}
                        className="form-input w-24"
                        min="100"
                        max="10000"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{radius}m radius</p>
                  </div>
                )}

                {/* Drawing Status */}
                {drawingMode && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${drawingMode === 'polygon' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                      <span className="font-medium text-gray-700">
                        Drawing {drawingMode === 'polygon' ? 'Polygon' : 'Circle'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {drawingMode === 'polygon' 
                        ? `${polygonPoints.length} points placed ${polygonPoints.length < 3 ? '(need at least 3)' : '✓'}`
                        : circleCenter 
                          ? `Center set at ${circleCenter[0].toFixed(4)}, ${circleCenter[1].toFixed(4)}`
                          : 'Click on map to set center'
                      }
                    </p>
                  </div>
                )}

                <div className="form-group mb-0">
                  <label className="form-label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="form-textarea"
                    placeholder="Describe the zone, its risk factors, and any special instructions..."
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={!zoneName.trim() || saving}
                  className="btn-primary w-full py-3"
                >
                  {saving ? (
                    <>
                      <div className="loading-spinner w-5 h-5 border-2 border-white border-t-transparent" />
                      <span>Creating Zone...</span>
                    </>
                  ) : (
                    <>
                      <FaSave />
                      <span>Create Zone</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Tips Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FaInfoCircle className="text-blue-500" />
              Quick Tips
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Use polygons for irregular shapes like building perimeters
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Use circles for general areas around specific locations
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                Critical zones trigger immediate supervisor alerts
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGeoFence;