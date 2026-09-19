import React, { createContext, useContext, useState, useEffect } from "react"
import { User, Role } from "../../types"
import { api } from "../../services/api"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password?: string) => Promise<boolean>
  logout: () => void
  can: (permission: string) => boolean
  availableRoles: { role: Role; label: string; description: string }[]
  backendConnected: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AVAILABLE_ROLES: { role: Role; label: string; description: string }[] = [
  { role: "institute_admin", label: "Institution Admin", description: "Full institutional management & settings control" },
  { role: "faculty", label: "Faculty / Instructor", description: "Classes, attendance, marks, assignments" },
  { role: "student", label: "Student / Learner", description: "View timetable, grades, invoices, assignments" },
  { role: "accountant", label: "Accountant / Bursar", description: "Invoices, fee collection, reconciliation" }
]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [backendConnected, setBackendConnected] = useState<boolean>(false)

  // On mount, verify backend connection and restore session from valid JWT
  useEffect(() => {
    let isMounted = true

    const checkAndRestoreSession = async () => {
      try {
        const health = await api.health.check()
        if (!isMounted) return
        setBackendConnected(health.isConnected)

        const token = api.getAccessToken()
        if (token) {
          try {
            const meData = await api.auth.me()
            if (!isMounted) return
            if (meData?.user) {
              const roleCode = meData.user.is_superuser
                ? "super_admin"
                : (meData.memberships?.[0]?.roles?.[0]?.code as Role) || "institute_admin"

              const liveUser: User = {
                id: meData.user.id,
                name: meData.user.full_name || meData.user.email,
                email: meData.user.email,
                role: roleCode,
                tenantId: meData.active_tenant?.id || "oxford-crest",
                permissions: meData.active_permissions?.length ? meData.active_permissions : ["*"],
                is_superuser: !!meData.user.is_superuser,
                is_staff: !!meData.user.is_staff,
              }
              setUser(liveUser)
            }
          } catch {
            api.clearAuth()
            setUser(null)
          }
        }
      } catch {
        // Backend offline
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    checkAndRestoreSession()
    return () => { isMounted = false }
  }, [])

  const login = async (email: string, password: string = "Password123!"): Promise<boolean> => {
    setIsLoading(true)

    try {
      const loginRes = await api.auth.login(email, password)
      if (loginRes?.access) {
        setBackendConnected(true)
        
        let perms = ["*"]
        let targetRole: Role = loginRes.user?.is_superuser ? "super_admin" : "institute_admin"
        let isSuper = !!loginRes.user?.is_superuser
        let isStaff = !!loginRes.user?.is_staff
        let assignedTenantId = loginRes.active_tenant?.id || "oxford-crest"
        
        try {
          const meData = await api.auth.me()
          if (meData?.active_permissions?.length) {
            perms = meData.active_permissions
          }
          if (meData?.user?.is_superuser) {
            isSuper = true
            targetRole = "super_admin"
          }
          if (meData?.user?.is_staff) {
            isStaff = true
          }
          if (meData?.memberships?.[0]?.roles?.[0]?.code && !isSuper) {
            targetRole = meData.memberships[0].roles[0].code as Role
          }
          if (meData?.active_tenant?.id) {
            assignedTenantId = meData.active_tenant.id
          }
        } catch {
          // meData fetch fallback
        }

        const authenticatedUser: User = {
          id: loginRes.user.id,
          name: loginRes.user.full_name || loginRes.user.email,
          email: loginRes.user.email,
          role: targetRole,
          tenantId: assignedTenantId,
          permissions: perms,
          is_superuser: isSuper,
          is_staff: isStaff,
        }

        api.setActiveTenantId(assignedTenantId)
        setUser(authenticatedUser)
        return true
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    api.auth.logout()
    setUser(null)
  }

  const can = (permission: string): boolean => {
    if (!user) return false
    if (user.permissions.includes("*")) return true
    if (user.permissions.includes(permission)) return true
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        can,
        availableRoles: AVAILABLE_ROLES,
        backendConnected,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
