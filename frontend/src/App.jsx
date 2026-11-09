import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';
import { checkHealth, getScheduleHistory } from './services/api';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Jobs = lazy(() => import('./pages/Jobs'));
const Scheduler = lazy(() => import('./pages/Scheduler'));
const Results = lazy(() => import('./pages/Results'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Algorithm = lazy(() => import('./pages/Algorithm'));

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [lastRunSummary, setLastRunSummary] = useState(null);

  // Ping backend health and fetch latest run info
  useEffect(() => {
    let isMounted = true;

    const verifyBackend = async () => {
      try {
        const health = await checkHealth();
        if (isMounted) {
          setBackendHealthy(health?.status === 'healthy');
        }
      } catch {
        if (isMounted) {
          setBackendHealthy(false);
        }
      }

      try {
        const history = await getScheduleHistory();
        if (isMounted && history && history.length > 0) {
          setLastRunSummary(history[0]);
        }
      } catch {
        // Ignored
      }
    };

    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex">
        {/* Persistent Responsive Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          backendHealthy={backendHealthy}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <Navbar
            onOpenSidebar={() => setSidebarOpen(true)}
            backendHealthy={backendHealthy}
            lastRunSummary={lastRunSummary}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Suspense fallback={<LoadingSpinner message="Loading view..." size="large" />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/scheduler" element={<Scheduler />} />
                <Route path="/results" element={<Results />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/algorithm" element={<Algorithm />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </Router>
  );
}
