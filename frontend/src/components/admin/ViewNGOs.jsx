import React, { useState, useEffect } from 'react';
import { FaBuilding, FaUsers, FaUserMd, FaCheckCircle, FaTimesCircle, FaEye, FaEdit, FaTrash, FaSearch, FaTh, FaList, FaPhone, FaEnvelope } from 'react-icons/fa';
import socketService from '../../services/socketService';
import './AdminComponents.css';
import { apiFetch } from '../../config/env';

const ViewNGOs = ({ onEdit, onViewReports, syncRef, onLastUpdatedChange, onRefreshingChange } = {}) => {
  const [viewMode, setViewMode] = useState('cards');
  const [ngos, setNgos] = useState([]);
  const [filteredNgos, setFilteredNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchOrganizations();
    
    socketService.on('organization:created', fetchOrganizations);
    socketService.on('organization:updated', fetchOrganizations);
    socketService.on('stats:updated', fetchOrganizations);
    
    return () => {
      socketService.off('organization:created', fetchOrganizations);
      socketService.off('organization:updated', fetchOrganizations);
      socketService.off('stats:updated', fetchOrganizations);
    };
  }, []);

  // Wire refresh to parent header
  useEffect(() => {
    if (syncRef) syncRef.current = fetchOrganizations;
    return () => { if (syncRef) syncRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRef]);

  useEffect(() => { onLastUpdatedChange?.(lastUpdated); }, [lastUpdated, onLastUpdatedChange]);
  useEffect(() => { onRefreshingChange?.(loading); }, [loading, onRefreshingChange]);

  useEffect(() => {
    let filtered = ngos;
    if (searchQuery) {
      filtered = filtered.filter(ngo => 
        ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ngo.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(ngo => ngo.status === filterStatus);
    }
    setFilteredNgos(filtered);
  }, [searchQuery, filterStatus, ngos]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiFetch('/api/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        const ngoData = result.data.map(org => ({
          id: org._id,
          name: org.name,
          supervisors: org.stats?.totalSupervisors || org.supervisors?.length || 0,
          patients: org.stats?.totalPatients || org.patients?.length || 0,
          status: org.status || 'Active',
          contactPerson: org.contactPerson?.name || org.contact?.name || 'N/A',
          email: org.contactPerson?.email || org.contact?.email || 'N/A',
          phone: org.contactPerson?.phone || org.contact?.phone || 'N/A',
          address: org.address ? 
            `${org.address.street || ''}, ${org.address.city || ''}, ${org.address.state || ''} ${org.address.zipCode || ''}`.trim() : 
            'N/A'
        }));
        setNgos(ngoData);
        setFilteredNgos(ngoData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStats = {
    totalOrgs: ngos.length,
    totalSupervisors: ngos.reduce((sum, ngo) => sum + ngo.supervisors, 0),
    totalPatients: ngos.reduce((sum, ngo) => sum + ngo.patients, 0),
    activeOrgs: ngos.filter(ngo => ngo.status === 'Active').length
  };

  const NGOCard = ({ ngo }) => (
    <div className="ngo-card fade-in">
      <div className="ngo-card-header">
        <div className="flex items-start gap-4">
          <div className="ngo-card-icon">
            <FaBuilding />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="ngo-card-title truncate">{ngo.name}</h3>
            <span className={`status-badge ${ngo.status === 'Active' ? 'active' : 'inactive'} mt-2`}>
              {ngo.status === 'Active' ? <FaCheckCircle className="mr-1" /> : <FaTimesCircle className="mr-1" />}
              {ngo.status}
            </span>
          </div>
        </div>
      </div>

      <div className="ngo-card-stats">
        <div className="ngo-card-stat">
          <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
            <FaUserMd />
          </div>
          <div className="ngo-card-stat-value text-blue-600">{ngo.supervisors}</div>
          <div className="ngo-card-stat-label">Supervisors</div>
        </div>
        <div className="ngo-card-stat">
          <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
            <FaUsers />
          </div>
          <div className="ngo-card-stat-value text-green-600">{ngo.patients}</div>
          <div className="ngo-card-stat-label">Patients</div>
        </div>
      </div>

      <div className="ngo-card-contact">
        <div className="flex items-center gap-2">
          <FaUsers className="text-gray-400 text-sm" />
          <span className="truncate">{ngo.contactPerson}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaEnvelope className="text-gray-400 text-sm" />
          <span className="truncate text-sm">{ngo.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaPhone className="text-gray-400 text-sm" />
          <span className="truncate text-sm">{ngo.phone}</span>
        </div>
      </div>

      <div className="ngo-card-actions">
        <button
          onClick={() => onViewReports(ngo)}
          className="btn-primary flex-1 py-2.5"
        >
          <FaEye />
          View Details
        </button>
        <button
          onClick={() => onEdit(ngo)}
          className="btn-secondary flex-1 py-2.5"
        >
          <FaEdit />
          Edit
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-page-container fade-in">
      {/* Live Stats Banner */}
      <div className="live-data-banner">
        <h3 className="live-data-banner-title">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Real-Time Organization Statistics
        </h3>
        <div className="live-data-banner-grid">
          <div className="live-data-item">
            <div className="live-data-item-value">{totalStats.totalOrgs}</div>
            <div className="live-data-item-label">Total Organizations</div>
          </div>
          <div className="live-data-item">
            <div className="live-data-item-value">{totalStats.activeOrgs}</div>
            <div className="live-data-item-label">Active</div>
          </div>
          <div className="live-data-item">
            <div className="live-data-item-value">{totalStats.totalSupervisors}</div>
            <div className="live-data-item-label">Total Supervisors</div>
          </div>
          <div className="live-data-item">
            <div className="live-data-item-value">{totalStats.totalPatients}</div>
            <div className="live-data-item-label">Total Patients</div>
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="filters-panel">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-11"
              />
            </div>
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                viewMode === 'cards' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaTh />
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all ${
                viewMode === 'table' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FaList />
              Table
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Showing {filteredNgos.length} of {ngos.length} organizations • Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading organizations...</p>
        </div>
      ) : ngos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaBuilding />
          </div>
          <h3 className="empty-state-title">No Organizations Found</h3>
          <p className="empty-state-description">No organizations have been registered yet. Start by adding a new NGO or Rehab Center.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNgos.map((ngo) => (
            <NGOCard key={ngo.id} ngo={ngo} />
          ))}
        </div>
      ) : (
        <div className="data-table-container">
          <div className="data-table-header">
            <h3 className="data-table-title">
              <FaBuilding className="text-emerald-500" />
              All Organizations
            </h3>
            <span className="data-card-badge">{filteredNgos.length} organizations</span>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Contact Person</th>
                  <th>Supervisors</th>
                  <th>Patients</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNgos.map((ngo) => (
                  <tr key={ngo.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                          <FaBuilding />
                        </div>
                        <div className="cell-primary font-semibold">{ngo.name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="cell-primary">{ngo.contactPerson}</div>
                      <div className="cell-secondary text-xs">{ngo.email}</div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FaUserMd className="text-blue-500" />
                        <span className="font-semibold text-gray-900">{ngo.supervisors}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-green-500" />
                        <span className="font-semibold text-gray-900">{ngo.patients}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${ngo.status === 'Active' ? 'active' : 'inactive'}`}>
                        {ngo.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onViewReports(ngo)}
                          className="btn-icon blue"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => onEdit(ngo)}
                          className="btn-icon purple"
                          title="Edit Organization"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => console.log('Delete NGO:', ngo.id)}
                          className="btn-icon red"
                          title="Delete Organization"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewNGOs;
