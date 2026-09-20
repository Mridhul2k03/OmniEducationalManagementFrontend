import { useState, useEffect, useCallback } from "react"
import { api } from "../../services/api"
import { PlanFeatureMatrix, SubscriptionPlanItem } from "../../services/api/tenants"

const DEFAULT_PLANS: Record<string, SubscriptionPlanItem> = {
  starter: {
    id: "starter",
    name: "Starter Tier",
    monthly_price: 49,
    annual_price: 490,
    tagline: "Essential SIS foundation for growing primary & coaching centers",
    features: {
      students_limit: 250,
      staff_limit: 25,
      ai_tutor: false,
      exams: false,
      lms: false,
      finance_advanced: false,
      audit_logs: false,
      multi_campus: false,
      priority_support: false,
    },
    highlights: [
      "Up to 250 Learners & 25 Staff",
      "Core SIS Student & Staff Profiles",
      "Timetable & Period Schedules",
      "Daily Attendance Management",
      "Basic Tuition Billing & Invoices",
    ],
  },
  professional: {
    id: "professional",
    name: "Professional Campus",
    monthly_price: 149,
    annual_price: 1490,
    tagline: "Full-spectrum academic suite with AI Tutor for modern institutions",
    features: {
      students_limit: 2500,
      staff_limit: 150,
      ai_tutor: true,
      exams: true,
      lms: true,
      finance_advanced: true,
      audit_logs: false,
      multi_campus: false,
      priority_support: true,
    },
    highlights: [
      "Up to 2,500 Learners & 150 Faculty",
      "Gemini AI Tutor & Study Plan Generator",
      "Examinations, Gradebook & Report Cards",
      "LMS Course Materials & Lesson Plans",
      "Advanced Multi-term Tuition Billing",
      "Priority Institutional Support",
    ],
    is_popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise University",
    monthly_price: 399,
    annual_price: 3990,
    tagline: "Unrestricted scale, compliance audit logs & multi-campus federation",
    features: {
      students_limit: 999999,
      staff_limit: 999999,
      ai_tutor: true,
      exams: true,
      lms: true,
      finance_advanced: true,
      audit_logs: true,
      multi_campus: true,
      priority_support: true,
    },
    highlights: [
      "Unlimited Students, Faculty & Campuses",
      "Gemini AI Tutor (Unlimited Quota)",
      "Full Forensic Security Audit Logs",
      "Custom Institutional Domains & SSO",
      "Dedicated Technical Account Manager",
      "SLA 99.9% Uptime Guarantee",
    ],
  },
}

export function useSubscriptionPlan() {
  const [currentPlanId, setCurrentPlanId] = useState<string>("professional")
  const [plans, setPlans] = useState<Record<string, SubscriptionPlanItem>>(DEFAULT_PLANS)
  const [loading, setLoading] = useState<boolean>(true)
  const [upgrading, setUpgrading] = useState<boolean>(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState<boolean>(false)
  const [lockedFeatureName, setLockedFeatureName] = useState<string>("")

  const loadPlan = useCallback(async () => {
    try {
      const res = await api.tenants.getCurrentPlan()
      if (res?.current_plan_id) {
        setCurrentPlanId(res.current_plan_id)
      }
      if (res?.available_plans) {
        setPlans(res.available_plans)
      }
    } catch {
      // Keep local defaults
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlan()
  }, [loadPlan])

  const activePlan = plans[currentPlanId] || plans["professional"] || DEFAULT_PLANS["professional"]

  const canAccess = useCallback((feature: keyof PlanFeatureMatrix): boolean => {
    if (!activePlan?.features) return true
    const val = activePlan.features[feature]
    if (typeof val === "boolean") return val
    return true
  }, [activePlan])

  const triggerFeatureLock = useCallback((featureTitle: string) => {
    setLockedFeatureName(featureTitle)
    setUpgradeModalOpen(true)
  }, [])

  const upgradeTo = async (planId: string) => {
    setUpgrading(true)
    try {
      const res = await api.tenants.upgradePlan(planId)
      if (res?.success) {
        setCurrentPlanId(planId)
        setUpgradeModalOpen(false)
        return true
      }
      return false
    } catch {
      return false
    } finally {
      setUpgrading(false)
    }
  }

  return {
    currentPlanId,
    activePlan,
    availablePlans: plans,
    loading,
    upgrading,
    upgradeModalOpen,
    setUpgradeModalOpen,
    lockedFeatureName,
    triggerFeatureLock,
    canAccess,
    upgradeTo,
    refreshPlan: loadPlan,
  }
}
