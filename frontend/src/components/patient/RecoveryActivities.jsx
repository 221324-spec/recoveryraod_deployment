import React from 'react';

const recoveryActivities = [
  { 
    activity: 'Morning Meditation', 
    status: 'completed', 
    time: 'Today 7:00 AM',
    type: 'wellness',
    amount: '+15',
    color: 'green'
  },
  { 
    activity: 'Therapy Session', 
    status: 'scheduled', 
    time: 'Scheduled',
    type: 'support',
    amount: '•••',
    color: 'blue'
  },
  { 
    activity: 'Exercise & Movement', 
    status: 'pending', 
    time: 'Today 6:00 PM',
    type: 'physical',
    amount: '+10',
    color: 'orange'
  },
  { 
    activity: 'Gratitude Journal', 
    status: 'pending', 
    time: 'Today 9:00 PM',
    type: 'mindfulness',
    amount: '+5',
    color: 'blue'
  }
];

export default function RecoveryActivities() {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Today's Activities
        </h3>
        <div className="text-sm text-gray-500">
          {recoveryActivities.filter(a => a.status === 'completed').length}/{recoveryActivities.length}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto space-y-2">
        {recoveryActivities.map((activity, index) => (
          <div key={index} className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between">
              {/* Left: Simple colored circle */}
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  activity.color === 'green' ? 'bg-sky-500' : 
                  activity.color === 'orange' ? 'bg-orange-500' : 
                  'bg-blue-500'
                }`}>
                  {activity.status === 'completed' ? '✓' : 
                   activity.status === 'scheduled' ? '📅' : '○'}
                </div>
                
                {/* Activity details */}
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {activity.activity}
                  </div>
                  <div className="text-xs text-gray-500">
                    {activity.time}
                  </div>
                </div>
              </div>
              
              {/* Right: Points/Status */}
              <div className={`font-medium text-sm ${
                activity.status === 'completed' ? 'text-sky-600' :
                activity.status === 'scheduled' ? 'text-blue-600' :
                'text-gray-400'
              }`}>
                {activity.amount}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          💡 Complete activities to earn wellness points
        </div>
      </div>
    </div>
  );
}