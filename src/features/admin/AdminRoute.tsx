import React from "react"
import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../app/providers/AuthProvider"
import { ShieldAlert } from "lucide-react"
import { Button } from "../../components/ui/Button"

export const AdminRoute: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Authenticating SuperAdmin session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" replace />
  }

  const isSuperAdmin = Boolean(user.is_superuser)

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Access Restricted — Platform SuperAdmin Only</h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
          The Platform Administration Console is reserved for global SaaS administrators. Your account (<span className="text-slate-900 dark:text-white font-mono">{user.email}</span>) is provisioned for tenant-scoped operations.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <a href="/app/dashboard">
            <Button variant="primary">
              Return to Institutional Workspace
            </Button>
          </a>
        </div>
      </div>
    )
  }

  return <Outlet />
}
