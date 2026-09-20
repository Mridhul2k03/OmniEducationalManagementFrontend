import React from "react"
import { Lock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react"

interface LockedFeatureNoticeProps {
  featureTitle: string
  description?: string
  requiredPlan?: "Professional" | "Enterprise"
  onUpgradeClick: () => void
}

export const LockedFeatureNotice: React.FC<LockedFeatureNoticeProps> = ({
  featureTitle,
  description = "This advanced academic capability is exclusively available on higher-tier institutional plans.",
  requiredPlan = "Professional",
  onUpgradeClick,
}) => {
  return (
    <div className="min-h-[420px] flex flex-col items-center justify-center p-8 text-center bg-[#DBE2EF]/20 dark:bg-slate-900/60 rounded-2xl border-2 border-dashed border-[#DBE2EF] dark:border-slate-800">
      <div className="w-16 h-16 rounded-2xl bg-[#DBE2EF] dark:bg-slate-800 flex items-center justify-center mb-4 text-[#3F72AF] shadow-sm">
        <Lock className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3F72AF]/10 text-[#3F72AF] text-xs font-semibold uppercase tracking-wider mb-2">
        <Sparkles className="w-3.5 h-3.5" /> Requires {requiredPlan} Tier
      </div>

      <h3 className="text-2xl font-bold text-[#112D4E] dark:text-white mt-1">
        {featureTitle} is Locked
      </h3>

      <p className="max-w-md text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={onUpgradeClick}
          className="px-6 py-2.5 rounded-xl bg-[#3F72AF] hover:bg-[#112D4E] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span>Upgrade to {requiredPlan}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-8 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Instant Activation
        </span>
        <span>•</span>
        <span>Prorated Billing</span>
        <span>•</span>
        <span>Cancel Anytime</span>
      </div>
    </div>
  )
}
