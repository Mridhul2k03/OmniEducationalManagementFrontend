import React from "react"
import { Outlet } from "react-router-dom"
import { useTenant } from "../providers/TenantProvider"
import { AlertCircle, ShieldCheck } from "lucide-react"

export const TenantLayout: React.FC = () => {
  const { tenant } = useTenant()

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
