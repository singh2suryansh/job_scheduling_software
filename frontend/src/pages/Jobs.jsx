import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Trash2,
  FileDown,
  Layers,
  PlusCircle,
} from 'lucide-react';
import JobForm from '../components/JobForm';
import JobTable from '../components/JobTable';
import BulkJobModal from '../components/BulkJobModal';
import {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  seedSampleJobs,
  exportJobsToCSV,
} from '../services/api';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(data || []);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleCreateOrUpdateJob = async (jobData) => {
    try {
      setIsSubmitting(true);
      if (editingJob) {
        await updateJob(editingJob.id, jobData);
        showNotification('success', `Job '${jobData.job_name}' updated successfully.`);
        setEditingJob(null);
      } else {
        await createJob(jobData);
        showNotification('success', `Job '${jobData.job_name}' created successfully.`);
      }
      await fetchJobs();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId, jobName) => {
    if (!window.confirm(`Are you sure you want to delete job '${jobName}'?`)) {
      return;
    }
    try {
      await deleteJob(jobId);
      showNotification('success', `Job '${jobName}' deleted successfully.`);
      if (editingJob && editingJob.id === jobId) {
        setEditingJob(null);
      }
      await fetchJobs();
    } catch (err) {
      showNotification('error', err.message);
    }
  };

  const handleSeedPresets = async () => {
    try {
      setIsSubmitting(true);
      const res = await seedSampleJobs(false);
      showNotification('success', res.message || 'Sample textbook jobs loaded successfully.');
      await fetchJobs();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearAllJobs = async () => {
    if (jobs.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to delete all ${jobs.length} jobs? This will reset the job pool.`
      )
    ) {
      return;
    }
    try {
      setIsSubmitting(true);
      for (const job of jobs) {
        await deleteJob(job.id);
      }
      showNotification('success', 'All jobs cleared successfully.');
      setEditingJob(null);
      await fetchJobs();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (jobs.length === 0) {
      showNotification('error', 'No jobs available to export.');
      return;
    }
    exportJobsToCSV(jobs);
    showNotification('success', `Exported ${jobs.length} jobs to CSV.`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-400" />
            Job Catalog & Configuration
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Maintain the input set of candidate jobs with deadlines and profits.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/80 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Bulk Add / Import</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={jobs.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSeedPresets}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Textbook Example</span>
          </button>

          {jobs.length > 0 && (
            <button
              onClick={handleClearAllJobs}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 border border-rose-800/60 rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Pool</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating alert notifications */}
      {notification && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl border text-xs sm:text-sm font-medium animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800 text-rose-300'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Add / Edit Form */}
      <JobForm
        onSubmit={handleCreateOrUpdateJob}
        editingJob={editingJob}
        onCancelEdit={() => setEditingJob(null)}
        isSubmitting={isSubmitting}
      />

      {/* Jobs Table */}
      <JobTable
        jobs={jobs}
        onEdit={(job) => {
          setEditingJob(job);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDelete={handleDeleteJob}
        onSeedPresets={handleSeedPresets}
        isLoading={loading}
      />

      {/* Bulk Job Addition Modal */}
      <BulkJobModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={(count) => {
          setIsBulkModalOpen(false);
          showNotification('success', `Successfully created ${count} jobs.`);
          fetchJobs();
        }}
      />
    </div>
  );
}
