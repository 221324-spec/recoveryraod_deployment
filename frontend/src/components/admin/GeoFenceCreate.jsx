import React, { useState } from 'react';
import { FaMapMarkerAlt, FaPlus, FaSave, FaTimes } from 'react-icons/fa';

export default function GeoFenceCreate() {
  const [zones, setZones] = useState([]);
  const [newZone, setNewZone] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '',
    riskLevel: 'high'
  });

  const handleAddZone = () => {
    if (newZone.name && newZone.latitude && newZone.longitude && newZone.radius) {
      setZones([...zones, { ...newZone, id: Date.now() }]);
      setNewZone({
        name: '',
        latitude: '',
        longitude: '',
        radius: '',
        riskLevel: 'high'
      });
    }
  };

  const handleDeleteZone = (id) => {
    setZones(zones.filter(zone => zone.id !== id));
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Create High-Risk Zones</h2>
          <p className="text-gray-600 mt-2">Define geographical areas that require special monitoring</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
          <div className="flex items-center space-x-3">
            <FaMapMarkerAlt className="text-blue-600 text-2xl" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Active Zones</p>
              <p className="text-2xl font-bold text-blue-600">{zones.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Zone Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Create New Zone</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone Name</label>
              <input
                type="text"
                value={newZone.name}
                onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter zone name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={newZone.latitude}
                  onChange={(e) => setNewZone({...newZone, latitude: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 40.7128"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={newZone.longitude}
                  onChange={(e) => setNewZone({...newZone, longitude: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., -74.0060"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Radius (meters)</label>
              <input
                type="number"
                value={newZone.radius}
                onChange={(e) => setNewZone({...newZone, radius: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter radius in meters"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <select
                value={newZone.riskLevel}
                onChange={(e) => setNewZone({...newZone, riskLevel: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="high">High Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="low">Low Risk</option>
              </select>
            </div>
            <button
              onClick={handleAddZone}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <FaPlus className="text-sm" />
              <span>Add Zone</span>
            </button>
          </div>
        </div>

        {/* Zone List */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Active Zones</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {zones.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FaMapMarkerAlt className="text-4xl mx-auto mb-3 text-gray-300" />
                <p>No zones created yet</p>
              </div>
            ) : (
              zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <FaMapMarkerAlt className={`text-lg ${
                      zone.riskLevel === 'high' ? 'text-red-500' :
                      zone.riskLevel === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <div>
                      <p className="font-semibold text-gray-800">{zone.name}</p>
                      <p className="text-sm text-gray-600">
                        {zone.latitude}, {zone.longitude} • {zone.radius}m radius
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      zone.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                      zone.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {zone.riskLevel}
                    </span>
                    <button
                      onClick={() => handleDeleteZone(zone.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}