import React, { createContext, useContext, useState, useEffect } from "react"
import { Tenant, TerminologyConfig } from "../../types"
import { appStorage } from "../../services/storage"

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

  useEffect(() => {
    return appStorage.subscribe(() => {
      setTenants([...appStorage.getTenants()])
    })
  }, [])

  const tenant = tenants.find(t => t.id === activeTenantId) || tenants[0]

  useEffect(() => {
    if (tenant) {
      document.title = `${tenant.name} | OMNI Edu Platform`
      // Update primary color token dynamically
      document.documentElement.style.setProperty("--tenant-primary", tenant.primaryColor)
    }
  }, [tenant])

  const setTenantId = (id: string) => {
    setActiveTenantId(id)
    localStorage.setItem("omni-active-tenant", id)
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
