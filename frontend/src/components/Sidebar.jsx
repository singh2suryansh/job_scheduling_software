import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Cpu,
  CheckCircle2,
  BarChart3,
  BookOpen,
  Sparkles,
  X,
  Layers,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Manage Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Scheduler', href: '/scheduler', icon: Cpu, highlight: true },
  { name: 'Scheduling Results', href: '/results', icon: CheckCircle2 },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Algorithm Explanation', href: '/algorithm', icon: BookOpen },
];

export default function Sidebar({ isOpen, onClose, backendHealthy }) {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900/95 border-r border-slate-800 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-18 px-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-white">JOBFLOW</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 rounded">
                  ADA
                </span>
              </div>
              <p className="text-xs text-slate-400">Greedy Scheduling Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Core Platform
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                      }`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.highlight && (
                      <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Algorithm Badge & System Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">Greedy Strategy</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O(n log n + nD) optimization with discrete deadlines.
            </p>

            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">FastAPI Backend</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    backendHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium ${
                    backendHealthy ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {backendHealthy ? 'Online' : 'Checking'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
