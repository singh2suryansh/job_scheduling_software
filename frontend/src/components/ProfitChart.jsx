import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length && payload[0]?.payload) {
    const item = payload[0].payload;
    return (
      <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl text-xs space-y-1">
        <p className="font-bold text-white text-sm">{item.name}</p>
        <p className="text-emerald-400 font-mono font-semibold">
          Profit: ₹{item.profit}
        </p>
        <p className="text-amber-300 font-mono">
          Deadline: Slot {item.deadline}
        </p>
        <div className="pt-1">
          <span
            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
              item.isScheduled
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {item.isScheduled ? 'Scheduled' : 'Pending / Rejected'}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProfitChart({ jobs = [], scheduledNames = [] }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        No job profit data available.
      </div>
    );
  }

  // Format data for chart
  const data = jobs.map((j) => ({
    name: j.job_name,
    profit: j.profit,
    deadline: j.deadline,
    isScheduled: scheduledNames.includes(j.job_name),
  }));

  // Sort descending by profit
  data.sort((a, b) => b.profit - a.profit);

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 12 }}
            interval={0}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="profit" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isScheduled ? '#10b981' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
