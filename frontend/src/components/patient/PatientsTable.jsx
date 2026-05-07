import React from 'react';

const patients = [
  { name: 'Ralph Edwards', avatar: '👤', last: 'No Contact', concerns: ['Anxiety', 'Marriage', 'Hope'], subs: 'Premium', billing: '$1,174,209' },
  { name: 'Jane Cooper', avatar: '👤', last: 'Yesterday', concerns: ['Loneliness', 'Sunshine'], subs: 'Standard', billing: '$42,427' },
  { name: 'Wade Warren', avatar: '👤', last: 'Today', concerns: ['Hot', 'Courage', 'Life'], subs: 'Basic', billing: '$1,340' },
];

export default function PatientsTable() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-800">Subscribers</h3>
          <div className="flex space-x-6">
            <button className="text-base text-gray-600 border-b-2 border-orange-500 pb-1">Subscribers</button>
            <button className="text-base text-gray-600 hover:text-gray-800">Viewed Profile</button>
            <button className="text-base text-gray-600 hover:text-gray-800">Cancelled</button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              <th className="py-4 px-8 text-left">Subscriber</th>
              <th className="py-4 px-8 text-left">Last Message</th>
              <th className="py-4 px-8 text-left">Key Interests</th>
              <th className="py-4 px-8 text-left">Subscriptions</th>
              <th className="py-4 px-8 text-left">Owing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map((p, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="py-6 px-8">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      <span className="text-base">{p.avatar}</span>
                    </div>
                    <div className="font-medium text-gray-900 text-base">{p.name}</div>
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center">
                    {p.last === 'No Contact' && <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>}
                    <span className="text-base text-gray-600">{p.last}</span>
                  </div>
                </td>
                <td className="py-6 px-8">
                  <div className="flex gap-2 flex-wrap">
                    {p.concerns.map((c,i)=> (
                      <span key={i} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {c}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-6 px-8 text-base text-gray-900">{p.subs}</td>
                <td className="py-6 px-8 text-base font-medium text-gray-900">{p.billing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-8 py-6 border-t border-gray-200 text-base text-gray-500">
        {patients.length} result • $14,000 / mo • $10,000.00
      </div>
    </div>
  );
}
