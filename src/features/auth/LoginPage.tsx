import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../app/providers/AuthProvider"
import { api } from "../../services/api"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react"

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your institutional email address and password.")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      const success = await login(email.trim(), password)
      if (success) {
        // Inspect session role / profile to direct to student portal or admin console
        const check = await api.auth.check()
        const isStudent = check.data?.profile_type === "student" || check.data?.role === "student"
        if (isStudent) {
          navigate("/student/dashboard")
        } else if (check.data?.user?.is_superuser) {
          navigate("/admin/dashboard")
        } else {
          navigate("/app/dashboard")
        }
      } else {
        setErrorMessage("Authentication failed. Please verify your credentials.")
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Invalid email or password. Please verify that your account has been provisioned by an institution."
      )
    } finally {
      setIsLoading(false)
    }
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
          Enter your registered institutional credentials to access your workspace.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <Input
          label="Institutional Email"
          type="email"
          placeholder="user@institution.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
        />

        {/* Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full mt-2"
          size="lg"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In
        </Button>
      </form>

      {/* Security note */}
      <div className="pt-3 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>End-to-end encrypted session with RBAC role authorization</span>
      </div>
    </div>
  )
}
