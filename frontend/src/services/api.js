import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor for uniform error formatting
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred';
    if (error.response?.data?.detail) {
      if (Array.isArray(error.response.data.detail)) {
        message = error.response.data.detail.map((d) => d.msg || d.message).join(', ');
      } else {
        message = error.response.data.detail;
      }
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message === 'Network Error') {
      message = 'Cannot connect to backend server. Ensure FastAPI is running at ' + API_BASE_URL;
    } else if (error.message) {
      message = error.message;
    }
    return Promise.reject(new Error(message));
  }
);

// ==============================================================================
// Jobs API
// ==============================================================================
export const getJobs = async () => {
  const response = await apiClient.get('/jobs');
  return response.data?.data || [];
};

export const createJob = async (jobData) => {
  const response = await apiClient.post('/jobs', {
    job_name: jobData.job_name.trim(),
    deadline: parseInt(jobData.deadline, 10),
    profit: parseFloat(jobData.profit),
  });
  return response.data?.data;
};

export const bulkCreateJobs = async (jobsList, allowDuplicates = false) => {
  const formatted = jobsList.map((j) => ({
    job_name: String(j.job_name).trim(),
    deadline: parseInt(j.deadline, 10),
    profit: parseFloat(j.profit),
  }));

  const response = await apiClient.post('/jobs/bulk', {
    jobs: formatted,
    allow_duplicates: allowDuplicates,
  });
  return response.data?.data;
};

export const seedSampleJobs = async (force = false) => {
  const response = await apiClient.post(`/jobs/seed?force=${force}`);
  return response.data;
};

export const getJob = async (jobId) => {
  const response = await apiClient.get(`/jobs/${jobId}`);
  return response.data?.data;
};

export const updateJob = async (jobId, jobData) => {
  const payload = {};
  if (jobData.job_name !== undefined) payload.job_name = jobData.job_name.trim();
  if (jobData.deadline !== undefined) payload.deadline = parseInt(jobData.deadline, 10);
  if (jobData.profit !== undefined) payload.profit = parseFloat(jobData.profit);

  const response = await apiClient.put(`/jobs/${jobId}`, payload);
  return response.data?.data;
};

export const deleteJob = async (jobId) => {
  const response = await apiClient.delete(`/jobs/${jobId}`);
  return response.data;
};

// ==============================================================================
// Scheduling API
// ==============================================================================
export const runSchedule = async (params = {}) => {
  const payload = {
    mode: params.mode || 'ALL_ACTIVE',
    job_ids: params.job_ids || null,
  };
  const response = await apiClient.post('/schedule/run', payload);
  return response.data?.data;
};

export const getScheduleHistory = async () => {
  const response = await apiClient.get('/schedule/history');
  return response.data?.data || [];
};

export const getScheduleRun = async (runId) => {
  const response = await apiClient.get(`/schedule/history/${runId}`);
  return response.data?.data;
};

export const compareRuns = async (runIds) => {
  const response = await apiClient.post('/schedule/compare', { run_ids: runIds });
  return response.data?.data;
};

// ==============================================================================
// Analytics API
// ==============================================================================
export const getAnalytics = async () => {
  const response = await apiClient.get('/analytics');
  return response.data?.data;
};

// ==============================================================================
// System Health
// ==============================================================================
export const checkHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

// ==============================================================================
// CSV Helper Utilities
// ==============================================================================
export const exportJobsToCSV = (jobs, filename = 'jobflow_jobs.csv') => {
  if (!jobs || jobs.length === 0) return;
  const headers = ['ID', 'Job Name', 'Deadline', 'Profit', 'Created At'];
  const rows = jobs.map((j) => [
    j.id,
    `"${(j.job_name || '').replace(/"/g, '""')}"`,
    j.deadline,
    j.profit,
    j.created_at || '',
  ]);
  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSVToJobs = (csvText) => {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse header
  const header = lines[0].toLowerCase();
  const nameIdx = header.split(',').findIndex((h) => h.includes('name') || h.includes('job'));
  const deadlineIdx = header.split(',').findIndex((h) => h.includes('deadline') || h.includes('slot'));
  const profitIdx = header.split(',').findIndex((h) => h.includes('profit') || h.includes('price'));

  const parsedJobs = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 2) continue;

    const job_name = cols[nameIdx !== -1 ? nameIdx : 0] || `Job_${i}`;
    const deadline = parseInt(cols[deadlineIdx !== -1 ? deadlineIdx : 1], 10);
    const profit = parseFloat(cols[profitIdx !== -1 ? profitIdx : 2]);

    if (job_name && !isNaN(deadline) && deadline > 0 && !isNaN(profit) && profit > 0) {
      parsedJobs.push({ job_name, deadline, profit });
    }
  }
  return parsedJobs;
};

export default apiClient;
