import React, { createContext, useContext, useState, useEffect } from "react"
import { User, Role } from "../../types"
import { api } from "../../services/api"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isInstitutionSuperAdmin: boolean
  isSuperAdmin: boolean
  login: (email: string, password?: string) => Promise<boolean>
  logout: () => Promise<void>
  can: (permission: string) => boolean
  availableRoles: { role: Role; label: string; description: string }[]
  backendConnected: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const AVAILABLE_ROLES: { role: Role; label: string; description: string }[] = [
  { role: "institution_super_admin", label: "Institution Super Admin", description: "Complete institutional control, user & admin management" },
  { role: "institution_admin", label: "Institution Admin (Delegated)", description: "Delegated management of staff, learners, operations" },
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
        const isInstSuper = Boolean(authData.is_institution_superadmin || authData.user.is_superuser || authData.role === "institution_super_admin" || authData.role === "super_admin")
        let roleCode: Role = "faculty"
        if (authData.user.is_superuser) {
          roleCode = "super_admin"
        } else if (authData.profile_type === "student" || authData.role === "student") {
          roleCode = "student"
        } else if (isInstSuper) {
          roleCode = "institution_super_admin"
        } else if (authData.role) {
          roleCode = authData.role as Role
        }

        const liveUser: User = {
          id: authData.user.id,
          name: authData.user.full_name || authData.user.email,
          email: authData.user.email,
          role: roleCode,
          tenantId: authData.active_tenant?.id || "oxford-crest",
          permissions: isInstSuper ? ["*"] : (authData.permissions?.length ? authData.permissions : []),
          is_superuser: !!authData.user.is_superuser,
          is_staff: !!authData.user.is_staff,
          is_institution_superadmin: isInstSuper,
          profile_type: authData.profile_type || (roleCode === "student" ? "student" : "admin"),
          student_profile: authData.student_profile,
          staff_profile: authData.staff_profile,
          subscription_plan: authData.subscription_plan || "professional",
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
          const isInstSuper = Boolean(authData.is_institution_superadmin || authData.user.is_superuser || authData.role === "institution_super_admin" || authData.role === "super_admin")
          let roleCode: Role = "faculty"
          if (authData.user.is_superuser) {
            roleCode = "super_admin"
          } else if (authData.profile_type === "student" || authData.role === "student" || loginRes.profile_type === "student" || loginRes.role === "student") {
            roleCode = "student"
          } else if (isInstSuper) {
            roleCode = "institution_super_admin"
          } else if (authData.role) {
            roleCode = authData.role as Role
          }

          const authenticatedUser: User = {
            id: authData.user.id,
            name: authData.user.full_name || authData.user.email,
            email: authData.user.email,
            role: roleCode,
            tenantId: authData.active_tenant?.id || loginRes.active_tenant?.id || "oxford-crest",
            permissions: isInstSuper ? ["*"] : (authData.permissions?.length ? authData.permissions : []),
            is_superuser: !!authData.user.is_superuser,
            is_staff: !!authData.user.is_staff,
            is_institution_superadmin: isInstSuper,
            profile_type: authData.profile_type || loginRes.profile_type || (roleCode === "student" ? "student" : "admin"),
            student_profile: authData.student_profile || loginRes.student_profile,
            staff_profile: authData.staff_profile || loginRes.staff_profile,
            subscription_plan: authData.subscription_plan || loginRes.subscription_plan || "professional",
          }

          if (authData.active_tenant?.id) {
            api.setActiveTenantId(authData.active_tenant.id)
          }
          setUser(authenticatedUser)
          return true
        }

        // Fallback with login response data
        const isStudentLogin = loginRes.profile_type === "student" || loginRes.role === "student"
        const fallbackRole = loginRes.user?.is_superuser
          ? "super_admin"
          : (isStudentLogin ? "student" : "institution_super_admin")
        const fallbackUser: User = {
          id: loginRes.user.id,
          name: loginRes.user.full_name || loginRes.user.email,
          email: loginRes.user.email,
          role: fallbackRole as Role,
          tenantId: loginRes.active_tenant?.id || "oxford-crest",
          permissions: isStudentLogin ? ["student_portal"] : ["*"],
          is_superuser: !!loginRes.user?.is_superuser,
          is_staff: !!loginRes.user?.is_staff,
          is_institution_superadmin: !isStudentLogin && !loginRes.user?.is_superuser,
          profile_type: loginRes.profile_type || (isStudentLogin ? "student" : "admin"),
          student_profile: loginRes.student_profile,
          staff_profile: loginRes.staff_profile,
          subscription_plan: loginRes.subscription_plan || "professional",
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

  const isInstSuper = Boolean(
    user?.is_superuser ||
    user?.is_institution_superadmin ||
    user?.role === "institution_super_admin" ||
    user?.role === "super_admin"
  )

  const isSuper = Boolean(user?.is_superuser)

  const can = (permission: string): boolean => {
    if (!user) return false
    if (isInstSuper) return true
    if (user.permissions.includes("*")) return true
    if (permission === "institute_admin" || permission === "institution_admin") {
      return isInstSuper || user.role === "institution_admin" || user.role === "institute_admin"
    }
    if (user.permissions.includes(permission)) return true
    return false
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInstitutionSuperAdmin: isInstSuper,
        isSuperAdmin: isSuper,
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
