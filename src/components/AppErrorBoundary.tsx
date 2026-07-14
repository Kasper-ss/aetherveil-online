import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

class AppErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Telegram SDK throws this when multiple native popups open at once — recover silently
    if (error.message === 'WebAppPopupOpened') {
      return { error: null }
    }
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Aetherveil] render error', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-aether-bg">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-white mb-2">Ошибка загрузки</h2>
          <p className="text-sm text-slate-400 mb-4">{this.state.error.message}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-aether-cyan text-aether-bg font-medium"
            onClick={() => {
              localStorage.removeItem('player')
              window.location.reload()
            }}
          >
            Сбросить сохранение
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export { AppErrorBoundary }
