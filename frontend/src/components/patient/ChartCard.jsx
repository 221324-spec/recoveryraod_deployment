import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const sampleData = [
  { name: 'Jun', paid: 420, free: 260 },
  { name: 'Jul', paid: 320, free: 160 },
  { name: 'Aug', paid: 780, free: 420 },
  { name: 'Sep', paid: 300, free: 220 },
  { name: 'Oct', paid: 260, free: 180 },
  { name: 'Nov', paid: 310, free: 200 },
  { name: 'Dec', paid: 480, free: 260 },
];

export default function ChartCard({ title = 'Activity' }) {
  return (
    <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={sampleData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 14 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 14 }} />
            <Tooltip />
            <Bar dataKey="paid" stackId="a" fill="#2563eb" radius={[4,4,0,0]} />
            <Bar dataKey="free" stackId="a" fill="#93c5fd" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
