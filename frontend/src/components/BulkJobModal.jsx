import React, { useState } from 'react';
import {
  X,
  Upload,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { bulkCreateJobs, parseCSVToJobs } from '../services/api';

const DEFAULT_ROWS = [
  { job_name: '', deadline: '', profit: '' },
  { job_name: '', deadline: '', profit: '' },
  { job_name: '', deadline: '', profit: '' },
];

export default function BulkJobModal({ isOpen, onClose, onSuccess }) {
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [csvInput, setCsvInput] = useState('');
  const [activeTab, setActiveTab] = useState('table'); // 'table' or 'csv'

  if (!isOpen) return null;

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  const handleAddRow = () => {
    setRows([...rows, { job_name: '', deadline: '', profit: '' }]);
  };

  const handleRemoveRow = (index) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleCSVImport = () => {
    if (!csvInput.trim()) return;
    const parsed = parseCSVToJobs(csvInput);
    if (parsed.length === 0) {
      setError('Could not parse any valid jobs from the provided CSV text. Ensure header has Name, Deadline, Profit.');
      return;
    }
    setRows(parsed);
    setActiveTab('table');
    setError(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const parsed = parseCSVToJobs(content);
        if (parsed.length > 0) {
          setRows(parsed);
          setActiveTab('table');
          setError(null);
        } else {
          setError('Failed to extract valid jobs from CSV file.');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Filter valid rows
    const valid = rows
      .map((r) => ({
        job_name: String(r.job_name || '').trim(),
        deadline: parseInt(r.deadline, 10),
        profit: parseFloat(r.profit),
      }))
      .filter((r) => r.job_name && !isNaN(r.deadline) && r.deadline > 0 && !isNaN(r.profit) && r.profit > 0);

    if (valid.length === 0) {
      setError('Please enter at least one valid job with a name, positive deadline, and positive profit.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await bulkCreateJobs(valid, allowDuplicates);
      onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              Bulk Job Ingestion
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Add multiple candidate jobs at once using the editable grid or by uploading/pasting CSV data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'table'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Editable Table Form
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'csv'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Paste or Upload CSV
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Editable Table */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Job Name</th>
                    <th className="py-2.5 px-3">Deadline (Slot)</th>
                    <th className="py-2.5 px-3">Profit (₹)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          placeholder={`Job_${idx + 1}`}
                          value={row.job_name}
                          onChange={(e) => handleRowChange(idx, 'job_name', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          placeholder="e.g. 2"
                          min="1"
                          value={row.deadline}
                          onChange={(e) => handleRowChange(idx, 'deadline', e.target.value)}
                          className="w-24 px-2.5 py-1.5 text-xs text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          placeholder="e.g. 100"
                          min="1"
                          value={row.profit}
                          onChange={(e) => handleRowChange(idx, 'profit', e.target.value)}
                          className="w-28 px-2.5 py-1.5 text-xs text-white bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={rows.length <= 1}
                          className="p-1 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/40 border border-blue-900 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDuplicates}
                  onChange={(e) => setAllowDuplicates(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Auto-rename duplicate job names (suffix)</span>
              </label>
            </div>
          </div>
        )}

        {/* Tab 2: CSV Upload & Paste */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Upload CSV File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase">
                Or Paste Raw CSV Data
              </label>
              <textarea
                rows={6}
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                placeholder={"Job Name,Deadline,Profit\nJ1,2,100\nJ2,1,19\nJ3,2,27"}
                className="w-full p-3 text-xs font-mono text-slate-200 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleCSVImport}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm"
              >
                Parse & Populate Table
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Submitting Batch...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save All Jobs to Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
