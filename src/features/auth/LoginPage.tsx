import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../app/providers/AuthProvider"
import { useTenant } from "../../app/providers/TenantProvider"
import { Role } from "../../types"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Select } from "../../components/ui/Select"
import { Lock, Mail, Building, Sparkles, ArrowRight } from "lucide-react"

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login, availableRoles } = useAuth()
  const { tenant, tenants, setTenantId } = useTenant()

  const [email, setEmail] = useState("eleanor.vance@omni-edu.org")
  const [password, setPassword] = useState("••••••••••••")
  const [selectedRole, setSelectedRole] = useState<Role>("institute_admin")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      login(email, selectedRole)
      setIsLoading(false)
      navigate("/app/dashboard")
    }, 600)
  }

  const fillDemoRole = (role: Role, demoEmail: string) => {
    setSelectedRole(role)
    setEmail(demoEmail)
  }

  return (
    <div className="w-full space-y-6">
      {/* Mobile Brand Header */}
      <div className="lg:hidden text-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-2 shadow-md">
          Ω
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">OMNI Edu SaaS</h2>
      </div>

      <div className="text-left space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Sign In to Portal
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Enter your institutional credentials to access your workspace.
        </p>
      </div>

      {/* Quick Demo Credentials Pill Selector */}
      <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> One-Click Role Simulator
          </span>
          <span className="text-[10px] text-slate-400">Select persona:</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => fillDemoRole("institute_admin", "eleanor.vance@omni-edu.org")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
              selectedRole === "institute_admin"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            🏛️ Admin
          </button>
          <button
            type="button"
            onClick={() => fillDemoRole("faculty", "arthur.pendelton@omni-edu.org")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
              selectedRole === "faculty"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            🎓 Faculty
          </button>
          <button
            type="button"
            onClick={() => fillDemoRole("student", "sophia.martinez@student.omni-edu.org")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
              selectedRole === "student"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            📚 Student
          </button>
          <button
            type="button"
            onClick={() => fillDemoRole("accountant", "marcus.sterling@omni-edu.org")}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${
              selectedRole === "accountant"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            💳 Bursar / Fin
          </button>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Tenant selection */}
        <Select
          label="Target Educational Institution"
          value={tenant.id}
          onChange={(e) => setTenantId(e.target.value)}
          options={tenants.map(t => ({ value: t.id, label: `${t.name} (${t.type.replace('_', ' ')})` }))}
        />

        {/* Email */}
        <Input
          label="Email Address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          placeholder="your.name@institution.edu"
        />

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            placeholder="••••••••••••"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In to Workspace
        </Button>
      </form>

      <div className="text-center pt-2">
        <Link
          to="/"
          className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
        >
          ← Back to Public Portal
        </Link>
      </div>
    </div>
  )
}
