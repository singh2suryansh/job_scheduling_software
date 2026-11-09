import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  DollarSign,
  Percent,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  Clock,
  Layers,
} from 'lucide-react';

const PALETTE = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
];

export default function ProfitContributionSection({
  scheduledJobs = [],
  rejectedJobs = [], // array of objects { job_name, profit, deadline, reason } or strings
  totalProfit = 0,
}) {
  const [viewMode, setViewMode] = useState('amount'); // 'amount' (₹) or 'percent' (%)
  const [chartType, setChartType] = useState('donut'); // 'donut' or 'bar'
  const [selectedJob, setSelectedJob] = useState(null);

  // Compute total profit if not provided or 0
  const computedTotal = totalProfit > 0
    ? totalProfit
    : scheduledJobs.reduce((acc, j) => acc + (Number(j.profit) || 0), 0);

  // Format scheduled jobs data with percentage contribution
  const scheduledData = scheduledJobs.map((j, idx) => {
    const profitNum = Number(j.profit) || 0;
    const pct = computedTotal > 0 ? (profitNum / computedTotal) * 100 : 0;
    return {
      ...j,
      name: j.job_name,
      profit: profitNum,
      contributionPct: Number(pct.toFixed(2)),
      color: PALETTE[idx % PALETTE.length],
    };
  });

  // Sort descending by profit
  scheduledData.sort((a, b) => b.profit - a.profit);

  // Custom Tooltip for Donut & Bar
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length && payload[0]?.payload) {
      const item = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl text-xs space-y-1 z-50">
          <p className="font-bold text-white text-sm flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: item.color }}
            />
            {item.name}
          </p>
          <p className="text-emerald-400 font-mono font-semibold">
            Profit: ₹{item.profit.toLocaleString()}
          </p>
          <p className="text-cyan-400 font-mono font-semibold">
            Contribution: {item.contributionPct}%
          </p>
          {item.assigned_slot && (
            <p className="text-amber-300 font-mono">
              Assigned: Slot {item.assigned_slot} (Deadline: {item.deadline})
            </p>
          )}
          <p className="text-[10px] text-slate-400 pt-1">
            Click segment to lock inspection details
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
      {/* Header with View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Individual Job Profit Contribution
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Breakdown of how each scheduled job contributes to the total earned profit of ₹{computedTotal.toLocaleString()}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Chart type toggle */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setChartType('donut')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                chartType === 'donut'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Donut Contribution Chart"
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Donut</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                chartType === 'bar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Bar Comparison Chart"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bar</span>
            </button>
          </div>

          {/* Amount vs Percent view toggle */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
            <button
              onClick={() => setViewMode('amount')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'amount'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>₹ Value</span>
            </button>
            <button
              onClick={() => setViewMode('percent')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                viewMode === 'percent'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>% Share</span>
            </button>
          </div>
        </div>
      </div>

      {scheduledData.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No scheduled jobs available. Run the greedy scheduler to see profit contribution metrics.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Visual Chart (Donut or Bar) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'donut' ? (
                  <PieChart>
                    <Pie
                      data={scheduledData}
                      dataKey={viewMode === 'amount' ? 'profit' : 'contributionPct'}
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      onClick={(data) => setSelectedJob(data)}
                      cursor="pointer"
                    >
                      {scheduledData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#0f172a"
                          strokeWidth={2}
                          className="transition-transform duration-200 hover:scale-105"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                ) : (
                  <BarChart data={scheduledData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      tickFormatter={(val) => (viewMode === 'amount' ? `₹${val}` : `${val}%`)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey={viewMode === 'amount' ? 'profit' : 'contributionPct'}
                      radius={[6, 6, 0, 0]}
                      onClick={(data) => setSelectedJob(data)}
                      cursor="pointer"
                    >
                      {scheduledData.map((entry, index) => (
                        <Cell key={`bar-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Total Profit center badge */}
            <div className="text-center pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Scheduled Profit
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ₹{computedTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Table of Individual Job Contributions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-3">Job Name</th>
                    <th className="py-2.5 px-3">Slot</th>
                    <th className="py-2.5 px-3">Deadline</th>
                    <th className="py-2.5 px-3">Profit (₹)</th>
                    <th className="py-2.5 px-3">Contribution (%)</th>
                    <th className="py-2.5 px-3">Visual Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 font-mono">
                  {scheduledData.map((job) => {
                    const isSelected = selectedJob && selectedJob.name === job.name;
                    return (
                      <tr
                        key={job.name}
                        onClick={() => setSelectedJob(job)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-950/50 border-l-2 border-l-blue-400'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: job.color }}
                          />
                          <span>{job.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-cyan-300 font-semibold">
                          Slot {job.assigned_slot || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-amber-300">
                          {job.deadline}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-400">
                          ₹{job.profit.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-cyan-300">
                          {job.contributionPct}%
                        </td>
                        <td className="py-2.5 px-3 w-32">
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(job.contributionPct, 100)}%`,
                                backgroundColor: job.color,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Job Card (Appears when user clicks a row or segment) */}
            {selectedJob && (
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/50 flex items-center justify-between animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-md"
                    style={{ backgroundColor: selectedJob.color }}
                  >
                    {selectedJob.name}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Selected: {selectedJob.name}
                    </h4>
                    <p className="text-[11px] text-slate-300">
                      Earns ₹{selectedJob.profit.toLocaleString()} ({selectedJob.contributionPct}% of total profit).
                      {selectedJob.assigned_slot ? ` Executing in time slot ${selectedJob.assigned_slot}.` : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rejected Jobs Displayed Separately (Rule: Not in scheduled contribution chart!) */}
      {rejectedJobs && rejectedJobs.length > 0 && (
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" />
              Rejected Candidates ({rejectedJobs.length}) — Excluded from Earned Profit
            </h4>
            <span className="text-[11px] text-slate-400">
              0% Profit Contribution
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {rejectedJobs.map((rj, idx) => {
              const name = typeof rj === 'string' ? rj : rj.job_name;
              const reason = typeof rj === 'object' && rj.reason ? rj.reason : 'All slots occupied by higher-profit jobs';
              const profitVal = typeof rj === 'object' && rj.profit !== undefined ? `₹${rj.profit}` : null;
              const deadlineVal = typeof rj === 'object' && rj.deadline !== undefined ? `Slot ${rj.deadline}` : null;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-300 font-mono">{name}</span>
                    {profitVal && <span className="text-slate-400 font-mono">{profitVal}</span>}
                  </div>
                  {deadlineVal && (
                    <span className="text-[10px] text-amber-300 block font-mono">
                      Target: {deadlineVal}
                    </span>
                  )}
                  <p className="text-[10px] text-rose-300/80 leading-tight">
                    {reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
