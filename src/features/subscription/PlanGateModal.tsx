import React from "react"
import { Check, Zap, Shield, Crown, Sparkles, X, ArrowRight, Lock } from "lucide-react"
import { SubscriptionPlanItem } from "../../services/api/tenants"

interface PlanGateModalProps {
  isOpen: boolean
  onClose: () => void
  currentPlanId: string
  availablePlans: Record<string, SubscriptionPlanItem>
  lockedFeature?: string
  onUpgrade: (planId: string) => Promise<boolean | void>
  isUpgrading?: boolean
}

export const PlanGateModal: React.FC<PlanGateModalProps> = ({
  isOpen,
  onClose,
  currentPlanId,
  availablePlans,
  lockedFeature,
  onUpgrade,
  isUpgrading = false,
}) => {
  if (!isOpen) return null

  const planList = Object.values(availablePlans)

  const getTierIcon = (id: string) => {
    switch (id) {
      case "starter":
        return <Zap className="w-5 h-5 text-[#3F72AF]" />
      case "professional":
        return <Sparkles className="w-5 h-5 text-amber-500" />
      case "enterprise":
        return <Crown className="w-5 h-5 text-indigo-500" />
      default:
        return <Shield className="w-5 h-5 text-[#3F72AF]" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl bg-[#F9F7F7] dark:bg-slate-900 rounded-2xl shadow-2xl border border-[#DBE2EF] dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Banner */}
        <div className="bg-[#112D4E] text-white p-6 sm:p-8 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#3F72AF]/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3F72AF]/30 text-[#DBE2EF] text-xs font-semibold uppercase tracking-wider mb-3 border border-[#3F72AF]/50">
              <Sparkles className="w-3.5 h-3.5" /> Institutional Subscription Plans
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {lockedFeature ? `Unlock ${lockedFeature}` : "Upgrade Your Institutional Plan"}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#DBE2EF]/90">
              Choose the tier that matches your campus size and feature needs. Switch or upgrade anytime with instant provisioning.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#DBE2EF] hover:text-white hover:bg-white/10 transition-colors z-10"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Feature Lock Notice if triggered */}
        {lockedFeature && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center gap-3 text-amber-800 dark:text-amber-300 text-sm">
            <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>{lockedFeature}</strong> requires the <strong>Professional</strong> or <strong>Enterprise</strong> tier.
            </span>
          </div>
        )}

        {/* Plans Grid */}
        <div className="p-6 sm:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {planList.map((plan) => {
            const isCurrent = plan.id === currentPlanId
            const isPopular = plan.is_popular

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-xl p-6 transition-all duration-200 ${
                  isPopular
                    ? "bg-white dark:bg-slate-800/90 border-2 border-[#3F72AF] shadow-xl shadow-[#3F72AF]/10"
                    : "bg-[#DBE2EF]/30 dark:bg-slate-800/50 border border-[#DBE2EF] dark:border-slate-700/60 shadow-sm"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#3F72AF] text-white shadow">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-lg bg-[#DBE2EF] dark:bg-slate-700/60">
                    {getTierIcon(plan.id)}
                  </div>
                  {isCurrent && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Active Plan
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-[#112D4E] dark:text-white">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 min-h-[32px]">
                  {plan.tagline}
                </p>

                <div className="mt-4 mb-6 flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-[#112D4E] dark:text-white">
                    ${plan.monthly_price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
                </div>

                <div className="space-y-2.5 flex-1 border-t border-[#DBE2EF] dark:border-slate-700 pt-4">
                  <div className="text-xs font-semibold text-[#112D4E] dark:text-slate-200 uppercase tracking-wider">
                    Included Features:
                  </div>
                  {plan.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4">
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-[#DBE2EF] dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-default flex items-center justify-center gap-2"
                    >
                      Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpgrade(plan.id)}
                      disabled={isUpgrading}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm ${
                        isPopular
                          ? "bg-[#3F72AF] hover:bg-[#112D4E] text-white"
                          : "bg-[#112D4E] hover:bg-[#3F72AF] text-white"
                      }`}
                    >
                      {isUpgrading ? (
                        "Updating..."
                      ) : (
                        <>
                          <span>Select {plan.name.split(" ")[0]}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-[#DBE2EF]/20 dark:bg-slate-900 border-t border-[#DBE2EF] dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>All plans include automated backups, SSL encryption, and multi-user RBAC.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#DBE2EF] dark:border-slate-700 hover:bg-[#DBE2EF]/40 dark:hover:bg-slate-800 text-[#112D4E] dark:text-slate-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
