import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', size = 'default' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  }[size] || 'w-8 h-8';

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="relative">
        <Loader2 className={`${sizeClasses} text-blue-500 animate-spin`} />
        <div className="absolute inset-0 rounded-full blur-md bg-blue-500/30 animate-pulse" />
      </div>
      {message && (
        <p className="text-xs sm:text-sm font-medium text-slate-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
