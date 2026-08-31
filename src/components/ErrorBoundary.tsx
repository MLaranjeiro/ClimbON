import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '../lib/errors';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError('render-crash', error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="card-light text-center max-w-sm">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-4">
              We hit an unexpected error. Try reloading the page — it's been logged for review.
            </p>
            <button type="button" onClick={() => window.location.reload()} className="btn-primary inline-block">
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
