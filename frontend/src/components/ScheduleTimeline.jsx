import React from 'react';
import { Clock, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { InlineMath } from './MathView';

export default function ScheduleTimeline({
  scheduledJobs = [],
  rejectedJobs = [],
  timeSlots = {},
  maxDeadline = 0,
  totalProfit = 0,
}) {
  // Compute slot numbers: from 1 to maxDeadline (or derived from slots)
  const slotCount = Math.max(
    maxDeadline || 0,
    Object.keys(timeSlots).length,
    ...scheduledJobs.map((j) => j.assigned_slot || 0)
  );

  const slotsArray = [];
  for (let i = 1; i <= slotCount; i++) {
    const assignedJob = scheduledJobs.find((j) => j.assigned_slot === i);
    slotsArray.push({
      slotNumber: i,
      job: assignedJob || null,
      jobName: assignedJob ? assignedJob.job_name : timeSlots[i] || null,
    });
  }

  return (
    <div className="space-y-6">
      {/* Timeline slots visualizer */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Discrete Time Slot Timeline (<InlineMath math="t = 1 \dots D" />)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each slot executes exactly 1 unit-time task. Total active horizon: {slotCount} time units.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold">Total Profit:</span>
            <span className="text-sm font-extrabold font-mono text-emerald-400">
              ₹{totalProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Slot Grid / Cards */}
        {slotsArray.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            No active time slots. Run the scheduler to allocate jobs.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {slotsArray.map((slot) => {
              const isOccupied = !!slot.job || !!slot.jobName;
              return (
                <div
                  key={slot.slotNumber}
                  className={`relative p-4 rounded-xl border transition-all duration-300 ${
                    isOccupied
                      ? 'bg-gradient-to-b from-blue-950/40 to-slate-900/90 border-blue-500/30 hover:border-blue-500/60 shadow-lg shadow-blue-900/10'
                      : 'bg-slate-950/40 border-slate-800/60 border-dashed opacity-60'
                  }`}
                >
                  {/* Slot header */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      Slot {slot.slotNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      [{slot.slotNumber - 1} → {slot.slotNumber}]
                    </span>
                  </div>

                  {/* Slot content */}
                  {isOccupied ? (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold text-white">
                          {slot.job ? slot.job.job_name : slot.jobName}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>

                      {slot.job && (
                        <div className="space-y-1 pt-1 border-t border-slate-800 text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Deadline:</span>
                            <span className="font-semibold text-amber-300 font-mono">
                              Slot {slot.job.deadline}
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Profit:</span>
                            <span className="font-bold text-emerald-400 font-mono">
                              ₹{slot.job.profit}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <span className="text-xs text-slate-400 font-medium">Idle / Empty Slot</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rejected Jobs Panel */}
      {rejectedJobs && rejectedJobs.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-800/40 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-rose-900/40 text-rose-300">
            <XCircle className="w-4 h-4 text-rose-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider">
              Rejected Jobs ({rejectedJobs.length})
            </h4>
          </div>
          <p className="text-xs text-rose-200/70 mb-3">
            These jobs could not be assigned because all compatible slots before their deadlines were occupied by higher-profit tasks.
          </p>
          <div className="flex flex-wrap gap-2">
            {rejectedJobs.map((name, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-rose-900/40 text-rose-200 border border-rose-700/60"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                {name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
