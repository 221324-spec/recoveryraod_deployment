import React from 'react';

export default function StatCard({ label, value, accent, icon, description }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 hover:border-gray-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-1">
            {icon && <span className="text-lg mr-2">{icon}</span>}
            <div className="text-xs font-medium text-gray-600">{label}</div>
          </div>
          <div className={`text-xl font-bold mb-1 ${accent || 'text-gray-900'}`}>{value}</div>
          {description && <div className="text-xs text-gray-500">{description}</div>}
        </div>
      </div>
    </div>
  );
}
