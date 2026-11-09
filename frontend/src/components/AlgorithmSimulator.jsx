import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sparkles,
  Plus,
  Trash2,
  Code2,
  Clock,
  Cpu,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { InlineMath } from './MathView';

const PSEUDOCODE_LINES = [
  { line: 1, text: "function GreedyJobSequencing(jobs, D):" },
  { line: 2, text: "    sort(jobs, by=profit, order=DESCENDING)  // O(n log n)" },
  { line: 3, text: "    slots = array[1..D] initialized to NULL  // O(D) space" },
  { line: 4, text: "    total_profit = 0, scheduled = []" },
  { line: 5, text: "    for each job in jobs:                    // n iterations" },
  { line: 6, text: "        for t = min(job.deadline, D) down to 1:  // <= D checks" },
  { line: 7, text: "            if slots[t] is NULL then:" },
  { line: 8, text: "                slots[t] = job" },
  { line: 9, text: "                total_profit += job.profit" },
  { line: 10, text: "                scheduled.append(job)" },
  { line: 11, text: "                break" },
  { line: 12, text: "        if job not scheduled then reject(job)" },
  { line: 13, text: "    return (scheduled, total_profit)" },
];

const DEFAULT_SAMPLE_JOBS = [
  { id: 1, job_name: 'J1', deadline: 2, profit: 100 },
  { id: 2, job_name: 'J2', deadline: 1, profit: 19 },
  { id: 3, job_name: 'J3', deadline: 2, profit: 27 },
  { id: 4, job_name: 'J4', deadline: 1, profit: 25 },
  { id: 5, job_name: 'J5', deadline: 3, profit: 15 },
];

