import React, { useState, useEffect } from 'react';
import { Plus, RotateCcw, Sparkles, Check, AlertCircle } from 'lucide-react';
import { InlineMath } from './MathView';

export default function JobForm({ onSubmit, editingJob, onCancelEdit, isSubmitting }) {
  const [formData, setFormData] = useState({
    job_name: '',
    deadline: '',
    profit: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingJob) {
      setFormData({
        job_name: editingJob.job_name,
        deadline: editingJob.deadline.toString(),
        profit: editingJob.profit.toString(),
      });
      setError('');
    } else {
      setFormData({ job_name: '', deadline: '', profit: '' });
    }
  }, [editingJob]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.job_name.trim()) {
      setError('Job name cannot be empty');
      return;
    }
    const deadlineNum = parseInt(formData.deadline, 10);
    if (isNaN(deadlineNum) || deadlineNum <= 0) {
      setError('Deadline must be a positive integer (e.g. 1, 2, 3...)');
      return;
    }
    const profitNum = parseFloat(formData.profit);
    if (isNaN(profitNum) || profitNum <= 0) {
      setError('Profit must be a positive number greater than 0');
      return;
    }

    onSubmit({
      job_name: formData.job_name.trim(),
      deadline: deadlineNum,
      profit: profitNum,
    });
  };

  const handleReset = () => {
    setFormData({ job_name: '', deadline: '', profit: '' });
    setError('');
    if (editingJob && onCancelEdit) {
      onCancelEdit();
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            {editingJob ? (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                Edit Job #{editingJob.id}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 text-blue-400" />
                Add New Job
              </>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Jobs require 1 time unit to execute. Deadline is the maximum finish slot.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs font-medium text-rose-300 bg-rose-950/50 border border-rose-800/60 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Job Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Job Name / Code *
            </label>
            <input
              type="text"
              name="job_name"
              value={formData.job_name}
              onChange={handleChange}
              placeholder="e.g. J1 or Compile"
              className="w-full px-3.5 py-2.5 text-sm text-white bg-slate-800/80 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
              required
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Deadline (Slot <InlineMath math="d_i" />) *
            </label>
            <input
              type="number"
              name="deadline"
              min="1"
              step="1"
              value={formData.deadline}
              onChange={handleChange}
              placeholder="e.g. 2"
              className="w-full px-3.5 py-2.5 text-sm text-white bg-slate-800/80 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
              required
            />
          </div>

          {/* Profit */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Profit Value (₹) *
            </label>
            <input
              type="number"
              name="profit"
              min="0.01"
              step="any"
              value={formData.profit}
              onChange={handleChange}
              placeholder="e.g. 100"
              className="w-full px-3.5 py-2.5 text-sm text-white bg-slate-800/80 border border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-500"
              required
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{editingJob ? 'Cancel Edit' : 'Reset Form'}</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : editingJob ? (
              <>
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Job</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
