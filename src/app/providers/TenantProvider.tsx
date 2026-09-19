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

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenants, setTenants] = useState<Tenant[]>(() => appStorage.getTenants())
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return localStorage.getItem("omni-active-tenant-id") || localStorage.getItem("omni-active-tenant") || "7d18388a-872b-4d2b-b42a-f658c03e9e60"
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
      }
    } catch {
      // Backend not reachable, keep using offline tenants
    }
  }

  // Sync with backend tenants
  useEffect(() => {
    fetchBackendTenants()
  }, [])

  const tenant = tenants.find(t => 
    t.id === activeTenantId || 
    t.slug === activeTenantId || 
    (t.code && t.code.toLowerCase() === activeTenantId.toLowerCase())
  ) || tenants[0]

  useEffect(() => {
    if (tenant) {
      document.title = `${tenant.name} | OMNI Edu Platform`
      document.documentElement.style.setProperty("--tenant-primary", tenant.primaryColor)
      localStorage.setItem("omni-active-tenant", tenant.id)
      localStorage.setItem("omni-active-tenant-id", tenant.id)
      api.setActiveTenantId(tenant.id)
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
