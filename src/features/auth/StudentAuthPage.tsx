import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { api } from "../../services/api"
import { useAuth } from "../../app/providers/AuthProvider"
import { useTenant } from "../../app/providers/TenantProvider"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { Select } from "../../components/ui/Select"
import { 
  GraduationCap, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Building2, 
  User, 
  Phone, 
  FileText, 
  Calendar, 
  RotateCcw,
  Sparkles,
  Info,
  Loader2
} from "lucide-react"

type ActiveTab = "login" | "register" | "status"

export const StudentAuthPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { refreshSession } = useAuth()
  const { tenant } = useTenant()

  // Detect Link Query Params (?institution=... or ?tenant=... or ?inst=...)
  const institutionParam = searchParams.get("institution") || searchParams.get("tenant") || searchParams.get("inst") || searchParams.get("tenant_id")
  const isRegisterRoute = typeof window !== "undefined" && window.location.pathname.includes("/register")

  // Tab State: default to "register" if invitation link parameter or register route is present
  const initialTab: ActiveTab = (searchParams.get("tab") as ActiveTab) || (institutionParam || isRegisterRoute ? "register" : "login")
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab)

  // Track pre-selected institution from invitation link
  const [preselectedInstitution, setPreselectedInstitution] = useState<{ id: string; name: string; slug: string } | null>(null)

  // Institutions List
  const [institutions, setInstitutions] = useState<Array<{ id: string; name: string; slug: string }>>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)

  // Login State
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [loginError, setLoginError] = useState<any>(null)

  // Registration State
  const [regForm, setRegForm] = useState({
    tenant_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    admission_number: "",
    grade_or_program: "",
    gender: "F",
    phone_number: "",
    date_of_birth: "",
    notes: "",
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [regError, setRegError] = useState<string | null>(null)
  const [regSuccess, setRegSuccess] = useState<any>(null)

  // Status Check State
  const [statusEmail, setStatusEmail] = useState("")
  const [statusTenantId, setStatusTenantId] = useState("")
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [statusResult, setStatusResult] = useState<any>(null)
  const [statusError, setStatusError] = useState<string | null>(null)

  // Re-Request State
  const [isReRequesting, setIsReRequesting] = useState(false)
  const [reRequestNotes, setReRequestNotes] = useState("")
  const [reRequestMessage, setReRequestMessage] = useState<string | null>(null)
  const [reRequestError, setReRequestError] = useState<string | null>(null)

  // Load institutions list for registration dropdown
  useEffect(() => {
    const fetchInstitutions = async () => {
      setIsLoadingTenants(true)
      try {
        const res = await api.tenants.list()
        const activeList = Array.isArray(res) ? res : []
        setInstitutions(activeList)

        // If an institution was specified in the invitation link parameter, pre-select it
        if (institutionParam) {
          const cleanParam = institutionParam.trim().toLowerCase()
          const matched = activeList.find(
            (i) =>
              i.id.toLowerCase() === cleanParam ||
              i.slug?.toLowerCase() === cleanParam ||
              i.name?.toLowerCase() === cleanParam
          )
          if (matched) {
            setRegForm((prev) => ({ ...prev, tenant_id: matched.id }))
            setPreselectedInstitution(matched)
            setStatusTenantId(matched.id)
            return
          }
        }

        if (activeList.length > 0 && !regForm.tenant_id) {
          setRegForm((prev) => ({ ...prev, tenant_id: activeList[0].id }))
        }
      } catch (err) {
        console.warn("Could not load institutions list:", err)
      } finally {
        setIsLoadingTenants(false)
      }
    }
    fetchInstitutions()
  }, [])

  // Sync tab with URL
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
    setLoginError(null)
    setRegError(null)
    setRegSuccess(null)
    setStatusError(null)
  }

  // Handle Student Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail.trim() || !loginPassword) {
      setLoginError({ message: "Please enter your student email and password." })
      return
    }

    setIsLoggingIn(true)
    setLoginError(null)

    try {
      const targetTenantId = preselectedInstitution?.id || tenant?.id || undefined
      const res = await api.auth.studentLogin(loginEmail.trim(), loginPassword, targetTenantId)
      if (res?.access) {
        await refreshSession()
        navigate("/student/dashboard")
      } else {
        setLoginError({ message: "Authentication succeeded, but session initialization failed." })
      }
    } catch (err: any) {
      const data = err?.data
      if (data?.status === "pending" || data?.error?.code === "PENDING_APPROVAL") {
        setLoginError({
          type: "pending",
          message: data?.error?.message || "Your registration request is currently under review by the institution administration.",
          requested_at: data?.error?.requested_at,
          admission_number: data?.error?.admission_number,
          institution_name: data?.error?.institution_name,
        })
      } else if (data?.status === "rejected" || data?.error?.code === "REQUEST_REJECTED") {
        setLoginError({
          type: "rejected",
          message: data?.error?.message || "Your registration request was not approved.",
          rejection_reason: data?.error?.rejection_reason || "Details could not be verified.",
          can_re_request: data?.error?.can_re_request,
          hours_remaining: data?.error?.hours_remaining,
          eligible_re_request_at: data?.error?.eligible_re_request_at,
          tenant_id: data?.error?.tenant_id,
          email: loginEmail.trim(),
        })
      } else if (data?.status === "permanently_rejected" || data?.error?.code === "PERMANENTLY_REJECTED") {
        setLoginError({
          type: "permanently_rejected",
          message: data?.error?.message || "Your registration request has been permanently rejected.",
          rejection_reason: data?.error?.rejection_reason || "False or fraudulent application flagged by administration.",
        })
      } else {
        setLoginError({
          type: "general",
          message: err?.message || "Invalid student email or password. Please verify your credentials.",
        })
      }
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Handle Student Self-Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError(null)
    setRegSuccess(null)

    if (!regForm.tenant_id) {
      setRegError("Please select your educational institution.")
      return
    }
    if (!regForm.email.trim()) {
      setRegError("Please enter your email address.")
      return
    }
    if (regForm.password.length < 6) {
      setRegError("Password must be at least 6 characters.")
      return
    }
    if (regForm.password !== regForm.confirm_password) {
      setRegError("Passwords do not match.")
      return
    }
    if (!regForm.admission_number.trim()) {
      setRegError("Please provide your Student ID or Roll Number.")
      return
    }

    setIsRegistering(true)

    try {
      const payload = {
        tenant_id: regForm.tenant_id,
        email: regForm.email.trim(),
        password: regForm.password,
        first_name: regForm.first_name.trim(),
        last_name: regForm.last_name.trim(),
        phone_number: regForm.phone_number.trim(),
        admission_number: regForm.admission_number.trim(),
        grade_or_program: regForm.grade_or_program.trim(),
        gender: regForm.gender,
        date_of_birth: regForm.date_of_birth || null,
        notes: regForm.notes.trim(),
      }

      const res = await api.auth.studentRegister(payload)
      setRegSuccess(res)
    } catch (err: any) {
      const errorMsg = err?.data?.error?.message || err?.message || "Failed to submit student registration."
      setRegError(errorMsg)
    } finally {
      setIsRegistering(false)
    }
  }

  // Handle Status Check
  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!statusEmail.trim()) {
      setStatusError("Please enter your registered email address.")
      return
    }

    setIsCheckingStatus(true)
    setStatusError(null)
    setStatusResult(null)
    setReRequestMessage(null)
    setReRequestError(null)

    try {
      const res = await api.auth.studentCheckStatus(statusEmail.trim(), statusTenantId || undefined)
      if (res?.data) {
        setStatusResult(res.data)
      } else {
        setStatusError("No registration request found for this email.")
      }
    } catch (err: any) {
      setStatusError(err?.message || "No registration request found for this email address.")
    } finally {
      setIsCheckingStatus(false)
    }
  }

  // Handle Re-Request
  const handleReRequest = async (email: string, tenantId?: string) => {
    setIsReRequesting(true)
    setReRequestMessage(null)
    setReRequestError(null)

    try {
      const res = await api.auth.studentReRequest({
        email: email.trim(),
        tenant_id: tenantId,
        notes: reRequestNotes.trim(),
      })
      setReRequestMessage(res?.message || "Re-request submitted successfully! An administrator will review your application.")
      // Refresh status view if present
      if (statusResult) {
        setStatusResult((prev: any) => ({
          ...prev,
          status: "pending",
          can_re_request: false,
          re_request_count: (prev.re_request_count || 0) + 1,
        }))
      }
      // If triggered from login error
      if (loginError?.type === "rejected") {
        setLoginError({
          type: "pending",
          message: "Your re-request was submitted successfully and is now pending administrator review.",
        })
      }
    } catch (err: any) {
      const msg = err?.data?.error?.message || err?.message || "Could not submit re-request."
      setReRequestError(msg)
    } finally {
      setIsReRequesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F7F7] dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Portal Branding Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-[#3F72AF] to-[#112D4E] text-white shadow-lg shadow-[#3F72AF]/20">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#112D4E] dark:text-white">
              Student Academic Portal
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Dedicated gateway for learners: access courses, grades, schedules, and AI tutoring.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex rounded-xl bg-[#DBE2EF]/50 dark:bg-slate-900 p-1.5 border border-[#DBE2EF] dark:border-slate-800">
          <button
            type="button"
            onClick={() => handleTabChange("login")}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "login"
                ? "bg-[#112D4E] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("register")}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "register"
                ? "bg-[#112D4E] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-white"
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("status")}
            className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "status"
                ? "bg-[#112D4E] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-[#112D4E] dark:hover:text-white"
            }`}
          >
            Check Status
          </button>
        </div>

        {/* Pre-Selected Institution Invitation Banner */}
        {preselectedInstitution && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-[#DBE2EF] via-white to-[#F9F7F7] dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border border-[#3F72AF]/40 text-left flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3F72AF] to-[#112D4E] text-white flex items-center justify-center shrink-0 shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-[#3F72AF] font-extrabold uppercase tracking-wider">
                  Official Institution Invitation Link
                </div>
                <div className="text-sm font-bold text-[#112D4E] dark:text-white truncate">
                  {preselectedInstitution.name}
                </div>
                <div className="text-[11px] text-slate-500">
                  Institution is default-selected for your registration.
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
              ✓ Pre-Selected
            </span>
          </div>
        )}

        {/* Card Container */}
        <div className="mt-6 bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl border border-[#DBE2EF] dark:border-slate-800 p-6 sm:p-8">
          {/* ======================================================== */}
          {/* TAB 1: STUDENT SIGN IN */}
          {/* ======================================================== */}
          {activeTab === "login" && (
            <div className="space-y-6">
              <div className="border-b border-[#DBE2EF]/60 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-[#112D4E] dark:text-white">
                  Student Sign In
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your student credentials to enter your academic dashboard.
                </p>
              </div>

              {/* Status & Lifecycle Alert Messages */}
              {loginError && (
                <div>
                  {loginError.type === "pending" && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                        Verification Under Review
                      </div>
                      <p>{loginError.message}</p>
                      {loginError.requested_at && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300">
                          Submitted on: {new Date(loginError.requested_at).toLocaleString()}
                        </p>
                      )}
                      <p className="text-[11px] text-amber-700/80 dark:text-amber-400">
                        Once your institution administrator approves your admission details, you can log in immediately.
                      </p>
                    </div>
                  )}

                  {loginError.type === "rejected" && (
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200 text-xs space-y-3">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                        Registration Not Approved
                      </div>
                      <p>{loginError.message}</p>
                      {loginError.rejection_reason && (
                        <div className="p-2.5 rounded-lg bg-orange-100/60 dark:bg-orange-900/40 font-medium">
                          <strong>Admin Feedback:</strong> {loginError.rejection_reason}
                        </div>
                      )}
                      <div className="pt-1">
                        {loginError.can_re_request ? (
                          <div className="space-y-2">
                            <p className="text-emerald-700 dark:text-emerald-300 font-semibold">
                              ✓ The 24-hour cooldown period has passed. You can submit a verification re-request now.
                            </p>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add note to admin (e.g. corrected roll number)..."
                                value={reRequestNotes}
                                onChange={(e) => setReRequestNotes(e.target.value)}
                                className="text-xs"
                              />
                              <Button
                                type="button"
                                size="sm"
                                isLoading={isReRequesting}
                                onClick={() => handleReRequest(loginError.email, loginError.tenant_id)}
                                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                              >
                                Re-Request
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span>
                              Cooldown Active: You can re-request after{" "}
                              <strong>{loginError.hours_remaining ?? 24} hours</strong>
                              {loginError.eligible_re_request_at && ` (${new Date(loginError.eligible_re_request_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {loginError.type === "permanently_rejected" && (
                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                        Application Permanently Rejected
                      </div>
                      <p>{loginError.message}</p>
                      {loginError.rejection_reason && (
                        <p className="font-semibold text-rose-700 dark:text-rose-300">
                          Reason: {loginError.rejection_reason}
                        </p>
                      )}
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">
                        This applicant profile was flagged as a false or invalid request by administration. Future requests are disabled.
                      </p>
                    </div>
                  )}

                  {loginError.type === "general" && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <div className="flex-1 font-medium">{loginError.message}</div>
                    </div>
                  )}
                </div>
              )}

              {reRequestMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {reRequestMessage}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Student Institutional Email"
                  type="email"
                  placeholder="student@institution.edu"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                />

                <Button
                  type="submit"
                  className="w-full mt-2"
                  size="lg"
                  isLoading={isLoggingIn}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In to Academic Portal
                </Button>
              </form>

              <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div>
                  New student?{" "}
                  <button
                    type="button"
                    onClick={() => handleTabChange("register")}
                    className="text-[#3F72AF] font-bold hover:underline"
                  >
                    Create student account & request verification →
                  </button>
                </div>
                <div>
                  Submitted a request already?{" "}
                  <button
                    type="button"
                    onClick={() => handleTabChange("status")}
                    className="text-[#3F72AF] font-bold hover:underline"
                  >
                    Check verification status
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: CREATE STUDENT ACCOUNT & REQUEST VERIFICATION */}
          {/* ======================================================== */}
          {activeTab === "register" && (
            <div className="space-y-6">
              <div className="border-b border-[#DBE2EF]/60 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-[#112D4E] dark:text-white">
                  Student Registration
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in your details to create your account. An administrative verification request will be dispatched.
                </p>
              </div>

              {/* Registration Error */}
              {regError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{regError}</div>
                </div>
              )}

              {/* Registration Success */}
              {regSuccess ? (
                <div className="p-6 rounded-2xl bg-[#F9F7F7] dark:bg-slate-950 border border-[#3F72AF]/30 text-center space-y-4 animate-in fade-in">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#112D4E] dark:text-white">
                      Registration Request Submitted!
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                      {regSuccess?.message || "Your student account is created and pending approval by your institution."}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 text-left text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applicant:</span>
                      <span className="font-semibold text-[#112D4E] dark:text-white">
                        {regSuccess?.data?.applicant_name || `${regForm.first_name} ${regForm.last_name}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student ID / Roll No:</span>
                      <span className="font-mono font-bold text-[#3F72AF]">
                        {regSuccess?.data?.admission_number || regForm.admission_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Institution:</span>
                      <span className="font-medium">{regSuccess?.data?.tenant_name || "Assigned Institution"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                        Pending Verification
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleTabChange("status")}
                    >
                      Track Request Status
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={() => handleTabChange("login")}
                    >
                      Return to Sign In
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Select Institution */}
                  {preselectedInstitution ? (
                    <div className="space-y-1.5 text-left">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Assigned Educational Institution
                      </label>
                      <div className="p-3.5 rounded-xl border border-[#3F72AF]/40 bg-[#DBE2EF]/30 dark:bg-slate-800/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2 className="w-5 h-5 text-[#3F72AF] shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#112D4E] dark:text-white truncate">
                              {preselectedInstitution.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Institution Code: {preselectedInstitution.slug}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                          ✓ Default Selected
                        </span>
                      </div>
                    </div>
                  ) : (
                    <Select
                      label="Select Institution / University / School"
                      options={[
                        { value: "", label: isLoadingTenants ? "Loading institutions..." : "-- Select your institution --" },
                        ...institutions.map((i) => ({ value: i.id, label: `${i.name} (${i.slug})` })),
                      ]}
                      value={regForm.tenant_id}
                      onChange={(e) => setRegForm({ ...regForm, tenant_id: e.target.value })}
                      required
                    />
                  )}

                  {/* Name Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="First Name"
                      placeholder="e.g. Emma"
                      value={regForm.first_name}
                      onChange={(e) => setRegForm({ ...regForm, first_name: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      placeholder="e.g. Vance"
                      value={regForm.last_name}
                      onChange={(e) => setRegForm({ ...regForm, last_name: e.target.value })}
                      required
                    />
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="student@example.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                      required
                      leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                    />
                    <Input
                      label="Phone Number (Optional)"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={regForm.phone_number}
                      onChange={(e) => setRegForm({ ...regForm, phone_number: e.target.value })}
                      leftIcon={<Phone className="w-4 h-4 text-slate-400" />}
                    />
                  </div>

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Create Password"
                      type="password"
                      placeholder="Min 6 characters"
                      value={regForm.password}
                      onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                      required
                      leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Repeat password"
                      value={regForm.confirm_password}
                      onChange={(e) => setRegForm({ ...regForm, confirm_password: e.target.value })}
                      required
                      leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                    />
                  </div>

                  {/* Admission Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Student ID / Admission Number"
                      placeholder="e.g. ADM-2026-0042"
                      value={regForm.admission_number}
                      onChange={(e) => setRegForm({ ...regForm, admission_number: e.target.value })}
                      required
                      helperText="Official student ID assigned by institution"
                    />
                    <Input
                      label="Grade / Academic Program"
                      placeholder="e.g. B.Sc. Computer Science"
                      value={regForm.grade_or_program}
                      onChange={(e) => setRegForm({ ...regForm, grade_or_program: e.target.value })}
                    />
                  </div>

                  {/* Gender & DOB */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label="Gender"
                      options={[
                        { value: "F", label: "Female" },
                        { value: "M", label: "Male" },
                        { value: "O", label: "Other" },
                      ]}
                      value={regForm.gender}
                      onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}
                    />
                    <Input
                      label="Date of Birth (Optional)"
                      type="date"
                      value={regForm.date_of_birth}
                      onChange={(e) => setRegForm({ ...regForm, date_of_birth: e.target.value })}
                    />
                  </div>

                  {/* Notes / Message */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Message to Administrator (Optional)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-[#DBE2EF] bg-white px-3 py-2 text-sm text-[#112D4E] focus:ring-2 focus:ring-[#3F72AF] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                      placeholder="e.g. Enrolled in Fall semester, Section B..."
                      value={regForm.notes}
                      onChange={(e) => setRegForm({ ...regForm, notes: e.target.value })}
                    />
                  </div>

                  {/* Info Notice */}
                  <div className="p-3 rounded-xl bg-[#DBE2EF]/30 dark:bg-slate-800/40 border border-[#DBE2EF] dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#3F72AF] shrink-0 mt-0.5" />
                    <span>
                      After submitting, your institution administrator will verify your credentials. If rejected, you may re-request after a 24-hour verification cooldown.
                    </span>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    size="lg"
                    isLoading={isRegistering}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Submit Verification Request
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: CHECK VERIFICATION STATUS */}
          {/* ======================================================== */}
          {activeTab === "status" && (
            <div className="space-y-6">
              <div className="border-b border-[#DBE2EF]/60 dark:border-slate-800 pb-3">
                <h2 className="text-lg font-bold text-[#112D4E] dark:text-white">
                  Check Verification Status
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your registered student email to inspect your review status or submit a re-request.
                </p>
              </div>

              {statusError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{statusError}</div>
                </div>
              )}

              {reRequestMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {reRequestMessage}
                </div>
              )}

              {reRequestError && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  {reRequestError}
                </div>
              )}

              <form onSubmit={handleCheckStatus} className="flex gap-2">
                <Input
                  placeholder="Enter student email..."
                  type="email"
                  value={statusEmail}
                  onChange={(e) => setStatusEmail(e.target.value)}
                  required
                  leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                />
                <Button
                  type="submit"
                  isLoading={isCheckingStatus}
                  className="shrink-0"
                >
                  Lookup
                </Button>
              </form>

              {/* Status Result View */}
              {statusResult && (
                <div className="p-5 rounded-2xl bg-[#F9F7F7] dark:bg-slate-950 border border-[#DBE2EF] dark:border-slate-800 space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[#112D4E] dark:text-white">
                        {statusResult.applicant_name || statusResult.email}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        ID: {statusResult.admission_number}
                      </p>
                    </div>

                    {/* Status Badges */}
                    {statusResult.status === "pending" && (
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Pending Review
                      </span>
                    )}
                    {statusResult.status === "approved" && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    {statusResult.status === "rejected" && (
                      <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-bold text-xs flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Revision Required
                      </span>
                    )}
                    {statusResult.status === "permanently_rejected" && (
                      <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" /> Permanently Rejected
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF]/80 dark:border-slate-800 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Institution:</span>
                      <span className="font-semibold">{statusResult.tenant_name || "Educational Institution"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Program:</span>
                      <span>{statusResult.grade_or_program || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Last Requested:</span>
                      <span>{statusResult.last_requested_at ? new Date(statusResult.last_requested_at).toLocaleString() : "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Re-Requests Count:</span>
                      <span>{statusResult.re_request_count ?? 0}</span>
                    </div>
                    {statusResult.rejection_reason && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-rose-600 dark:text-rose-400">Rejection Reason:</span>
                        <p className="mt-0.5 text-slate-700 dark:text-slate-300 italic">
                          "{statusResult.rejection_reason}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Status Actions */}
                  {statusResult.status === "approved" && (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => {
                        setLoginEmail(statusResult.email)
                        handleTabChange("login")
                      }}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Sign In Now
                    </Button>
                  )}

                  {statusResult.status === "rejected" && (
                    <div className="space-y-3 pt-2">
                      {statusResult.can_re_request ? (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
                          <p className="font-bold text-emerald-800 dark:text-emerald-300">
                            Eligible to Re-Request
                          </p>
                          <p className="text-slate-600 dark:text-slate-400">
                            The cooldown gap has passed. Provide any updated remarks and click submit.
                          </p>
                          <Input
                            placeholder="Optional note for administrator..."
                            value={reRequestNotes}
                            onChange={(e) => setReRequestNotes(e.target.value)}
                            className="text-xs"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="w-full mt-2"
                            isLoading={isReRequesting}
                            onClick={() => handleReRequest(statusResult.email, statusResult.tenant)}
                            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          >
                            Submit Re-Request Verification
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Cooldown active. You can re-request after{" "}
                            <strong>{statusResult.re_request_cooldown_remaining_hours ?? 24} hours</strong>
                            {statusResult.eligible_re_request_at && ` (${new Date(statusResult.eligible_re_request_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {statusResult.status === "permanently_rejected" && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
                      Application marked as false by institution. Re-requesting is prohibited.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Footer Gateway Link to Staff Console */}
        <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <div>
            Educator, Faculty, or Administrator?{" "}
            <Link to="/auth/login" className="text-[#3F72AF] font-bold hover:underline">
              Go to Staff Portal Sign In →
            </Link>
          </div>
          <div className="text-[11px] text-slate-400">
            OMNI Educational Cloud • Multi-Tenant RBAC Security • End-to-End Encrypted Session
          </div>
        </div>
      </div>
    </div>
  )
}
