import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Layers,
  ChevronDown,
  AlertCircle,
  GitCompare,
  PieChart,
  Sparkles,
} from 'lucide-react';
import { getScheduleHistory, getScheduleRun } from '../services/api';
import ScheduleTimeline from '../components/ScheduleTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfitContributionSection from '../components/ProfitContributionSection';
import RunComparisonModal from '../components/RunComparisonModal';

export default function Results() {
  const [history, setHistory] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState(null);
  const [runDetail, setRunDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);

  // Run Comparison Modal state
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [selectedCompareRunIds, setSelectedCompareRunIds] = useState([]);

  // Load history list
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getScheduleHistory();
      setHistory(data || []);
      if (data && data.length > 0) {
        setSelectedRunId(data[0].id);
        // Pre-select the latest 2 runs for comparison if available
        if (data.length >= 2) {
          setSelectedCompareRunIds([data[0].id, data[1].id]);
        } else {
          setSelectedCompareRunIds([data[0].id]);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // When selectedRunId changes, fetch detailed run info
  useEffect(() => {
    if (!selectedRunId) return;

    const fetchRunDetails = async () => {
      try {
        setDetailLoading(true);
        const detail = await getScheduleRun(selectedRunId);
        setRunDetail(detail);
      } catch (err) {
        setError(err.message);
      } finally {
        setDetailLoading(false);
      }
    };

    fetchRunDetails();
  }, [selectedRunId]);

  if (loading) {
    return <LoadingSpinner message="Fetching scheduling results and execution history..." />;
  }

  // Parse details
  const scheduledResults = runDetail?.results?.filter((r) => r.status === 'SCHEDULED') || [];
  const rejectedResults = runDetail?.results?.filter((r) => r.status === 'REJECTED') || [];
  const efficiency = runDetail && runDetail.total_jobs > 0
    ? Math.round((runDetail.scheduled_count / runDetail.total_jobs) * 100)
    : 0;

  // Build timeline props
  const timeSlotsMap = {};
  scheduledResults.forEach((r) => {
    if (r.assigned_slot) {
      timeSlotsMap[r.assigned_slot] = r.job_name;
    }
  });

  const toggleCompareRunId = (runId) => {
    setSelectedCompareRunIds((prev) => {
      if (prev.includes(runId)) {
        return prev.filter((id) => id !== runId);
      } else {
        return [...prev, runId];
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Run Selector and Compare Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Scheduling Audit & Timeline Results
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Snapshot-isolated audit of past algorithm executions, rejection diagnostics, and efficiency metrics.
          </p>
        </div>

        {/* Action Buttons & Dropdown */}
        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <GitCompare className="w-4 h-4" />
              <span>Compare Runs ({selectedCompareRunIds.length})</span>
            </button>

            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400 shrink-0" />
              <div className="relative">
                <select
                  value={selectedRunId || ''}
                  onChange={(e) => setSelectedRunId(Number(e.target.value))}
                  className="appearance-none bg-slate-800/90 text-white text-xs font-semibold py-2.5 pl-3.5 pr-8 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {history.map((run) => (
                    <option key={run.id} value={run.id}>
                      Run #{run.id} [{run.scheduling_mode || 'ALL'}] — Profit: ₹{run.total_profit} ({new Date(run.run_at).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {history.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-slate-900/50 border border-slate-800 p-8">
          <Clock className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-300">No Scheduling Runs Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You haven't executed the greedy scheduler yet. Head over to the Scheduler tab and click "RUN GREEDY ALGORITHM".
          </p>
        </div>
      ) : detailLoading ? (
        <LoadingSpinner message="Loading run allocation details..." />
      ) : runDetail ? (
        <div className="space-y-6">
          {/* Metrics summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Total Profit Earned
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                ₹{runDetail.total_profit.toLocaleString()}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Scheduling Efficiency
              </span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-1 block">
                {efficiency}%
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Assigned Slots ({runDetail.scheduling_mode || 'ALL'})
              </span>
              <span className="text-2xl font-black text-blue-400 font-mono mt-1 block">
                {runDetail.scheduled_count} / {runDetail.total_jobs}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Rejected Tasks
              </span>
              <span className="text-2xl font-black text-rose-400 font-mono mt-1 block">
                {runDetail.rejected_count}
              </span>
            </div>
          </div>

          {/* Interactive Timeline Visualizer */}
          <ScheduleTimeline
            scheduledJobs={scheduledResults}
            rejectedJobs={rejectedResults.map((r) => r.job_name)}
            timeSlots={timeSlotsMap}
            maxDeadline={runDetail.max_deadline}
            totalProfit={runDetail.total_profit}
          />

          {/* Profit Contribution Analysis Section */}
          <ProfitContributionSection
            scheduledJobs={scheduledResults}
            rejectedJobs={rejectedResults}
            totalProfit={runDetail.total_profit}
          />

          {/* Detailed tabular breakdown of all examined jobs */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Job-by-Job Execution Diagnostics (Run #{runDetail.id})</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Executed: {new Date(runDetail.run_at).toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Job Name</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-4">Profit</th>
                    <th className="py-3 px-4">Assigned Slot</th>
                    <th className="py-3 px-4">Profit Share</th>
                    <th className="py-3 px-4">Status & Diagnostic Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-sm">
                  {runDetail.results.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-semibold text-white">
                        {res.job_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-300">
                        Slot {res.deadline}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ₹{res.profit}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {res.assigned_slot ? `Slot ${res.assigned_slot}` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-300 text-xs">
                        {res.profit_contribution !== null && res.profit_contribution !== undefined
                          ? `${res.profit_contribution}%`
                          : res.status === 'SCHEDULED' && runDetail.total_profit > 0
                          ? `${((res.profit / runDetail.total_profit) * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                              res.status === 'SCHEDULED'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                : 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                            }`}
                          >
                            {res.status === 'SCHEDULED' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {res.status}
                          </span>
                          {res.rejection_reason && (
                            <span className="text-[11px] text-rose-300/80">
                              {res.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {/* Run Comparison Modal */}
      <RunComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        availableRuns={history}
        initialSelectedIds={selectedCompareRunIds}
      />
    </div>
  );
}
