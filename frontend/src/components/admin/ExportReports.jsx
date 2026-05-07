import React, { useState, useEffect } from 'react';
import { FaFilePdf, FaFileExcel, FaDownload, FaCheckCircle, FaSpinner, FaBuilding, FaUserMd, FaUsers, FaExclamationTriangle, FaClipboardList, FaChartPie, FaFileAlt, FaDatabase, FaClock } from 'react-icons/fa';
import api from '../../api';
import socketService from '../../services/socketService';
import './AdminComponents.css';
import { apiFetch } from '../../config/env';

const ExportReports = ({ syncRef, onLastUpdatedChange, onRefreshingChange } = {}) => {
  const [selectedReport, setSelectedReport] = useState('');
  const [exportType, setExportType] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ ngos: 0, supervisors: 0, patients: 0, alerts: 0 });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchReportData();
    
    socketService.on('stats:updated', fetchReportData);
    socketService.on('organization:created', fetchReportData);
    
    return () => {
      socketService.off('stats:updated', fetchReportData);
      socketService.off('organization:created', fetchReportData);
    };
  }, []);

  // Wire refresh into parent header
  useEffect(() => {
    if (syncRef) syncRef.current = fetchReportData;
    return () => { if (syncRef) syncRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRef]);

  useEffect(() => { onLastUpdatedChange?.(lastUpdated); }, [lastUpdated, onLastUpdatedChange]);
  useEffect(() => { onRefreshingChange?.(loading); }, [loading, onRefreshingChange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const statsResponse = await api.get('/admin/stats');
      if (statsResponse.data?.data) {
        const data = statsResponse.data.data;
        setStats({
          ngos: data.totalNGOs || 0,
          supervisors: data.totalSupervisors || 0,
          patients: data.totalPatients || 0,
          alerts: data.riskAlertsWeek || 0
        });
      }
      setLastUpdated(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      setLoading(false);
    }
  };

  const reportOptions = [
    {
      value: 'system-wide-pdf',
      label: 'System-wide PDF Report',
      description: 'Complete system overview including all NGOs, supervisors, and patients',
      icon: FaChartPie,
      color: 'blue',
      records: stats.ngos + stats.supervisors + stats.patients
    },
    {
      value: 'ngo-wise-pdf',
      label: 'NGO-wise PDF Reports',
      description: 'Individual PDF reports for each NGO with detailed analytics',
      icon: FaBuilding,
      color: 'purple',
      records: stats.ngos
    },
    {
      value: 'supervisor-level',
      label: 'Supervisor-level Report',
      description: 'Performance reports for all supervisors across organizations',
      icon: FaUserMd,
      color: 'green',
      records: stats.supervisors
    },
    {
      value: 'patient-level',
      label: 'Patient-level Summary',
      description: 'Aggregated patient data and recovery statistics',
      icon: FaUsers,
      color: 'orange',
      records: stats.patients
    }
  ];

  const handleExport = async () => {
    if (!selectedReport) {
      alert('Please select a report type');
      return;
    }

    setIsExporting(true);
    setExportComplete(false);
    setExportProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      const token = localStorage.getItem('token');
      const format = exportType === 'excel' ? 'csv' : 'json';
      
      // Determine the correct endpoint based on report type
      let endpoint = '/admin/export/system-report';
      if (selectedReport === 'ngo-wise-pdf') endpoint = '/admin/export/organizations';
      else if (selectedReport === 'supervisor-level') endpoint = '/admin/export/users?role=supervisor';
      else if (selectedReport === 'patient-level') endpoint = '/admin/export/users?role=patient';
      
      const response = await apiFetch(`/api${endpoint}&format=${format}`.replace('?role', `?format=${format}&role`).replace('&&', '&'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Handle CSV download
      if (format === 'csv') {
        const csvText = await response.text();
        const blob = new Blob([csvText], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON download
        const data = await response.json();
        const content = JSON.stringify(data, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      setIsExporting(false);
      setExportComplete(true);

      // Reset after showing success
      setTimeout(() => {
        setExportComplete(false);
        setExportProgress(0);
      }, 3000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report. Please try again.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-100', text: 'text-blue-600', gradient: 'from-blue-500 to-blue-600' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-600', gradient: 'from-purple-500 to-purple-600' },
      green: { bg: 'bg-green-100', text: 'text-green-600', gradient: 'from-green-500 to-green-600' },
      orange: { bg: 'bg-orange-100', text: 'text-orange-600', gradient: 'from-orange-500 to-orange-600' }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="admin-page-container fade-in">
      {/* Live Stats Preview Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 mb-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FaDatabase className="text-white/80" />
            Current System Data
          </h3>
          <div className="flex items-center gap-2 text-sm bg-white/20 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Real-time
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-colors">
            <FaBuilding className="text-2xl mx-auto mb-2 text-white/90" />
            <div className="text-3xl font-bold">{stats.ngos}</div>
            <div className="text-sm opacity-90">Organizations</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-colors">
            <FaUserMd className="text-2xl mx-auto mb-2 text-white/90" />
            <div className="text-3xl font-bold">{stats.supervisors}</div>
            <div className="text-sm opacity-90">Supervisors</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-colors">
            <FaUsers className="text-2xl mx-auto mb-2 text-white/90" />
            <div className="text-3xl font-bold">{stats.patients}</div>
            <div className="text-sm opacity-90">Patients</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-colors">
            <FaExclamationTriangle className="text-2xl mx-auto mb-2 text-white/90" />
            <div className="text-3xl font-bold">{stats.alerts}</div>
            <div className="text-sm opacity-90">Weekly Alerts</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selection */}
        <div className="lg:col-span-2">
          <div className="data-card">
            <div className="data-card-header">
              <h3 className="data-card-title flex items-center gap-2">
                <FaClipboardList className="text-blue-500" />
                Select Report Type
              </h3>
            </div>
            <div className="data-card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportOptions.map((option) => {
                  const colors = getColorClasses(option.color);
                  return (
                    <label
                      key={option.value}
                      className={`relative block p-5 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                        selectedReport === option.value
                          ? `border-${option.color}-500 bg-${option.color}-50 ring-2 ring-${option.color}-200`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-white shadow-lg`}>
                          <option.icon className="text-xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="report"
                              value={option.value}
                              checked={selectedReport === option.value}
                              onChange={(e) => setSelectedReport(e.target.value)}
                              className="sr-only"
                            />
                            <span className={`font-semibold ${selectedReport === option.value ? colors.text : 'text-gray-900'}`}>
                              {option.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${colors.bg}`}>
                              <FaDatabase className={`text-[10px] ${colors.text}`} />
                              {option.records} records
                            </span>
                          </div>
                        </div>
                        {selectedReport === option.value && (
                          <div className={`absolute top-3 right-3 w-6 h-6 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                            <FaCheckCircle className="text-white text-xs" />
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Export Format */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Export Format</h4>
                <div className="flex flex-wrap gap-4">
                  <label className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    exportType === 'pdf' 
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="format"
                      value="pdf"
                      checked={exportType === 'pdf'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="sr-only"
                    />
                    <FaFilePdf className={`text-2xl ${exportType === 'pdf' ? 'text-red-500' : 'text-gray-400'}`} />
                    <div>
                      <div className={`font-medium ${exportType === 'pdf' ? 'text-red-600' : 'text-gray-900'}`}>PDF Document</div>
                      <div className="text-xs text-gray-500">Best for printing</div>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 cursor-pointer transition-all ${
                    exportType === 'excel' 
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="format"
                      value="excel"
                      checked={exportType === 'excel'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="sr-only"
                    />
                    <FaFileExcel className={`text-2xl ${exportType === 'excel' ? 'text-green-500' : 'text-gray-400'}`} />
                    <div>
                      <div className={`font-medium ${exportType === 'excel' ? 'text-green-600' : 'text-gray-900'}`}>Excel Spreadsheet</div>
                      <div className="text-xs text-gray-500">Best for data analysis</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Action Panel */}
        <div className="lg:col-span-1">
          <div className="data-card sticky top-6">
            <div className="data-card-header">
              <h3 className="data-card-title">Export Summary</h3>
            </div>
            <div className="data-card-body">
              {/* Selected Configuration */}
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Selected Report</div>
                <div className="font-semibold text-gray-900">
                  {selectedReport
                    ? reportOptions.find(opt => opt.value === selectedReport)?.label
                    : '— Select a report —'
                  }
                </div>
              </div>
              
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Format</div>
                <div className="flex items-center gap-2">
                  {exportType === 'pdf' ? (
                    <><FaFilePdf className="text-red-500" /> PDF Document</>
                  ) : (
                    <><FaFileExcel className="text-green-500" /> Excel Spreadsheet</>
                  )}
                </div>
              </div>

              {selectedReport && (
                <div className="mb-6 p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm text-blue-800 font-medium mb-1">Estimated Records</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportOptions.find(opt => opt.value === selectedReport)?.records || 0}
                  </div>
                </div>
              )}

              {/* Export Button */}
              <button
                onClick={handleExport}
                disabled={!selectedReport || isExporting}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold transition-all ${
                  !selectedReport || isExporting
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : exportComplete
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5'
                }`}
              >
                {isExporting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : exportComplete ? (
                  <>
                    <FaCheckCircle />
                    <span>Download Complete!</span>
                  </>
                ) : (
                  <>
                    <FaDownload />
                    <span>Export Report</span>
                  </>
                )}
              </button>

              {/* Progress Indicator */}
              {isExporting && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-blue-600">{exportProgress}%</span>
                  </div>
                  <div className="progress-bar h-2">
                    <div 
                      className="progress-bar-fill blue transition-all duration-300" 
                      style={{ width: `${exportProgress}%` }} 
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Compiling your data...</p>
                </div>
              )}

              {/* Success Message */}
              {exportComplete && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2 text-green-800">
                    <FaCheckCircle className="text-green-600" />
                    <span className="font-medium">Report Ready</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">Your download should start automatically.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Contents Preview */}
      <div className="mt-8 data-card">
        <div className="data-card-header">
          <h3 className="data-card-title">Report Contents Preview</h3>
        </div>
        <div className="data-card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <h5 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <FaChartPie className="text-blue-500" />
                System-wide PDF includes:
              </h5>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Executive summary dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  KPI performance metrics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  NGO performance rankings
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                  Alert and crisis statistics
                </li>
              </ul>
            </div>
            <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <h5 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <FaBuilding className="text-purple-500" />
                NGO-wise reports include:
              </h5>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  Individual NGO analytics
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  Supervisor performance data
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  Patient progress reports
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                  Custom impact metrics
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="mt-6 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
        <FaClock />
        Data last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

export default ExportReports;