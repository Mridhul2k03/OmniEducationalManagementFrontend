import React, { createContext, useContext, useState } from "react"
import { User, Role } from "../../types"
import { DEMO_USERS } from "../../services/mockData"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, role?: Role) => void
  logout: () => void
  switchRole: (role: Role) => void
  can: (permission: string) => boolean
  availableRoles: { role: Role; label: string; description: string }[]
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

  const login = (email: string, preferredRole: Role = "institute_admin") => {
    const matched = DEMO_USERS.find(u => u.role === preferredRole) || {
      ...DEMO_USERS[0],
      email,
      name: email.split("@")[0].toUpperCase()
    }
    setUser(matched)
    localStorage.setItem("omni-user-role", matched.role)
  }

  const logout = () => {
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
        login,
        logout,
        switchRole,
        can,
        availableRoles: AVAILABLE_ROLES
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
