import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Cpu,
  ArrowRight,
  Clock,
  Sparkles,
  Activity,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

import StatCard from '../components/StatCard';
import ProfitChart from '../components/ProfitChart';
import LoadingSpinner from '../components/LoadingSpinner';
import { InlineMath, MathText } from '../components/MathView';
import { getJobs, getAnalytics, getScheduleHistory } from '../services/api';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [jobsData, analyticsData, historyData] = await Promise.all([
        getJobs().catch(() => []),
        getAnalytics().catch(() => null),
        getScheduleHistory().catch(() => []),
      ]);
      setJobs(jobsData || []);
      setAnalytics(analyticsData);
      setHistory(historyData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Fetching dashboard metrics..." />;
  }

  // Calculate metrics
  const totalJobsCount = analytics?.total_jobs ?? jobs.length;
  const latestRun = analytics?.latest_run;
  const scheduledCount = latestRun?.scheduled_count ?? 0;
  const rejectedCount = latestRun?.rejected_count ?? 0;
  const totalProfit = latestRun?.total_profit ?? 0;

  const pieData = [
    { name: 'Scheduled', value: scheduledCount || (totalJobsCount > 0 ? 0 : 0) },
    { name: 'Rejected', value: rejectedCount || 0 },
  ];

  const scheduledJobNames = latestRun?.scheduled_jobs || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome / Hero Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs sm:text-sm">
          {error}
        </div>
      )}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-950/80 via-indigo-950/50 to-slate-900 border border-blue-500/20 p-6 sm:p-8 backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-cyan-300 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Job Sequencing with Deadlines • Greedy Strategy</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              SaaS Scheduling Operations Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Maximize algorithmic profits subject to discrete single-unit time deadlines using the classic Greedy Algorithm with complexity <InlineMath math="\mathcal{O}(n \log n + nD)" />.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/scheduler"
              className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
            >
              <Cpu className="w-4 h-4" />
              <span>Launch Scheduler</span>
            </Link>
            <Link
              to="/jobs"
              className="flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all"
            >
              <Briefcase className="w-4 h-4 text-slate-400" />
              <span>Manage Jobs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={totalJobsCount}
          subtitle="Input candidate jobs"
          icon={Briefcase}
          accent="blue"
        />
        <StatCard
          title="Scheduled Jobs"
          value={scheduledCount}
          subtitle="Allocated to time slots"
          icon={CheckCircle2}
          accent="emerald"
          badge={totalJobsCount > 0 ? `${Math.round((scheduledCount / totalJobsCount) * 100)}%` : undefined}
        />
        <StatCard
          title="Rejected Jobs"
          value={rejectedCount}
          subtitle="Exceeded deadline limits"
          icon={XCircle}
          accent="rose"
        />
        <StatCard
          title="Total Profit"
          value={`₹${totalProfit.toLocaleString()}`}
          subtitle="Maximized earned yield"
          icon={TrendingUp}
          accent="cyan"
        />
      </div>

      {/* Visual Analytics Row: Profit Chart & Scheduled Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profit Distribution */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Job Profit & Allocation Breakdown
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Green bars indicate jobs scheduled in the latest run; blue indicates unallocated.
              </p>
            </div>
          </div>
          <ProfitChart jobs={jobs} scheduledNames={scheduledJobNames} />
        </div>

        {/* Scheduling Overview Donut */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
              <Activity className="w-4 h-4 text-emerald-400" />
              Allocation Ratio
            </h3>
            <div className="h-48 w-full flex items-center justify-center">
              {scheduledCount + rejectedCount > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-slate-400">
                  Execute the scheduler to generate allocation distribution.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Scheduled Slots:
              </span>
              <span className="font-bold text-white font-mono">{scheduledCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                Rejected Jobs:
              </span>
              <span className="font-bold text-white font-mono">{rejectedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Jobs & Recent Scheduling Runs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400" />
              Active Job Pool
            </h3>
            <Link
              to="/jobs"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No jobs entered yet.{' '}
              <Link to="/jobs" className="text-blue-400 hover:underline">
                Add jobs
              </Link>{' '}
              to begin.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-xs font-bold text-blue-300">
                      {job.job_name}
                    </span>
                    <div>
                      <span className="text-sm font-semibold text-white">
                        {job.job_name}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        Deadline: Slot {job.deadline}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    ₹{job.profit.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Scheduling Runs */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Execution History
            </h3>
            <Link
              to="/results"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>History Log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No scheduling runs executed yet.{' '}
              <Link to="/scheduler" className="text-cyan-400 hover:underline">
                Run greedy algorithm
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {history.slice(0, 5).map((run) => (
                <div
                  key={run.id}
                  onClick={() => navigate('/results')}
                  className="py-3 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-xs font-bold text-emerald-400">
                      #{run.id}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Scheduled {run.scheduled_count} / {run.total_jobs} jobs
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {run.run_at ? new Date(run.run_at).toLocaleTimeString() : 'Recently'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      ₹{run.total_profit.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono">
                      {run.rejected_count} rejected
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
