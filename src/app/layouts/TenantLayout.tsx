import React from "react"
import { Outlet, Navigate } from "react-router-dom"
import { useTenant } from "../providers/TenantProvider"
import { useAuth } from "../providers/AuthProvider"
import { AlertCircle } from "lucide-react"

export const TenantLayout: React.FC = () => {
  const { tenant } = useTenant()
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Verifying institutional session...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Subscription / Tenant status banner if applicable */}
      {tenant.subscriptionStatus !== "active" && (
        <div className="bg-amber-500 text-slate-900 px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>
            {tenant.name} is currently running on a {tenant.subscriptionPlan} trial expiring on {tenant.subscriptionExpiry}.
          </span>
        </div>
      )}

      {/* Renders child routes */}
      <Outlet />
    </div>
  )
}
