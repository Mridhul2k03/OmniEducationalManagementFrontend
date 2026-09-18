import React, { createContext, useContext, useState, useEffect } from "react"
import { User, Role } from "../../types"
import { DEMO_USERS } from "../../services/mockData"
import { api } from "../../services/api"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, passwordOrRole?: string | Role, role?: Role) => Promise<boolean>
  logout: () => void
  switchRole: (role: Role) => void
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
  const [user, setUser] = useState<User | null>(() => {
    const savedRole = localStorage.getItem("omni-user-role") as Role || "institute_admin"
    const matched = DEMO_USERS.find(u => u.role === savedRole)
    return matched || DEMO_USERS[0]
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [backendConnected, setBackendConnected] = useState<boolean>(false)

  // On mount, check health and try to restore live session
  useEffect(() => {
    let isMounted = true

    const checkAndRestoreSession = async () => {
      const health = await api.health.check()
      if (!isMounted) return
      setBackendConnected(health.isConnected)

      if (health.isConnected && api.getAccessToken()) {
        try {
          const meData = await api.auth.me()
          if (!isMounted) return
          if (meData?.user) {
            const roleCode = (meData.memberships?.[0]?.roles?.[0]?.code as Role) || "institute_admin"
            const liveUser: User = {
              id: meData.user.id,
              name: meData.user.full_name || meData.user.email,
              email: meData.user.email,
              role: roleCode,
              tenantId: meData.active_tenant?.id || "oxford-crest",
              permissions: meData.active_permissions?.length ? meData.active_permissions : ["*"],
            }
            setUser(liveUser)
            localStorage.setItem("omni-user-role", roleCode)
          }
        } catch {
          // Token expired or invalid, keep current local state
        }
      }
    }

    checkAndRestoreSession()
    return () => { isMounted = false }
  }, [])

  const login = async (email: string, passwordOrRole?: string | Role, maybeRole?: Role): Promise<boolean> => {
    setIsLoading(true)

    let password = "Password123!"
    let targetRole: Role = "institute_admin"

    if (passwordOrRole && typeof passwordOrRole === "string" && !passwordOrRole.includes("_") && passwordOrRole.length > 5 && maybeRole) {
      password = passwordOrRole
      targetRole = maybeRole
    } else if (passwordOrRole && typeof passwordOrRole === "string") {
      targetRole = passwordOrRole as Role
    }

    try {
      // 1. Try real backend authentication
      const loginRes = await api.auth.login(email, password)
      if (loginRes?.access) {
        setBackendConnected(true)
        // Fetch detailed profile and active permissions
        let perms = ["*"]
        try {
          const meData = await api.auth.me()
          if (meData?.active_permissions?.length) {
            perms = meData.active_permissions
          }
          if (meData?.memberships?.[0]?.roles?.[0]?.code) {
            targetRole = meData.memberships[0].roles[0].code as Role
          }
        } catch {
          // me call fallback
        }

        const authenticatedUser: User = {
          id: loginRes.user.id,
          name: loginRes.user.full_name || loginRes.user.email,
          email: loginRes.user.email,
          role: targetRole,
          tenantId: loginRes.active_tenant?.id || "oxford-crest",
          permissions: perms,
        }

        setUser(authenticatedUser)
        localStorage.setItem("omni-user-role", targetRole)
        setIsLoading(false)
        return true
      }
    } catch {
      // Backend not available or credentials issue, fallback to offline demo mock
    }

    // 2. Fallback to mock persona
    const matched = DEMO_USERS.find(u => u.role === targetRole) || {
      ...DEMO_USERS[0],
      email,
      name: email.split("@")[0].toUpperCase()
    }
    setUser(matched)
    localStorage.setItem("omni-user-role", matched.role)
    setIsLoading(false)
    return true
  }

  const logout = () => {
    api.auth.logout()
    setUser(null)
    localStorage.removeItem("omni-user-role")
  }

  const switchRole = (newRole: Role) => {
    const matched = DEMO_USERS.find(u => u.role === newRole)
    if (matched) {
      setUser(matched)
      localStorage.setItem("omni-user-role", newRole)
    }
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
        switchRole,
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
