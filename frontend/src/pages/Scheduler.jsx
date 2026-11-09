import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cpu,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Pause,
  SkipForward,
  FastForward,
  Filter,
  CheckSquare,
  Square,
  PieChart,
} from 'lucide-react';
import { getJobs, runSchedule } from '../services/api';
import ScheduleTimeline from '../components/ScheduleTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfitContributionSection from '../components/ProfitContributionSection';
import { InlineMath, MathText } from '../components/MathView';

export default function Scheduler() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Scheduling Mode: ALL vs BATCH
  const [mode, setMode] = useState('ALL');
  const [selectedJobIds, setSelectedJobIds] = useState(new Set());

  // Stepper / Visualization state
  const [visualSteps, setVisualSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  // Fetch candidate jobs on mount
  const fetchCandidateJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getJobs();
      const jobList = data || [];
      setJobs(jobList);
      // Default all selected for batch mode
      setSelectedJobIds(new Set(jobList.map((j) => j.id)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateJobs();
  }, []);

  const toggleSelectJob = (id) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedJobIds(new Set(jobs.map((j) => j.id)));
  };

  const handleDeselectAll = () => {
    setSelectedJobIds(new Set());
  };

  // Determine jobs to consider
  const candidateJobs = mode === 'ALL'
    ? jobs
    : jobs.filter((j) => selectedJobIds.has(j.id));

  // Compute step-by-step trace of greedy algorithm for animated visualization
  const generateExecutionTrace = (inputJobs) => {
    const trace = [];

    trace.push({
      title: 'Initial Job Pool',
      description: `Discovered ${inputJobs.length} candidate jobs ready for scheduling consideration.`,
      highlightedJob: null,
      sortedJobs: [...inputJobs],
      slots: {},
      scheduled: [],
      rejected: [],
      profitSoFar: 0,
      phase: 'INIT',
    });

    const sorted = [...inputJobs].sort((a, b) => b.profit - a.profit);
    const maxDeadline = Math.max(...sorted.map((j) => j.deadline), 1);
    const slots = {};
    for (let i = 1; i <= maxDeadline; i++) slots[i] = null;

    trace.push({
      title: 'Greedy Sorting Phase',
      description: `Jobs sorted in descending order of profit (O(n log n)). Highest-profit jobs take precedence.`,
      highlightedJob: null,
      sortedJobs: [...sorted],
      slots: { ...slots },
      scheduled: [],
      rejected: [],
      profitSoFar: 0,
      phase: 'SORTED',
    });

    const scheduled = [];
    const rejected = [];
    let currentProfit = 0;

    for (let idx = 0; idx < sorted.length; idx++) {
      const job = sorted[idx];
      let assignedSlot = null;

      const startSlot = Math.min(job.deadline, maxDeadline);
      for (let t = startSlot; t >= 1; t--) {
        if (!slots[t]) {
          slots[t] = job.job_name;
          assignedSlot = t;
          break;
        }
      }

      if (assignedSlot !== null) {
        currentProfit += job.profit;
        scheduled.push({
          job_id: job.id,
          job_name: job.job_name,
          deadline: job.deadline,
          profit: job.profit,
          assigned_slot: assignedSlot,
        });

        trace.push({
          title: `Assigning Job: ${job.job_name}`,
          description: `Examined slots for '${job.job_name}' (deadline: ${job.deadline}, profit: ₹${job.profit}). Latest free slot found at Slot ${assignedSlot}. Assigned!`,
          highlightedJob: job.job_name,
          currentSlotChecked: assignedSlot,
          sortedJobs: [...sorted],
          slots: { ...slots },
          scheduled: [...scheduled],
          rejected: [...rejected],
          profitSoFar: currentProfit,
          phase: 'ASSIGNED',
        });
      } else {
        rejected.push(job.job_name);
        trace.push({
          title: `Rejecting Job: ${job.job_name}`,
          description: `All slots 1 to ${startSlot} are already occupied by higher-profit jobs. '${job.job_name}' is rejected.`,
          highlightedJob: job.job_name,
          currentSlotChecked: null,
          sortedJobs: [...sorted],
          slots: { ...slots },
          scheduled: [...scheduled],
          rejected: [...rejected],
          profitSoFar: currentProfit,
          phase: 'REJECTED',
        });
      }
    }

    trace.push({
      title: 'Scheduling Finalized',
      description: `Algorithm complete. Total Profit: ₹${currentProfit}. Scheduled ${scheduled.length} jobs, rejected ${rejected.length}.`,
      highlightedJob: null,
      sortedJobs: [...sorted],
      slots: { ...slots },
      scheduled: [...scheduled],
      rejected: [...rejected],
      profitSoFar: currentProfit,
      phase: 'DONE',
    });

    return trace;
  };

  const handleRunGreedyAlgorithm = async () => {
    if (candidateJobs.length === 0) {
      setError(
        mode === 'BATCH'
          ? 'Please select at least one job in the batch.'
          : 'Please add jobs first before running the scheduler.'
      );
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);
      setIsPlaying(false);

      const requestPayload = {
        mode,
        job_ids: mode === 'BATCH' ? Array.from(selectedJobIds) : undefined,
      };

      const apiData = await runSchedule(requestPayload);
      setResult(apiData);

      // Build execution trace for visual playback
      const trace = generateExecutionTrace(candidateJobs);
      setVisualSteps(trace);
      setCurrentStepIndex(trace.length - 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  // Playback handlers
  useEffect(() => {
    if (isPlaying && visualSteps.length > 0) {
      playTimerRef.current = setTimeout(() => {
        if (currentStepIndex < visualSteps.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 1200);
    }
    return () => clearTimeout(playTimerRef.current);
  }, [isPlaying, currentStepIndex, visualSteps]);

  const maxDeadline = candidateJobs.length > 0 ? Math.max(...candidateJobs.map((j) => j.deadline)) : 0;
  const currentStep = visualSteps[currentStepIndex];

  if (loading) {
    return <LoadingSpinner message="Loading candidate jobs from database..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Algorithmic Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-cyan-400 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core ADA Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Job Sequencing with Deadlines (Greedy)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Greedy heuristic: Sort all candidate jobs by descending profit. For each job, find the latest available free time slot <InlineMath math="t \le d_i" />. If found, allocate slot <InlineMath math="t" />; otherwise reject.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleRunGreedyAlgorithm}
              disabled={isExecuting || candidateJobs.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-2xl shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isExecuting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Computing Schedule...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-5 h-5" />
                  <span>RUN GREEDY ALGORITHM</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Scheduling Scope:
            </span>
            <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => setMode('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'ALL'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All Active Jobs ({jobs.length})
              </button>
              <button
                type="button"
                onClick={() => setMode('BATCH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  mode === 'BATCH'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Selected Batch ({selectedJobIds.size}/{jobs.length})
              </button>
            </div>
          </div>

          {mode === 'BATCH' && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              >
                Select All
              </button>
              <button
                onClick={handleDeselectAll}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Batch Job Selection Cards (if in Batch mode) */}
        {mode === 'BATCH' && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-400 block">
              Choose jobs to include in this scheduling run:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto pr-1">
              {jobs.map((job) => {
                const isSelected = selectedJobIds.has(job.id);
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => toggleSelectJob(job.id)}
                    className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold truncate">{job.job_name}</div>
                      <div className="text-[10px] text-slate-400">
                        ₹{job.profit} • d={job.deadline}
                      </div>
                    </div>
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Algorithm Meta Stats Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Candidate Jobs</span>
            <span className="text-lg font-bold text-white font-mono">
              {candidateJobs.length}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Maximum Deadline (D)</span>
            <span className="text-lg font-bold text-amber-300 font-mono">
              {maxDeadline} slots
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Time Complexity</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">
              <InlineMath math="\mathcal{O}(n \log n + nD)" />
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">Space Complexity</span>
            <span className="text-sm font-bold text-cyan-400 font-mono">
              <InlineMath math="\mathcal{O}(D + n)" />
            </span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Step-by-Step Visualization Playback Console */}
      {visualSteps.length > 0 && currentStep && (
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-blue-950 border border-blue-800 text-blue-400">
                  Step {currentStepIndex + 1} of {visualSteps.length}
                </span>
                <h3 className="text-base font-bold text-white">
                  {currentStep.title}
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {currentStep.description}
              </p>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                onClick={() => setCurrentStepIndex(0)}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Reset to beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentStepIndex === 0}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous Step"
              >
                <RotateCcw className="w-4 h-4 -scale-x-100" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/30"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Play
                  </>
                )}
              </button>
              <button
                onClick={() =>
                  setCurrentStepIndex((prev) =>
                    Math.min(visualSteps.length - 1, prev + 1)
                  )
                }
                disabled={currentStepIndex === visualSteps.length - 1}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next Step"
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentStepIndex(visualSteps.length - 1)}
                disabled={currentStepIndex === visualSteps.length - 1}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Fast Forward to End"
              >
                <FastForward className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Step Progress Bar */}
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
              style={{
                width: `${((currentStepIndex + 1) / visualSteps.length) * 100}%`,
              }}
            />
          </div>

          {/* Stepper Viewport */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Sorted Candidate Queue */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Profit-Sorted Evaluation Queue
              </span>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {currentStep.sortedJobs.map((job) => {
                  const isCurrent = currentStep.highlightedJob === job.job_name;
                  const isScheduled = currentStep.scheduled.some(
                    (s) => s.job_name === job.job_name
                  );
                  const isRejected = currentStep.rejected.includes(job.job_name);

                  return (
                    <div
                      key={job.id || job.job_name}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-all ${
                        isCurrent
                          ? 'bg-blue-600/30 border border-blue-500 font-bold text-white'
                          : isScheduled
                          ? 'bg-emerald-950/30 border border-emerald-800/40 text-emerald-300'
                          : isRejected
                          ? 'bg-rose-950/30 border border-rose-800/40 text-rose-300 line-through'
                          : 'bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <span>{job.job_name}</span>
                      <span>₹{job.profit} (d={job.deadline})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Step Timeline State */}
            <div className="md:col-span-2 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Discrete Slot Allocation Status
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.keys(currentStep.slots).map((slotKey) => {
                  const jobName = currentStep.slots[slotKey];
                  const isCurrentlyAssigned = currentStep.currentSlotChecked === parseInt(slotKey, 10);

                  return (
                    <div
                      key={slotKey}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isCurrentlyAssigned
                          ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-500'
                          : jobName
                          ? 'bg-emerald-950/40 border-emerald-700/60'
                          : 'bg-slate-900/60 border-slate-800/80 border-dashed'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Slot {slotKey}
                      </span>
                      <span
                        className={`text-sm font-extrabold mt-1 block font-mono ${
                          jobName ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {jobName || 'Empty'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Cumulative Earned Profit:</span>
                <span className="font-extrabold font-mono text-emerald-400 text-sm">
                  ₹{currentStep.profitSoFar.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Timeline Component when result is available */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Official Backend Scheduling Result ({result.scheduling_mode || 'ALL'} Mode)
            </h3>
            <button
              onClick={() => navigate('/results')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <span>View In Results Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <ScheduleTimeline
            scheduledJobs={result.scheduled_jobs}
            rejectedJobs={result.rejected_jobs}
            timeSlots={result.time_slots || {}}
            maxDeadline={result.max_deadline}
            totalProfit={result.total_profit}
          />

          {/* Profit Contribution Section */}
          <ProfitContributionSection
            scheduledJobs={result.scheduled_jobs || []}
            rejectedJobs={result.rejected_details || result.rejected_jobs || []}
            totalProfit={result.total_profit || 0}
          />
        </div>
      )}
    </div>
  );
}
