import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Play,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const pageTitles = {
  '/': { title: 'Dashboard Overview', desc: 'Real-time scheduling metrics and job overview' },
  '/jobs': { title: 'Manage Jobs', desc: 'Add, edit, filter, and inspect input jobs' },
  '/scheduler': { title: 'Scheduler Engine', desc: 'Execute and visualize greedy sequencing algorithm' },
  '/results': { title: 'Scheduling Results', desc: 'Timeline visualization and slot assignment history' },
  '/analytics': { title: 'System Analytics', desc: 'Profit comparison, efficiency, and run trends' },
  '/algorithm': { title: 'Algorithm Theory', desc: 'Formal problem definition, proof, and complexity' },
};

export default function Navbar({ onOpenSidebar, backendHealthy, lastRunSummary }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);

  const currentPage = pageTitles[location.pathname] || {
    title: 'Job Scheduling System',
    desc: 'ADA Project',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-4 sm:px-6 lg:px-8 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onOpenSidebar}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden focus:outline-none"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            {currentPage.title}
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 font-medium">
            {currentPage.desc}
          </p>
        </div>
      </div>

      {/* Right: Quick actions, Backend status, Notifications, Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick action button */}
        {location.pathname !== '/scheduler' && (
          <button
            onClick={() => navigate('/scheduler')}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Scheduler</span>
          </button>
        )}

        {/* Backend Connectivity Status Pill */}
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${
            backendHealthy
              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
              : 'bg-amber-950/60 border-amber-800/60 text-amber-300'
          }`}
          title={backendHealthy ? 'FastAPI is connected' : 'Connecting to FastAPI...'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-mono">
            {backendHealthy ? 'API Active' : 'API Standby'}
          </span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {lastRunSummary && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  System Activity
                </span>
                <span className="text-[10px] text-cyan-400 font-medium">ADA Engine</span>
              </div>
              <div className="py-3 space-y-3">
                {lastRunSummary ? (
                  <div className="p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/60">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Greedy Run #{lastRunSummary.id} Successful</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">
                      Scheduled {lastRunSummary.scheduled_count} jobs with profit ₹
                      {lastRunSummary.total_profit}
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-500 font-mono">
                      {lastRunSummary.run_at
                        ? new Date(lastRunSummary.run_at).toLocaleTimeString()
                        : 'Recently'}
                    </span>
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs text-slate-400">
                    No recent scheduling executions yet. Run the greedy scheduler to see live output!
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                <Link
                  to="/results"
                  onClick={() => setShowNotifications(false)}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  View all history <ExternalLink className="w-3 h-3" />
                </Link>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile / Student Avatar area */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/30">
            ADA
          </div>
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-semibold text-slate-200 leading-tight">
              Algorithm Lab
            </span>
            <span className="block text-[10px] text-slate-400">Greedy Job Scheduler</span>
          </div>
        </div>
      </div>
    </header>
  );
}
