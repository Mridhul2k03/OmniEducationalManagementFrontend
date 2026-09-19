import React, { useState, useEffect } from "react"
import { api } from "../../services/api"
import { formatCurrency } from "../../lib/utils"
import { 
  Layers, 
  Check, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Crown, 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight, 
  Edit3, 
  RefreshCw,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"

interface PlanDefinition {
  id: string
  name: string
  price: number
  billingPeriod: string
  description: string
  studentLimit: number
  staffLimit: number
  badgeColor: string
  features: string[]
  recommended?: boolean
}

const SAAS_PLANS: PlanDefinition[] = [
  {
    id: "Starter",
    name: "Starter Academy",
    price: 199,
    billingPeriod: "/ month",
    description: "Ideal for boutique tutoring centers, early childhood centers, and single-discipline studios.",
    studentLimit: 250,
    staffLimit: 25,
    badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    features: [
      "Up to 250 Active Students",
      "Up to 25 Faculty & Staff",
      "Full SIS & Attendance Matrix",
      "Basic Fee & Invoice Management",
      "Standard Email Announcements",
      "Standard Community Support",
    ],
  },
  {
    id: "Professional",
    name: "Professional Campus",
    price: 499,
    billingPeriod: "/ month",
    description: "Built for growing K-12 private schools, vocational colleges, and multi-branch academies.",
    studentLimit: 1500,
    staffLimit: 150,
    badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    recommended: true,
    features: [
      "Up to 1,500 Active Students",
      "Up to 150 Faculty & Staff",
      "Custom Subdomain & White-labeling",
      "Full LMS & Assignment Tracking",
      "Online Fee Collections & Stripe Gateway",
      "SMS & Automated WhatsApp Alerts",
      "Priority 24/7 Support with 4hr SLA",
    ],
  },
  {
    id: "Enterprise",
    name: "Enterprise Multi-Campus",
    price: 999,
    billingPeriod: "/ month",
    description: "Engineered for premier universities, polytechnics, and large educational syndicates.",
    studentLimit: 10000,
    staffLimit: 1000,
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    features: [
      "Unlimited Students & Multi-campus",
      "Unlimited Staff & Dynamic RBAC Roles",
      "Dedicated Database Isolation",
      "Custom Top-level Domain with SSL",
      "Full DRF REST API & Webhook Access",
      "Real-time Security Audit Streaming",
      "Dedicated Technical Account Manager",
    ],
  },
]

export const AdminSubscriptionsPage: React.FC = () => {
  const [tenants, setTenants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false)
  const [targetPlan, setTargetPlan] = useState<string>("Enterprise")
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  const loadTenants = async () => {
    setIsLoading(true)
    try {
      const data = await api.platformAdmin.getTenants()
      setTenants(data)
    } catch (err) {
      console.error("Failed to load subscription tenants:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTenants()
  }, [])

  const handleOpenChangePlan = (tenant: any) => {
    setSelectedTenant(tenant)
    setTargetPlan(tenant.subscription_reference || "Enterprise")
    setIsPlanModalOpen(true)
    setActionSuccess(null)
  }

  const handleApplyPlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTenant) return
    setActionLoading(true)
    try {
      await api.platformAdmin.updateTenant(selectedTenant.id, {
        subscription_reference: targetPlan,
      })
      setActionSuccess(`Plan updated to ${targetPlan} for ${selectedTenant.name}!`)
      setTimeout(() => {
        setIsPlanModalOpen(false)
        setActionSuccess(null)
      }, 1000)
      await loadTenants()
    } catch (err: any) {
      alert(err.message || "Failed to update subscription.")
    } finally {
      setActionLoading(false)
    }
  }

  // Calculate MRR
  const totalMRR = tenants.reduce((acc, t) => {
    const plan = SAAS_PLANS.find((p) => p.id === (t.subscription_reference || "Enterprise"))
    return acc + (plan?.price || 499)
  }, 0)

  const planCounts = {
    Starter: tenants.filter((t) => (t.subscription_reference || "Enterprise") === "Starter").length,
    Professional: tenants.filter((t) => (t.subscription_reference || "Enterprise") === "Professional").length,
    Enterprise: tenants.filter((t) => (t.subscription_reference || "Enterprise") === "Enterprise").length,
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1.5">
            <Layers className="w-3.5 h-3.5" /> SaaS Monetization & License Matrix
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Subscription Plans & Quota Limits
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Define subscription tiers, enforce student & staff resource quotas, and monitor platform recurring revenue.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadTenants}
          disabled={isLoading}
          className="bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Estimated Monthly MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">${totalMRR.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-1">${(totalMRR * 12).toLocaleString()} Annual Run Rate</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Enterprise Tenants</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{planCounts.Enterprise}</p>
          <p className="text-[11px] text-slate-400 mt-1">Tier-1 $999/mo licenses</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Professional Tenants</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-400 mt-2">{planCounts.Professional}</p>
          <p className="text-[11px] text-slate-400 mt-1">Tier-2 $499/mo licenses</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Starter Tenants</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 mt-2">{planCounts.Starter}</p>
          <p className="text-[11px] text-slate-400 mt-1">Tier-3 $199/mo licenses</p>
        </div>
      </div>

      {/* Plan Tier Matrix Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SAAS_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`relative p-6 rounded-3xl bg-slate-900 border transition-all flex flex-col justify-between ${
              plan.recommended
                ? "border-indigo-500 shadow-xl shadow-indigo-500/10"
                : "border-slate-800 hover:border-slate-700 shadow-lg"
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white shadow-md shadow-indigo-500/30">
                Most Popular
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${plan.badgeColor}`}>
                  {plan.name}
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {planCounts[plan.id as keyof typeof planCounts]} active
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${plan.price}</span>
                  <span className="text-xs text-slate-400 font-medium">{plan.billingPeriod}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{plan.description}</p>
              </div>

              {/* Resource Quotas */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Student Capacity:</span>
                  <span className="font-bold text-white">{plan.studentLimit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-400">Staff Limit:</span>
                  <span className="font-bold text-white">{plan.staffLimit.toLocaleString()}</span>
                </div>
              </div>

              {/* Feature Checklist */}
              <ul className="space-y-2 pt-2 text-xs">
                {plan.features.map((f, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Active Tenant Subscription Management Table */}
      <div className="overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Client Tenant Subscriptions & Quotas</h2>
            <p className="text-xs text-slate-400">Monitor utilization vs plan capacities across all registered clients.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Client Institution</th>
                <th className="py-3 px-4">Current Plan</th>
                <th className="py-3 px-4">Student Quota</th>
                <th className="py-3 px-4">Staff Quota</th>
                <th className="py-3 px-4">Monthly Value</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {tenants.map((t) => {
                const planName = t.subscription_reference || "Enterprise"
                const planDef = SAAS_PLANS.find((p) => p.id === planName) || SAAS_PLANS[2]
                const studentUsagePercent = Math.min(100, Math.round(((t.students_count || 0) / planDef.studentLimit) * 100))

                return (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center text-xs">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{t.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">slug: {t.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${planDef.badgeColor}`}>
                        {planDef.name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-36 space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-bold text-slate-200">{t.students_count || 0}</span>
                          <span className="text-slate-400">/ {planDef.studentLimit}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              studentUsagePercent > 90 ? "bg-rose-500" : "bg-indigo-500"
                            }`}
                            style={{ width: `${studentUsagePercent}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-200">{t.staff_count || 0}</span>
                      <span className="text-slate-400 text-[11px]"> / {planDef.staffLimit}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-400">${planDef.price}/mo</span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenChangePlan(t)}
                        className="h-7 px-2.5 text-[11px] bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                        leftIcon={<Edit3 className="w-3 h-3" />}
                      >
                        Adjust Tier
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Adjust Plan Tier */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-white">
            <Crown className="w-5 h-5 text-amber-400" />
            <span>Adjust Subscription Tier: {selectedTenant?.name}</span>
          </div>
        }
        description="Upgrade or downgrade the SaaS license tier and adjust capacity allocations."
        className="bg-slate-900 border-slate-800 text-slate-100"
      >
        <form onSubmit={handleApplyPlan} className="space-y-4 pt-2">
          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="space-y-2">
            {SAAS_PLANS.map((p) => (
              <label
                key={p.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                  targetPlan === p.id
                    ? "bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="targetPlan"
                    value={p.id}
                    checked={targetPlan === p.id}
                    onChange={(e) => setTargetPlan(e.target.value)}
                    className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <p className="font-bold text-xs text-white">{p.name}</p>
                    <p className="text-[11px] text-slate-400">
                      Up to {p.studentLimit.toLocaleString()} Students • {p.staffLimit} Staff
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-indigo-400">${p.price}/mo</span>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPlanModalOpen(false)}
              className="bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
              {actionLoading ? "Applying..." : "Apply Plan Change"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
