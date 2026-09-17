import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertOctagon, RotateCcw } from "lucide-react"
import { Button } from "../ui/Button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 mb-4">
            <AlertOctagon className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            An unexpected error occurred in this module. Our error tracking system has logged this incident.
          </p>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => window.location.reload()}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
