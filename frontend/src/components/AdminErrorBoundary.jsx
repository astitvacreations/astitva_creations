import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin component error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-[#111] border border-red-500/20 rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-heading text-white uppercase tracking-wider mb-2">
            Failed to Load Section
          </h3>
          <p className="text-xs text-[#A1A1A1] max-w-md mb-6 leading-relaxed">
            {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-gold)] text-black font-semibold text-xs uppercase tracking-wider rounded-lg hover:brightness-110 transition-all cursor-pointer shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Section
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

