import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught a runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0f1d] text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-950/60 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected interface error occurred. You can reload the application to restore state.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left overflow-x-auto text-[11px] font-mono text-rose-300">
                {this.state.error.toString()}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-600/30"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
