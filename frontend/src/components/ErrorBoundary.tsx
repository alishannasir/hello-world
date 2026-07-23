import { Component, type ReactNode } from 'react';
import { track } from '../lib/analytics';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Last-resort error state: a render crash shows a friendly recovery screen
// instead of a blank page, and reports the error to analytics.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    track('client_error', { message: error.message });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-zinc-400 max-w-sm">
          An unexpected error occurred. Your session is safe - reload to keep chatting.
        </p>
        <button
          onClick={() => window.location.assign('/home')}
          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold px-6 py-3 transition-colors"
        >
          Reload app
        </button>
      </main>
    );
  }
}
