import React from 'react';
import {
  BookOpen,
  Cpu,
  Clock,
  Sparkles,
  Layers,
  AlertTriangle,
  Code2,
  CheckCircle2,
  Activity,
  Flame,
} from 'lucide-react';
import { InlineMath, BlockMath, MathText } from '../components/MathView';
import AlgorithmSimulator from '../components/AlgorithmSimulator';

export default function Algorithm() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Hero Title */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-cyan-400 border border-blue-500/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ADA Theoretical Foundation</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Job Sequencing with Deadlines (Greedy Algorithm)
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          An in-depth algorithmic analysis of the classic single-processor scheduling problem designed to maximize cumulative profit subject to deadline constraints.
        </p>
      </div>

      {/* Problem Definition & Crucial Assumptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            Problem Definition & Objective Function
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            We are given a set of <InlineMath math="n" /> jobs, where each job <InlineMath math="i" /> is characterized by a deadline <InlineMath math="d_i \ge 1" /> and a profit <InlineMath math="p_i > 0" />.
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            A job earns its profit <InlineMath math="p_i" /> if and only if it is completed on or before its deadline <InlineMath math="d_i" />. The objective is to select a subset of jobs <InlineMath math="S \subseteq \{1, 2, \dots, n\}" /> to maximize cumulative profit:
          </p>
          <div className="py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
            <BlockMath math="\max \sum_{i \in S} p_i \quad \text{subject to} \quad \forall i \in S,\, \text{slot}(i) \le d_i \;\land\; \text{slot}(i) \neq \text{slot}(j) \;(i \neq j)" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-800/40 shadow-xl backdrop-blur-xl space-y-3">
          <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Core Mathematical Assumptions
          </h3>
          <ul className="text-xs sm:text-sm text-amber-200/80 space-y-2 list-disc pl-4">
            <li>
              <strong className="text-white">Unit Time Duration:</strong> Every job takes exactly <strong>1 discrete time slot</strong> to execute (<InlineMath math="t = 1" />).
            </li>
            <li>
              <strong className="text-white">Single Processor:</strong> Only one job can execute during any discrete time slot <InlineMath math="[t-1, t]" />.
            </li>
            <li>
              <strong className="text-white">Scope Limitation:</strong> This algorithm does <em>not</em> solve arbitrary-duration or variable-length scheduling (which is NP-hard and requires different heuristics).
            </li>
          </ul>
        </div>
      </div>

      {/* Greedy Choice Strategy & Steps */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Greedy Choice Strategy
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
            To maximize profit, jobs offering higher profits should be favored over jobs with lower profits. Furthermore, each chosen job should be assigned to the <strong>latest possible available slot</strong> before its deadline, preserving earlier slots for jobs with tighter deadlines.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Sort by Profit */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-blue-500/40 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-xs font-bold text-blue-400">
              1
            </div>
            <h4 className="text-sm font-bold text-white">Sort by Profit</h4>
            <div className="text-xs text-slate-300 leading-relaxed">
              Sort all <InlineMath math="n" /> jobs in non-increasing order of profit: <InlineMath math="p_1 \ge p_2 \ge \dots \ge p_n" />.
            </div>
          </div>

          {/* Card 2: Determine Horizon */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-indigo-500/40 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-xs font-bold text-indigo-400">
              2
            </div>
            <h4 className="text-sm font-bold text-white">Determine Horizon</h4>
            <div className="text-xs text-slate-300 leading-relaxed">
              Find maximum deadline <InlineMath math="D = \max(d_i)" /> and allocate discrete time slot array of size <InlineMath math="D" />.
            </div>
          </div>

          {/* Card 3: Latest-Slot Search */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-xs font-bold text-cyan-400">
              3
            </div>
            <h4 className="text-sm font-bold text-white">Latest-Slot Search</h4>
            <div className="text-xs text-slate-300 leading-relaxed">
              For job <InlineMath math="i" />, check slots backwards from <InlineMath math="\min(d_i, D)" /> down to 1. Assign to the first empty slot found.
            </div>
          </div>
        </div>

        {/* Algorithm Pseudocode */}
        <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              greedy_job_sequencing.py
            </span>
            <span>Python / ADA</span>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`def schedule_jobs_greedy(jobs):
    # Step 1: Sort jobs descending by profit
    jobs.sort(key=lambda j: j.profit, reverse=True)
    
    # Step 2: Initialize time slots array
    D = max(job.deadline for job in jobs)
    slots = [None] * (D + 1)  # 1-indexed slots 1..D
    
    scheduled_jobs = []
    total_profit = 0
    
    # Step 3: Iterate jobs in greedy order
    for job in jobs:
        # Search backwards from min(deadline, D) down to 1
        for t in range(min(job.deadline, D), 0, -1):
            if slots[t] is None:
                slots[t] = job
                scheduled_jobs.append(job)
                total_profit += job.profit
                break
                
    return scheduled_jobs, total_profit`}
          </pre>
        </div>
      </div>

      {/* Interactive Algorithm Simulator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-extrabold text-white">
              Interactive Stepper & Visual Simulator
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Synchronized execution trace with code line pointer
          </span>
        </div>
        <AlgorithmSimulator />
      </div>

      {/* Complexity Analysis */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          Asymptotic Complexity Analysis
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Time Complexity
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-800">
                <InlineMath math="\mathcal{O}(n \log n + nD)" />
              </span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
              <li>
                <strong>Sorting phase:</strong>{' '}
                Sorting <InlineMath math="n" /> jobs by profit takes <InlineMath math="\mathcal{O}(n \log n)" /> time.
              </li>
              <li>
                <strong>Slot search phase:</strong>{' '}
                For each of the <InlineMath math="n" /> jobs, checking backwards for an open slot takes up to <InlineMath math="\min(d_i, D) \le D" /> checks, taking <InlineMath math="\mathcal{O}(n \cdot D)" /> time.
              </li>
              <li>
                <strong>Total Time:</strong>{' '}
                <InlineMath math="\mathcal{O}(n \log n + nD)" />. (Can be optimized to <InlineMath math="\mathcal{O}(n \log D)" /> using Disjoint Set Union / DSU).
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Space Complexity
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-bold font-mono bg-indigo-950/60 text-indigo-300 border border-indigo-800">
                <InlineMath math="\mathcal{O}(D + n)" />
              </span>
            </div>
            <ul className="text-xs text-slate-300 space-y-2 list-disc pl-4">
              <li>
                <strong>Slot Array:</strong>{' '}
                Maintaining occupancy for time slots <InlineMath math="1 \dots D" /> takes <InlineMath math="\mathcal{O}(D)" /> space.
              </li>
              <li>
                <strong>Candidate / Result Storage:</strong>{' '}
                Storing the sorted jobs and scheduled result subsets takes <InlineMath math="\mathcal{O}(n)" /> space.
              </li>
              <li>
                <strong>Total Auxiliary Space:</strong>{' '}
                <InlineMath math="\mathcal{O}(D + n)" />.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Textbook Walkthrough Example */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl space-y-5">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          Textbook Walkthrough Example
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Job</th>
                <th className="py-2.5 px-3">Deadline</th>
                <th className="py-2.5 px-3">Profit</th>
                <th className="py-2.5 px-3">Action Taken</th>
                <th className="py-2.5 px-3">Assigned Slot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-bold text-white">J1</td>
                <td className="py-2.5 px-3 text-amber-300">2</td>
                <td className="py-2.5 px-3 text-emerald-400">₹100</td>
                <td className="py-2.5 px-3 text-slate-300 font-sans">Highest profit. Free slot at 2.</td>
                <td className="py-2.5 px-3 text-cyan-300 font-bold">Slot 2</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-bold text-white">J3</td>
                <td className="py-2.5 px-3 text-amber-300">2</td>
                <td className="py-2.5 px-3 text-emerald-400">₹27</td>
                <td className="py-2.5 px-3 text-slate-300 font-sans">Slot 2 is full. Assigned to slot 1.</td>
                <td className="py-2.5 px-3 text-cyan-300 font-bold">Slot 1</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-bold text-white">J4</td>
                <td className="py-2.5 px-3 text-amber-300">1</td>
                <td className="py-2.5 px-3 text-emerald-400">₹25</td>
                <td className="py-2.5 px-3 text-rose-400 font-sans">Slot 1 occupied. Rejected.</td>
                <td className="py-2.5 px-3 text-rose-400">Rejected</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-bold text-white">J2</td>
                <td className="py-2.5 px-3 text-amber-300">1</td>
                <td className="py-2.5 px-3 text-emerald-400">₹19</td>
                <td className="py-2.5 px-3 text-rose-400 font-sans">Slot 1 occupied. Rejected.</td>
                <td className="py-2.5 px-3 text-rose-400">Rejected</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-bold text-white">J5</td>
                <td className="py-2.5 px-3 text-amber-300">3</td>
                <td className="py-2.5 px-3 text-emerald-400">₹15</td>
                <td className="py-2.5 px-3 text-slate-300 font-sans">Slot 3 is free. Assigned!</td>
                <td className="py-2.5 px-3 text-cyan-300 font-bold">Slot 3</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between text-xs sm:text-sm">
          <span className="text-emerald-300 font-medium">
            Optimal Schedule: <strong>[Slot 1: J3, Slot 2: J1, Slot 3: J5]</strong>
          </span>
          <span className="font-extrabold font-mono text-emerald-400 text-base">
            Total Profit: ₹142
          </span>
        </div>
      </div>
    </div>
  );
}
