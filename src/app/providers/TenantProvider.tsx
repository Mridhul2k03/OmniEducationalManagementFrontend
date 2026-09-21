import React, { createContext, useContext, useState, useEffect } from "react"
import { Tenant, TerminologyConfig } from "../../types"
import { appStorage } from "../../services/storage"
import { api } from "../../services/api"

type TermKey = 
  | 'learner' 
  | 'learners' 
  | 'educator' 
  | 'educators' 
  | 'class' 
  | 'classes' 
  | 'program' 
  | 'programs' 
  | 'term' 
  | 'terms'

interface TenantContextType {
  tenant: Tenant
  tenants: Tenant[]
  setTenantId: (id: string) => void
  t: (key: TermKey) => string
  updateTenant: (tenant: Tenant) => void
  isFeatureEnabled: (feature: keyof Tenant["features"]) => boolean
  refreshTenants: () => Promise<void>
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

const DEFAULT_EMPTY_TENANT: Tenant = {
  id: "",
  slug: "",
  name: "Omni Educational Management",
  code: "OMNI",
  type: "university_college",
  tagline: "Academic Portal",
  primaryColor: "#3F72AF",
  currency: "USD",
  timezone: "UTC",
  address: "",
  subscriptionPlan: "Enterprise",
  subscriptionStatus: "active",
  subscriptionExpiry: "",
  maxLearners: 1000,
  currentLearners: 0,
  terminology: {
    learnerSingular: "Student",
    learnerPlural: "Students",
    educatorSingular: "Professor",
    educatorPlural: "Faculty",
    classSingular: "Course",
    classPlural: "Courses",
    programSingular: "Program",
    programPlural: "Programs",
    termSingular: "Semester",
    termPlural: "Semesters",
  },
  features: {
    onlineExams: true,
    financeModule: true,
    timetableGenerator: true,
    bulkSms: true,
    parentPortal: true,
  },
}

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => appStorage.getTenants())
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return localStorage.getItem("omni-active-tenant-id") || localStorage.getItem("omni-active-tenant") || ""
  })

  // Sync with appStorage subscription
  useEffect(() => {
    return appStorage.subscribe(() => {
      setTenants([...appStorage.getTenants()])
    })
  }, [])

  const fetchBackendTenants = async () => {
    try {
      const backendTenants = await api.tenants.list()
      if (Array.isArray(backendTenants) && backendTenants.length > 0) {
        appStorage.updateTenantsFromBackend(backendTenants)
        const updated = appStorage.getTenants()
        setTenants([...updated])
        if (!activeTenantId || !updated.some(t => t.id === activeTenantId || t.slug === activeTenantId)) {
          setActiveTenantId(updated[0].id)
          localStorage.setItem("omni-active-tenant", updated[0].id)
          localStorage.setItem("omni-active-tenant-id", updated[0].id)
          api.setActiveTenantId(updated[0].id)
        }
      }
    } catch {
      // Backend not reachable
    }
  }

  // Sync with backend tenants
  useEffect(() => {
    fetchBackendTenants()
  }, [])

  const rawTenant = tenants.find(t => 
    (activeTenantId && (t.id === activeTenantId || t.slug === activeTenantId || (t.code && t.code.toLowerCase() === activeTenantId.toLowerCase())))
  ) || tenants[0] || DEFAULT_EMPTY_TENANT

  const tenant: Tenant = {
    ...DEFAULT_EMPTY_TENANT,
    ...(rawTenant || {}),
    terminology: {
      ...DEFAULT_EMPTY_TENANT.terminology,
      ...(rawTenant?.terminology || {}),
    },
    features: {
      ...DEFAULT_EMPTY_TENANT.features,
      ...(rawTenant?.features || {}),
    }
  }

  useEffect(() => {
    if (tenant && tenant.name) {
      document.title = `${tenant.name} | OMNI Edu Platform`
      if (tenant.primaryColor) {
        document.documentElement.style.setProperty("--tenant-primary", tenant.primaryColor)
      }
      if (tenant.id) {
        localStorage.setItem("omni-active-tenant", tenant.id)
        localStorage.setItem("omni-active-tenant-id", tenant.id)
        api.setActiveTenantId(tenant.id)
      }
    }
  }, [tenant])

  const setTenantId = (idOrSlug: string) => {
    const target = tenants.find(t => 
      t.id === idOrSlug || 
      t.slug === idOrSlug || 
      (t.code && t.code.toLowerCase() === idOrSlug.toLowerCase())
    )
    const targetId = target ? target.id : idOrSlug
    setActiveTenantId(targetId)
    localStorage.setItem("omni-active-tenant", targetId)
    localStorage.setItem("omni-active-tenant-id", targetId)
    api.setActiveTenantId(targetId)
  }

  const updateTenant = (updated: Tenant) => {
    appStorage.updateTenant(updated)
  }

  const t = (key: TermKey): string => {
    const term = tenant.terminology || DEFAULT_EMPTY_TENANT.terminology
    switch (key) {
      case "learner": return term.learnerSingular || "Student"
      case "learners": return term.learnerPlural || "Students"
      case "educator": return term.educatorSingular || "Faculty"
      case "educators": return term.educatorPlural || "Faculty"
      case "class": return term.classSingular || "Class"
      case "classes": return term.classPlural || "Classes"
      case "program": return term.programSingular || "Program"
      case "programs": return term.programPlural || "Programs"
      case "term": return term.termSingular || "Term"
      case "terms": return term.termPlural || "Terms"
      default: return key
    }
  }

  const isFeatureEnabled = (feature: keyof Tenant["features"]): boolean => {
    return !!tenant.features?.[feature]
  }

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenants,
        setTenantId,
        t,
        updateTenant,
        isFeatureEnabled,
        refreshTenants: fetchBackendTenants
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => {
  const context = useContext(TenantContext)
  if (!context) throw new Error("useTenant must be used within TenantProvider")
  return context
}
