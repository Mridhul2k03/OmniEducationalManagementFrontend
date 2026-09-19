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
  refreshSession: () => Promise<void>
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

  // Verify cookie-based session directly with backend
  const checkAndRestoreSession = async () => {
    try {
      const health = await api.health.check()
      setBackendConnected(health.isConnected)

      // Check login status via HttpOnly cookie
      let checkResult = await api.auth.check()

      // If initial check fails, attempt cookie refresh once
      if (!checkResult.authenticated) {
        const refreshed = await api.refreshToken()
        if (refreshed) {
          checkResult = await api.auth.check()
        }
      }

      if (checkResult.authenticated && checkResult.data?.user) {
        const authData = checkResult.data
        const roleCode = authData.user.is_superuser
          ? "super_admin"
          : (authData.role as Role) || "institute_admin"

        const liveUser: User = {
          id: authData.user.id,
          name: authData.user.full_name || authData.user.email,
          email: authData.user.email,
          role: roleCode,
          tenantId: authData.active_tenant?.id || "oxford-crest",
          permissions: authData.permissions?.length ? authData.permissions : ["*"],
          is_superuser: !!authData.user.is_superuser,
          is_staff: !!authData.user.is_staff,
        }

        if (authData.active_tenant?.id) {
          api.setActiveTenantId(authData.active_tenant.id)
        }
        setUser(liveUser)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAndRestoreSession()
  }, [])

  const login = async (email: string, password: string = "Password123!"): Promise<boolean> => {
    setIsLoading(true)

    try {
      const loginRes = await api.auth.login(email, password)
      if (loginRes?.access || loginRes?.user) {
        setBackendConnected(true)

        // Verify session and get authoritative profile and role
        const checkResult = await api.auth.check()
        if (checkResult.authenticated && checkResult.data?.user) {
          const authData = checkResult.data
          const roleCode = authData.user.is_superuser
            ? "super_admin"
            : (authData.role as Role) || "institute_admin"

          const authenticatedUser: User = {
            id: authData.user.id,
            name: authData.user.full_name || authData.user.email,
            email: authData.user.email,
            role: roleCode,
            tenantId: authData.active_tenant?.id || loginRes.active_tenant?.id || "oxford-crest",
            permissions: authData.permissions?.length ? authData.permissions : ["*"],
            is_superuser: !!authData.user.is_superuser,
            is_staff: !!authData.user.is_staff,
          }

          if (authData.active_tenant?.id) {
            api.setActiveTenantId(authData.active_tenant.id)
          }
          setUser(authenticatedUser)
          return true
        }

        // Fallback with login response data
        const fallbackRole = loginRes.user?.is_superuser ? "super_admin" : "institute_admin"
        const fallbackUser: User = {
          id: loginRes.user.id,
          name: loginRes.user.full_name || loginRes.user.email,
          email: loginRes.user.email,
          role: fallbackRole as Role,
          tenantId: loginRes.active_tenant?.id || "oxford-crest",
          permissions: ["*"],
          is_superuser: !!loginRes.user?.is_superuser,
          is_staff: !!loginRes.user?.is_staff,
        }
        if (loginRes.active_tenant?.id) {
          api.setActiveTenantId(loginRes.active_tenant.id)
        }
        setUser(fallbackUser)
        return true
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch {
      // Clean local state
    }
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
        refreshSession: checkAndRestoreSession,
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
