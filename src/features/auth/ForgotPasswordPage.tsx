import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
    }, 600)
  }

  return (
    <div className="w-full space-y-6 text-left">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enter your registered institutional email to receive a recovery link.
        </p>
      </div>

      {isSubmitted ? (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Password Reset Email Sent
          </div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            We sent instructions to <strong>{email}</strong>. Please check your inbox and spam folder.
          </p>
          <Link to="/auth/login">
            <Button variant="outline" size="sm" className="w-full mt-2">
              Return to Sign In
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Institutional Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
            placeholder="your.email@institution.edu"
          />

          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Send Recovery Link
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
