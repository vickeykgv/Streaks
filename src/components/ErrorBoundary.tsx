import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import { logError } from '@/lib/errorLog'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void logError(
      Object.assign(error, {
        stack: `${error.stack ?? error.message}\n--- componentStack ---${info.componentStack ?? ''}`,
      }),
      'react-boundary',
    )
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: 'var(--bg-app)' }}>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-[22px]"
          style={{ background: 'var(--color-overdue-bg)' }}
        >
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <p className="font-sans text-[18px] font-bold text-[var(--text-primary)]">Something went wrong</p>
          <p className="mt-1 font-body text-[13px] text-[var(--text-secondary)]">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 rounded-2xl px-5 py-3 font-sans text-[14px] font-bold text-[var(--text-on-brand)]"
          style={{ background: 'var(--color-brand-500)' }}
        >
          <RefreshCw size={15} />
          Reload app
        </button>
      </div>
    )
  }
}
