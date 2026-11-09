import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getAnalytics, getScheduleHistory, getJobs } from '../services/api';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [analyticsData, historyData, jobsData] = await Promise.all([
          getAnalytics(),
          getScheduleHistory(),
          getJobs(),
        ]);
        setAnalytics(analyticsData);
        setHistory(historyData || []);
        setJobs(jobsData || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating algorithmic performance analytics..." />;
  }

  const cumulative = analytics?.cumulative_stats;
  const latestRun = analytics?.latest_run;

  // Format historical trend data (reversed so older to newer left-to-right)
  const historyTrendData = [...history].reverse().map((run) => ({
    name: `Run #${run.id}`,
    profit: run.total_profit,
    scheduled: run.scheduled_count,
    rejected: run.rejected_count,
  }));

  // Format deadline distribution of current job pool
  const deadlineCountMap = {};
  jobs.forEach((j) => {
    deadlineCountMap[j.deadline] = (deadlineCountMap[j.deadline] || 0) + 1;
  });
  const deadlineData = Object.keys(deadlineCountMap)
    .sort((a, b) => Number(a) - Number(b))
    .map((d) => ({
      slot: `Slot ${d}`,
      jobsCount: deadlineCountMap[d],
    }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          Greedy Algorithm Performance Analytics
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Historical benchmarking, profit yields, slot utilization, and deadline distribution.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Cumulative Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Scheduling Runs"
          value={cumulative?.total_runs ?? history.length}
          subtitle="Algorithm executions"
          icon={Layers}
          accent="blue"
        />
        <StatCard
          title="Cumulative Profit Earned"
          value={`₹${(cumulative?.total_profit_accumulated ?? 0).toLocaleString()}`}
          subtitle="Across all historical runs"
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          title="Average Profit per Run"
          value={`₹${(cumulative?.average_profit_per_run ?? 0).toLocaleString()}`}
          subtitle="Mean performance yield"
          icon={Award}
          accent="cyan"
        />
        <StatCard
          title="Max Profit in a Run"
          value={`₹${(cumulative?.max_profit_achieved ?? 0).toLocaleString()}`}
          subtitle="Optimal run peak"
          icon={Award}
          accent="amber"
        />
      </div>

      {/* Latest Run vs Historical Comparison Banner */}
      {latestRun && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-bold">
              #{latestRun.run_id}
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Latest Execution Snapshot
              </span>
              <p className="text-sm font-bold text-white">
                ₹{latestRun.total_profit.toLocaleString()} Profit • {latestRun.scheduled_count} Scheduled • {latestRun.rejected_count} Rejected
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Recorded: {new Date(latestRun.run_at).toLocaleString()}
          </span>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Trend Across Runs */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Profit Yield Trend Across Runs
          </h3>
          <div className="w-full h-72">
            {historyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No historical run records yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Scheduled vs Rejected Trends */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Scheduled vs Rejected Job Ratio by Run
          </h3>
          <div className="w-full h-72">
            {historyTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No historical run records yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="scheduled" name="Scheduled Jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="rejected" name="Rejected Jobs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Deadline distribution chart */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-amber-400" />
          Job Deadline Distribution (Current Job Pool)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Shows how candidate jobs are distributed across target deadline time slots.
        </p>

        <div className="w-full h-64">
          {deadlineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No jobs entered in the system.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deadlineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="slot" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="jobsCount" name="Number of Jobs" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
