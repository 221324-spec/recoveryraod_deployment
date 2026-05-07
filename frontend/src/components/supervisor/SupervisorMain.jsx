import React from 'react';

const mockPatients = [
  { id:1, name:'Emma Johnson', lastMood:'Happy', lastChat:'Thanks, feeling better', risk:'blue' },
  { id:2, name:'Liam Brown', lastMood:'Sad', lastChat:'I am struggling', risk:'yellow' },
  { id:3, name:'Olivia Smith', lastMood:'Angry', lastChat:'I had a relapse', risk:'red' },
];

export default function SupervisorMain(){
  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-4">Patients</h2>
      <div className="grid gap-3">
        {mockPatients.map(p=> (
          <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-500">{p.lastChat}</div>
            </div>
            <div className="text-sm">
              <div className={`px-3 py-1 rounded-full ${p.risk==='red'? 'bg-red-200 text-red-700': p.risk==='yellow'? 'bg-yellow-200 text-yellow-700':'bg-blue-200 text-blue-700'}`}>{p.lastMood}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
