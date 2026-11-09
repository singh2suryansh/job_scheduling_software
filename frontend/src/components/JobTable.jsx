import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  Edit2,
  Trash2,
  Clock,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function JobTable({
  jobs = [],
  onEdit,
  onDelete,
  onSeedPresets,
  isLoading,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('profit');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedJobs = useMemo(() => {
    let result = jobs.filter((job) =>
      job.job_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [jobs, searchTerm, sortField, sortDirection]);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-xl">
      {/* Header and Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search jobs by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm text-white bg-slate-800/80 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {onSeedPresets && jobs.length === 0 && (
            <button
              onClick={onSeedPresets}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-xl transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Textbook ADA Preset</span>
            </button>
          )}

          <div className="text-xs font-medium text-slate-400 px-3 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
            Total: <span className="font-bold text-white font-mono">{filteredAndSortedJobs.length}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th
                onClick={() => handleSort('id')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Job ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('job_name')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Job Name</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('deadline')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Deadline (Slot)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('profit')}
                className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3 text-emerald-400" />
                  <span>Profit</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 hidden md:table-cell">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Created Date</span>
                </div>
              </th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70 text-sm">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span>Loading jobs from database...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedJobs.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                      <Layers className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">
                      {searchTerm ? 'No jobs match your search' : 'No jobs in database yet'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {searchTerm
                        ? 'Try clearing the search input above.'
                        : 'Add your first job using the form above or load our textbook ADA example set.'}
                    </p>
                    {onSeedPresets && !searchTerm && (
                      <button
                        onClick={onSeedPresets}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Insert 5 Textbook Jobs</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedJobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-400">
                    #{job.id}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {job.job_name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-800/50 font-mono">
                      Slot {job.deadline}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                    ₹{job.profit.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400 font-mono hidden md:table-cell">
                    {job.created_at ? new Date(job.created_at).toLocaleDateString() : 'Just now'}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEdit(job)}
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Job"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(job.id, job.job_name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
