import React, { useState } from "react"
import { 
  Sparkles, 
  Check, 
  X, 
  Crown, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Users,
  GraduationCap,
  CalendarDays,
  FileSpreadsheet,
  Layers,
  Clock,
  ArrowRight
} from "lucide-react"
import { useSubscriptionPlan } from "./useSubscriptionPlan"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Button } from "../../components/ui/Button"

export const PlansPage: React.FC = () => {
  const { tenant } = useTenant()
  const { user } = useAuth()
  const {
    currentPlanId,
    activePlan,
    availablePlans,
    upgradeTo,
    upgrading,
  } = useSubscriptionPlan()

  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSelectPlan = async (planId: string) => {
    if (planId === currentPlanId) return
    setSelectedPlanToUpgrade(planId)
    setErrorMessage(null)
    setSuccessMessage(null)

    const ok = await upgradeTo(planId)
    if (ok) {
      setSuccessMessage(`Successfully switched your institution to the ${availablePlans[planId]?.name || planId} plan!`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } else {
      setErrorMessage("Failed to switch subscription plan. Please try again or contact administrator.")
    }
    setSelectedPlanToUpgrade(null)
  }

  const plansList = Object.values(availablePlans)

  const featureMatrix = [
    {
      title: "Google Gemini AI 2.5 Tutor & Study Plans",
      desc: "24/7 AI-powered real-time academic assistant and study plan blueprint generator",
      starter: false,
      professional: true,
      enterprise: true,
    },
    {
      title: "Online Examinations & Marks Ledger",
      desc: "Comprehensive examination scheduling, candidate grading, and GPA calculation",
      starter: false,
      professional: true,
      enterprise: true,
    },
    {
      title: "LMS Materials & Learning Hub",
      desc: "Course syllabus distribution, homework assignments, and lecture notes",
      starter: false,
      professional: true,
      enterprise: true,
    },
    {
      title: "Master Timetable Generator",
      desc: "5-day conflicting-checking lecture and room allocation matrix",
      starter: true,
      professional: true,
      enterprise: true,
    },
    {
      title: "Student Information System (SIS)",
      desc: "Student admission rosters, guardian records, and demographic directory",
      starter: true,
      professional: true,
      enterprise: true,
    },
    {
      title: "Faculty & Staff Administration",
      desc: "Educator profiles, department allocations, and teaching load tracker",
      starter: true,
      professional: true,
      enterprise: true,
    },
    {
      title: "Tuition Invoicing & Financial Ledger",
      desc: "Fee collection receipts, balance auditing, and downloadable PDF statements",
      starter: true,
      professional: true,
      enterprise: true,
    },
    {
      title: "Parent & Student Portal Access",
      desc: "Dedicated learner portal for gradebook, schedule, and fee inspection",
      starter: true,
      professional: true,
      enterprise: true,
    },
    {
      title: "Security & Forensic Audit Logs",
      desc: "Full immutable transaction logging, IP access history, and RBAC tracking",
      starter: false,
      professional: false,
      enterprise: true,
    },
    {
      title: "Multi-Campus Federation",
      desc: "Cross-campus management and centralized governance for university branches",
      starter: false,
      professional: false,
      enterprise: true,
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DBE2EF] dark:bg-slate-800 text-[#112D4E] dark:text-[#DBE2EF] text-xs font-bold border border-[#DBE2EF]">
          <Sparkles className="w-3.5 h-3.5 text-[#3F72AF]" />
          <span>Institutional Subscription Plans</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#112D4E] dark:text-white tracking-tight">
          Scalable EdTech Plans Built For Excellence
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Tailored tiers for schools, coaching institutes, and universities. Switch tiers anytime with instant activation.
        </p>
      </div>

      {/* Notification Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current Subscription Status Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Current Institution Tier</span>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-[#112D4E] dark:text-white capitalize">
              {activePlan?.name || "Professional Plan"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
              Active Tier
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Assigned to <span className="font-semibold text-slate-700 dark:text-slate-200">{tenant.name}</span>. Maximum capacity: <span className="font-semibold">{activePlan?.features?.students_limit && activePlan.features.students_limit < 999999 ? activePlan.features.students_limit.toLocaleString() : "Unlimited"} learners</span> & <span className="font-semibold">{activePlan?.features?.staff_limit && activePlan.features.staff_limit < 999999 ? activePlan.features.staff_limit.toLocaleString() : "Unlimited"} educators</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-2 hidden sm:block">
            <div className="text-xs text-slate-400">Current Billing</div>
            <div className="text-lg font-extrabold text-[#3F72AF]">
              ${activePlan?.monthly_price ?? 149} <span className="text-xs font-normal text-slate-500">/ mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Premium Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plansList.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const isPro = plan.id === "professional"
          const isEnterprise = plan.id === "enterprise"

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                isCurrent
                  ? "bg-white dark:bg-slate-900 border-2 border-[#3F72AF] shadow-xl ring-2 ring-[#3F72AF]/20"
                  : isPro
                  ? "bg-white dark:bg-slate-900 border-2 border-[#DBE2EF] hover:border-[#3F72AF]/60 shadow-lg"
                  : "bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm hover:shadow-md"
              }`}
            >
              {/* Top Badges */}
              <div className="flex items-center justify-between mb-4">
                {isPro && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#3F72AF] text-white shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Most Popular
                  </span>
                )}
                {isEnterprise && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#112D4E] text-[#DBE2EF] shadow-xs">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Full Access
                  </span>
                )}
                {plan.id === "starter" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#DBE2EF] text-[#112D4E]">
                    <Zap className="w-3.5 h-3.5 text-[#3F72AF]" />
                    Essential SIS
                  </span>
                )}

                {isCurrent && (
                  <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Current
                  </span>
                )}
              </div>

              {/* Title & Price */}
              <div className="space-y-3 pb-6 border-b border-[#DBE2EF] dark:border-slate-800">
                <h3 className="text-xl font-bold text-[#112D4E] dark:text-white">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-extrabold text-[#112D4E] dark:text-white">
                    ${plan.monthly_price}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {plan.tagline || (plan.id === "starter"
                    ? "Complete core SIS and academic foundation for growing schools."
                    : plan.id === "professional"
                    ? "Advanced AI tutoring, examination management, and LMS capabilities."
                    : "Uncapped scale, multi-campus federation, and enterprise security.")}
                </p>
              </div>

              {/* Capacity Specs */}
              <div className="py-4 border-b border-[#DBE2EF] dark:border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-[#3F72AF]" /> Max Learners:
                  </span>
                  <span className="font-bold">
                    {plan.features?.students_limit && plan.features.students_limit < 999999 ? `${plan.features.students_limit.toLocaleString()}` : "Unlimited"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <GraduationCap className="w-3.5 h-3.5 text-[#3F72AF]" /> Max Faculty & Staff:
                  </span>
                  <span className="font-bold">
                    {plan.features?.staff_limit && plan.features.staff_limit < 999999 ? `${plan.features.staff_limit.toLocaleString()}` : "Unlimited"}
                  </span>
                </div>
              </div>

              {/* Highlights List */}
              <div className="py-6 space-y-3 flex-1">
                <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  Included Features
                </span>
                <ul className="space-y-2.5">
                  {(plan.highlights || []).map((feat: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-auto">
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrent || upgrading}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs ${
                    isCurrent
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default border border-slate-200 dark:border-slate-700"
                      : isPro
                      ? "bg-[#3F72AF] hover:bg-[#325b8c] text-white shadow-md"
                      : "bg-[#112D4E] hover:bg-[#1a3d66] text-white shadow-sm"
                  }`}
                >
                  {upgrading && selectedPlanToUpgrade === plan.id ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Switching Plan...
                    </span>
                  ) : isCurrent ? (
                    "Current Active Plan"
                  ) : (
                    `Switch to ${plan.name}`
                  )}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Matrix Table */}
      <div className="rounded-2xl border border-[#DBE2EF] dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#DBE2EF] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#112D4E] dark:text-white">
              Detailed Feature Comparison Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review institutional capability breakdown across all 3 tiers.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F9F7F7] dark:bg-slate-800/60 border-b border-[#DBE2EF] dark:border-slate-800 text-[#112D4E] dark:text-white uppercase font-bold text-[11px] tracking-wider">
                <th className="py-4 px-6 w-1/2">Capability</th>
                <th className="py-4 px-4 text-center">Starter</th>
                <th className="py-4 px-4 text-center bg-[#DBE2EF]/30 dark:bg-slate-800/40">Professional</th>
                <th className="py-4 px-4 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DBE2EF] dark:divide-slate-800">
              {featureMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#F9F7F7]/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-bold text-slate-900 dark:text-white">{item.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.starter ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center bg-[#DBE2EF]/20 dark:bg-slate-800/20 font-semibold">
                    {item.professional ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.enterprise ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