export default function AlgorithmSimulator() {
  const [inputJobs, setInputJobs] = useState(DEFAULT_SAMPLE_JOBS);
  const [isEditingJobs, setIsEditingJobs] = useState(false);

  // Simulation execution state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1200); // ms per step
  const timerRef = useRef(null);

  // Form state for adding custom job
  const [newJobName, setNewJobName] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newProfit, setNewProfit] = useState('');

  // Generate trace based on inputJobs
  const trace = useMemo(() => {
    if (!inputJobs || inputJobs.length === 0) return [];
    const steps = [];

    // Step 0: Initial Unsorted
    steps.push({
      stepNumber: 0,
      operation: 'INITIALIZE',
      title: 'Initial Job Pool Discovered',
      description: `Loaded ${inputJobs.length} candidate jobs. Algorithm ready to initialize.`,
      pseudocodeLine: 1,
      currentJob: null,
      currentSlot: null,
      checkedSlot: null,
      sortedJobs: [...inputJobs],
      slots: {},
      scheduled: [],
      rejected: [],
      profitSoFar: 0,
      reason: 'Awaiting sort phase',
    });

    // Step 1: Sort by descending profit
    const sorted = [...inputJobs]
      .filter((j) => Number(j.profit) > 0 && Number(j.deadline) > 0)
      .sort((a, b) => b.profit - a.profit);

    const D = sorted.length > 0 ? Math.max(...sorted.map((j) => Number(j.deadline))) : 1;
    const initialSlots = {};
    for (let t = 1; t <= D; t++) initialSlots[t] = null;

    steps.push({
      stepNumber: 1,
      operation: 'SORT',
      title: 'Jobs Sorted by Descending Profit',
      description: `Jobs sorted in non-increasing profit order O(n log n). Maximum deadline D = ${D}. Slots 1..${D} allocated as empty.`,
      pseudocodeLine: 2,
      currentJob: null,
      currentSlot: null,
      checkedSlot: null,
      sortedJobs: [...sorted],
      slots: { ...initialSlots },
      scheduled: [],
      rejected: [],
      profitSoFar: 0,
      reason: 'Greedy choice: Highest profit jobs evaluated first.',
    });

    // Step iterations
    const currentSlots = { ...initialSlots };
    const scheduled = [];
    const rejected = [];
    let accProfit = 0;
    let stepCount = 2;

    for (let i = 0; i < sorted.length; i++) {
      const job = sorted[i];
      const maxSearch = Math.min(job.deadline, D);
      let assigned = false;

      // Backward slot search steps
      for (let t = maxSearch; t >= 1; t--) {
        if (!currentSlots[t]) {
          currentSlots[t] = job.job_name;
          assigned = true;
          accProfit += Number(job.profit);
          scheduled.push({ ...job, assigned_slot: t });

          steps.push({
            stepNumber: stepCount++,
            operation: 'ASSIGN_SLOT',
            title: `Job ${job.job_name} Scheduled in Slot ${t}`,
            description: `Evaluated latest slot for '${job.job_name}' (deadline: ${job.deadline}). Slot ${t} is available!`,
            pseudocodeLine: 8,
            currentJob: job.job_name,
            currentSlot: t,
            checkedSlot: t,
            sortedJobs: [...sorted],
            slots: { ...currentSlots },
            scheduled: [...scheduled],
            rejected: [...rejected],
            profitSoFar: accProfit,
            reason: `Assigned to latest available free slot ${t} <= deadline ${job.deadline}. Profit increases by ₹${job.profit}.`,
          });
          break;
        } else {
          // Slot was already taken
          steps.push({
            stepNumber: stepCount++,
            operation: 'CHECK_SLOT',
            title: `Checking Slot ${t} for Job ${job.job_name}`,
            description: `Slot ${t} is already occupied by '${currentSlots[t]}'. Searching backwards...`,
            pseudocodeLine: 7,
            currentJob: job.job_name,
            currentSlot: null,
            checkedSlot: t,
            sortedJobs: [...sorted],
            slots: { ...currentSlots },
            scheduled: [...scheduled],
            rejected: [...rejected],
            profitSoFar: accProfit,
            reason: `Slot ${t} is busy with higher-profit job '${currentSlots[t]}'.`,
          });
        }
      }

      if (!assigned) {
        rejected.push(job.job_name);
        steps.push({
          stepNumber: stepCount++,
          operation: 'REJECT_JOB',
          title: `Job ${job.job_name} Rejected`,
          description: `All time slots 1..${maxSearch} are occupied. Cannot finish on or before deadline ${job.deadline}.`,
          pseudocodeLine: 12,
          currentJob: job.job_name,
          currentSlot: null,
          checkedSlot: null,
          sortedJobs: [...sorted],
          slots: { ...currentSlots },
          scheduled: [...scheduled],
          rejected: [...rejected],
          profitSoFar: accProfit,
          reason: `No vacant time slots available on or before deadline ${job.deadline}.`,
        });
      }
    }

    // Final Done step
    steps.push({
      stepNumber: stepCount,
      operation: 'DONE',
      title: 'Greedy Execution Complete',
      description: `Optimal schedule reached! Total profit earned: ₹${accProfit}. Scheduled ${scheduled.length} jobs, rejected ${rejected.length}.`,
      pseudocodeLine: 13,
      currentJob: null,
      currentSlot: null,
      checkedSlot: null,
      sortedJobs: [...sorted],
      slots: { ...currentSlots },
      scheduled: [...scheduled],
      rejected: [...rejected],
      profitSoFar: accProfit,
      reason: 'No further candidate jobs to evaluate.',
    });

    return steps;
  }, [inputJobs]);

  // Handle Play/Pause timer
  useEffect(() => {
    if (isPlaying && trace.length > 0) {
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < trace.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, playSpeed);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentStepIndex, trace, playSpeed]);

  const currentStep = trace[currentStepIndex] || trace[0] || null;

  // Add Custom Job
  const handleAddCustomJob = (e) => {
    e.preventDefault();
    if (!newJobName.trim()) return;
    const d = parseInt(newDeadline, 10);
    const p = parseFloat(newProfit);
    if (isNaN(d) || d <= 0 || isNaN(p) || p <= 0) return;

    const newId = inputJobs.length > 0 ? Math.max(...inputJobs.map((j) => j.id)) + 1 : 1;
    setInputJobs([...inputJobs, { id: newId, job_name: newJobName.trim(), deadline: d, profit: p }]);
    setNewJobName('');
    setNewDeadline('');
    setNewProfit('');
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleRemoveJob = (id) => {
    setInputJobs(inputJobs.filter((j) => j.id !== id));
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  const handleResetToSample = () => {
    setInputJobs(DEFAULT_SAMPLE_JOBS);
    setCurrentStepIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-6">
      {/* Simulator Control Header */}
      <div className="p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Teaching Simulator</span>
            </div>
            <h3 className="text-xl font-extrabold text-white tracking-tight">
              Job Sequencing Algorithm Execution Studio
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Step forward/backward or play automatically to watch discrete time slot allocation with synchronized pseudocode tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditingJobs(!isEditingJobs)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            >
              {isEditingJobs ? 'Hide Job Editor' : 'Customize Jobs'}
            </button>
            <button
              onClick={handleResetToSample}
              className="px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800 rounded-xl transition-all"
            >
              Load Sample Jobs
            </button>
          </div>
        </div>

        {/* Custom Job Editor Tray (Expandable) */}
        {isEditingJobs && (
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Candidate Job Pool ({inputJobs.length} Jobs)
              </h4>
              <span className="text-[11px] text-slate-400">
                Unit duration = 1 slot per job
              </span>
            </div>

            {/* Existing input jobs list */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {inputJobs.map((j) => (
                <div
                  key={j.id}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{j.job_name}</span>
                    <span className="text-[10px] text-amber-300 block font-mono">
                      Slot {j.deadline} • ₹{j.profit}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveJob(j.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Remove job"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Add Form */}
            <form onSubmit={handleAddCustomJob} className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <input
                type="text"
                placeholder="Name (e.g. J6)"
                value={newJobName}
                onChange={(e) => setNewJobName(e.target.value)}
                className="px-3 py-1.5 text-xs text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Deadline (>= 1)"
                min="1"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-28 px-3 py-1.5 text-xs text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Profit (₹)"
                min="1"
                value={newProfit}
                onChange={(e) => setNewProfit(e.target.value)}
                className="w-28 px-3 py-1.5 text-xs text-white bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Candidate</span>
              </button>
            </form>
          </div>
        )}

        {/* Stepper Playback Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-blue-950 text-blue-300 border border-blue-800">
              Step {currentStepIndex + 1} / {trace.length}
            </span>
            <span className="text-xs font-semibold text-white">
              {currentStep ? currentStep.title : 'Ready'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed selector */}
            <select
              value={playSpeed}
              onChange={(e) => setPlaySpeed(Number(e.target.value))}
              className="bg-slate-900 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700"
            >
              <option value={1800}>0.5x Speed</option>
              <option value={1200}>1.0x Speed</option>
              <option value={600}>2.0x Speed</option>
            </select>

            {/* Controls */}
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex(0);
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentStepIndex === 0}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-30"
              title="Previous Step"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-md"
              title={isPlaying ? 'Pause' : 'Play Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentStepIndex((prev) => Math.min(trace.length - 1, prev + 1));
              }}
              disabled={currentStepIndex === trace.length - 1}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-30"
              title="Next Step"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / trace.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Main Simulation Viewport: Visual Time Slots & Pseudocode Tracking */}
      {currentStep && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Visual Time Slot Representation (Section B) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Visual Time Slot Grid */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Discrete Time Slots (<InlineMath math="t = 1 \dots D" />)</span>
                </h4>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Scheduled
                  </span>
                  <span className="flex items-center gap-1 text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> Current
                  </span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-700" /> Empty
                  </span>
                </div>
              </div>

              {/* Slot Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Object.keys(currentStep.slots).map((slotKey) => {
                  const sNum = parseInt(slotKey, 10);
                  const jobName = currentStep.slots[sNum];
                  const isChecked = currentStep.checkedSlot === sNum;
                  const isJustAssigned = currentStep.currentSlot === sNum;

                  let cardStyle = 'bg-slate-950/60 border-slate-800 border-dashed text-slate-500';
                  if (isJustAssigned) {
                    cardStyle = 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 text-white';
                  } else if (isChecked && !jobName) {
                    cardStyle = 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500 text-cyan-300';
                  } else if (jobName) {
                    cardStyle = 'bg-emerald-950/40 border-emerald-600 text-emerald-300';
                  }

                  return (
                    <div
                      key={sNum}
                      className={`p-3.5 rounded-2xl border text-center transition-all duration-300 ${cardStyle}`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                        Slot {sNum}
                      </span>
                      <span className="text-base font-extrabold font-mono mt-1 block">
                        {jobName || 'Empty'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                        [{sNum - 1} → {sNum}]
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Step Explanatory Decision Box (Section A) */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    Algorithmic Decision Log
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Profit Earned: ₹{currentStep.profitSoFar.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentStep.description}
                </p>
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Reason: <strong className="text-slate-200">{currentStep.reason}</strong></span>
                  {currentStep.currentJob && (
                    <span className="font-mono text-cyan-300 font-bold">
                      Target Job: {currentStep.currentJob}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Candidate Evaluation Status Order */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Greedy Evaluation Order (Descending Profit)
              </h4>
              <div className="flex flex-wrap gap-2">
                {currentStep.sortedJobs.map((j) => {
                  const isCurrent = j.job_name === currentStep.currentJob;
                  const isScheduled = currentStep.scheduled.some((s) => s.job_name === j.job_name);
                  const isRejected = currentStep.rejected.includes(j.job_name);

                  let badgeStyle = 'bg-slate-800/80 text-slate-400 border-slate-700';
                  if (isCurrent) {
                    badgeStyle = 'bg-blue-600 text-white font-bold ring-2 ring-blue-400';
                  } else if (isScheduled) {
                    badgeStyle = 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80';
                  } else if (isRejected) {
                    badgeStyle = 'bg-rose-950/70 text-rose-300 border-rose-700/80 line-through';
                  }

                  return (
                    <div
                      key={j.id}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${badgeStyle}`}
                    >
                      {isScheduled && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {isRejected && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
                      <span>{j.job_name}</span>
                      <span className="opacity-75">₹{j.profit} (d={j.deadline})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Synchronized Interactive Pseudocode (Section C) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  Live Synchronized Pseudocode
                </h4>
                <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800">
                  Line {currentStep.pseudocodeLine} Active
                </span>
              </div>

              {/* Code lines with active line highlight */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs overflow-x-auto space-y-1">
                {PSEUDOCODE_LINES.map((item) => {
                  const isActive = currentStep.pseudocodeLine === item.line;
                  return (
                    <div
                      key={item.line}
                      className={`px-2 py-1 rounded transition-colors flex items-center gap-3 ${
                        isActive
                          ? 'bg-blue-600/30 text-white font-bold border-l-2 border-l-blue-400'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[10px] text-slate-600 select-none w-4 text-right">
                        {item.line}
                      </span>
                      <span className="flex-1 whitespace-pre">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Beginner-friendly Complexity Breakdown (Section D) */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                <Cpu className="w-4 h-4 text-amber-400" />
                Complexity Analysis in Plain English
              </h4>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between font-bold text-white mb-1">
                    <span>1. Sorting by Profit:</span>
                    <span className="text-cyan-400 font-mono"><InlineMath math="\mathcal{O}(n \log n)" /></span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Sorts <InlineMath math="n" /> candidate jobs in descending profit order using MergeSort or QuickSort.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between font-bold text-white mb-1">
                    <span>2. Slot Allocation Search:</span>
                    <span className="text-cyan-400 font-mono"><InlineMath math="\mathcal{O}(n \times D)" /></span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    For each of the <InlineMath math="n" /> jobs, we check backwards from its deadline down to slot 1 (up to <InlineMath math="D" /> checks).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex justify-between font-bold text-white mb-1">
                    <span>3. Overall Complexity:</span>
                    <span className="text-emerald-400 font-mono">Time: <InlineMath math="\mathcal{O}(n \log n + nD)" /></span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Auxiliary Space: <strong className="text-white font-mono"><InlineMath math="\mathcal{O}(D + n)" /></strong> for maintaining the slot array of size <InlineMath math="D" /> and the candidate job list.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
