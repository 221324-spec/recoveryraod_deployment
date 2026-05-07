import React, { useState } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';

export default function NotificationPanel({ notifications = [], onDismiss }) {
  const [open, setOpen] = useState(false);

  const unread = notifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Notifications"
        className="relative p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700"
      >
        <FaBell className="text-blue-600 dark:text-blue-400" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1.5 py-0.5">{unread}</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 dark:bg-slate-900 dark:border-slate-600">
          <div className="p-3 border-b border-gray-100 font-semibold dark:border-slate-700 dark:text-slate-100">Notifications</div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 && (
              <div className="p-3 text-sm text-gray-500 dark:text-slate-400">No notifications</div>
            )}
            {notifications.map((n, idx) => (
              <div key={idx} className="p-3 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-slate-800">
                <div className="text-sm">
                  <div className="font-medium text-gray-800 dark:text-slate-200">{n.type || 'Update'}</div>
                  <div className="text-xs text-gray-500 truncate dark:text-slate-400">
                    {n.payload && n.payload.patientId ? `Patient: ${n.payload.patientId}` : JSON.stringify(n.payload).slice(0, 80)}
                  </div>
                </div>
                <div className="pl-2">
                  <button
                    onClick={() => onDismiss && onDismiss(n)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                    title="Dismiss"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
