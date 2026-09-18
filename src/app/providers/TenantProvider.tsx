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
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => appStorage.getTenants())
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return localStorage.getItem("omni-active-tenant") || "oxford-crest"
  })

  // Sync with appStorage subscription
  useEffect(() => {
    return appStorage.subscribe(() => {
      setTenants([...appStorage.getTenants()])
    })
  }, [])

  // Sync with backend tenants
  useEffect(() => {
    let isMounted = true
    const fetchBackendTenants = async () => {
      try {
        const backendTenants = await api.tenants.list()
        if (!isMounted || !Array.isArray(backendTenants) || backendTenants.length === 0) return

        const currentLocal = appStorage.getTenants()
        const merged: Tenant[] = currentLocal.map(loc => {
          const matched = backendTenants.find(bt => bt.slug === loc.id || bt.id === loc.id)
          if (matched) {
            return {
              ...loc,
              // Map backend id to ensure UUID is accessible
              id: matched.id || loc.id,
              name: matched.name || loc.name,
            }
          }
          return loc
        })

        // Also add any backend tenants not present locally
        backendTenants.forEach(bt => {
          if (!merged.some(m => m.id === bt.id || m.id === bt.slug)) {
            merged.push({
              id: bt.id,
              name: bt.name,
              code: bt.slug.substring(0, 4).toUpperCase(),
              type: "university_college",
              tagline: "Educational Excellence",
              primaryColor: "#4f46e5",
              currency: bt.currency || "USD",
              timezone: bt.timezone || "UTC",
              address: "Campus Way",
              subscriptionPlan: "Enterprise",
              subscriptionStatus: "active",
              subscriptionExpiry: "2027-12-31",
              maxLearners: 5000,
              currentLearners: 1200,
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
                termPlural: "Semesters"
              },
              features: {
                onlineExams: true,
                financeModule: true,
                timetableGenerator: true,
                bulkSms: true,
                parentPortal: true
              }
            })
          }
        })

        setTenants(merged)
      } catch {
        // Backend not reachable, keep using offline tenants
      }
    }

    fetchBackendTenants()
    return () => { isMounted = false }
  }, [])

  const tenant = tenants.find(t => t.id === activeTenantId || (t as any).slug === activeTenantId) || tenants[0]

  useEffect(() => {
    if (tenant) {
      document.title = `${tenant.name} | OMNI Edu Platform`
      document.documentElement.style.setProperty("--tenant-primary", tenant.primaryColor)
      api.setActiveTenantId(tenant.id)
    }
  }, [tenant])

  const setTenantId = (id: string) => {
    setActiveTenantId(id)
    localStorage.setItem("omni-active-tenant", id)
    api.setActiveTenantId(id)
  }

  const updateTenant = (updated: Tenant) => {
    appStorage.updateTenant(updated)
  }

  const t = (key: TermKey): string => {
    const term: TerminologyConfig = tenant.terminology
    switch (key) {
      case "learner": return term.learnerSingular
      case "learners": return term.learnerPlural
      case "educator": return term.educatorSingular
      case "educators": return term.educatorPlural
      case "class": return term.classSingular
      case "classes": return term.classPlural
      case "program": return term.programSingular
      case "programs": return term.programPlural
      case "term": return term.termSingular
      case "terms": return term.termPlural
      default: return key
    }
  }

  const isFeatureEnabled = (feature: keyof Tenant["features"]): boolean => {
    return !!tenant.features[feature]
  }

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenants,
        setTenantId,
        t,
        updateTenant,
        isFeatureEnabled
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
