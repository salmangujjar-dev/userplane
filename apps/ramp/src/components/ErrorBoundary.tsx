'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { log } from '@/lib/client-logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    log.error(
      { error: error.message, componentStack: info.componentStack },
      'ErrorBoundary caught render error'
    );
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">
            Something went wrong
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-400">{this.state.error.message}</p>
          <pre className="mt-3 max-h-40 overflow-auto rounded bg-red-100 p-3 text-xs text-red-800 dark:bg-red-950/50 dark:text-red-300">
            {this.state.error.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
