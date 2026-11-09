import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
  badge,
}) {
  const accentClasses = {
    blue: {
      border: 'border-blue-500/20 hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400',
      glow: 'group-hover:shadow-blue-500/10',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400',
      glow: 'group-hover:shadow-rose-500/10',
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'group-hover:shadow-amber-500/10',
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'group-hover:shadow-cyan-500/10',
    },
  }[accent] || {
    border: 'border-slate-800 hover:border-slate-700',
    iconBg: 'bg-slate-800 text-slate-300',
    glow: 'group-hover:shadow-slate-500/10',
  };

  return (
    <div
      className={`group relative p-5 rounded-2xl bg-slate-900/80 border ${accentClasses.border} backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${accentClasses.glow}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {value}
            </span>
            {badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-400 pt-0.5">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`p-3 rounded-xl ${accentClasses.iconBg} transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
