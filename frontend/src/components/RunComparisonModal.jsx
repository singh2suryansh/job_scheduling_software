import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { compareRuns } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

export default function RunComparisonModal({ runIds = [], onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!runIds || runIds.length === 0) return;

    const fetchComparison = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await compareRuns(runIds);
        setData(res);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [runIds]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-400" />
              Scheduling Run Comparison ({runIds.length} Runs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side performance audit across independent scheduling batches and historical runs.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Aggregating comparative run data..." />
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        ) : data && data.runs ? (
          <div className="space-y-6">
            {/* Visual Profit & Acceptance Chart */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Profit & Task Yield Comparison
              </h4>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.comparison_chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="run_label" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="total_profit" name="Total Profit (₹)" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="scheduled" name="Scheduled Jobs" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="rejected" name="Rejected Jobs" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Run Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.runs.map((r) => (
                <div
                  key={r.run_id}
                  className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-white text-sm">Run #{r.run_id}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950 border border-blue-800 text-blue-300">
                      {r.scheduling_mode}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Total Profit:</span>
                      <strong className="text-emerald-400 font-mono text-sm">
                        ₹{r.total_profit.toLocaleString()}
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Acceptance Rate:</span>
                      <strong className="text-cyan-300 font-mono">
                        {r.acceptance_rate}%
                      </strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Jobs (Sched / Rej):</span>
                      <span className="font-mono">
                        <span className="text-emerald-400 font-bold">{r.scheduled_count}</span>
                        {' / '}
                        <span className="text-rose-400 font-bold">{r.rejected_count}</span>
                        {' of '}{r.total_jobs}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Avg Profit / Sched:</span>
                      <span className="font-mono text-slate-200">
                        ₹{r.avg_profit_per_scheduled_job.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                      Scheduled Output Snapshot:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.scheduled_job_names && r.scheduled_job_names.length > 0 ? (
                        r.scheduled_job_names.map((name, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                          >
                            {name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">None</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
