import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Users, 
  GraduationCap, 
  CalendarClock, 
  Wallet, 
  CheckCircle2, 
  ArrowUpRight, 
  Megaphone, 
  Plus, 
  FileSpreadsheet, 
  Sparkles,
  TrendingUp,
  ShieldCheck
} from "lucide-react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { StatsCard } from "../../components/ui/StatsCard"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { formatCurrency } from "../../lib/utils"
import { api } from "../../services/api"

export const DashboardPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [studentsCount, setStudentsCount] = useState<number>(0)
  const [staffCount, setStaffCount] = useState<number>(0)
  const [invoices, setInvoices] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [classesCount, setClassesCount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    Promise.all([
      api.students.list(),
      api.staff.list(),
      api.finance.getInvoices(),
      api.communications.getAnnouncements(),
      api.academics.getClasses(),
    ]).then(([studentsRes, staffRes, invoicesRes, ancRes, classesRes]) => {
      if (!isMounted) return
      if (Array.isArray(studentsRes)) setStudentsCount(studentsRes.length)
      if (Array.isArray(staffRes)) setStaffCount(staffRes.length)
      if (Array.isArray(invoicesRes)) setInvoices(invoicesRes)
      if (Array.isArray(classesRes)) setClassesCount(classesRes.length)
      if (Array.isArray(ancRes)) {
        setAnnouncements(ancRes.slice(0, 3).map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          author: a.author_name || a.author?.full_name || "Administration",
          authorRole: "Admin",
          date: a.published_at ? a.published_at.split("T")[0] : new Date().toISOString().split("T")[0],
          priority: "normal",
          audience: a.target_audience || "all",
          category: "Academic",
        })))
      }
    }).catch((err) => {
      console.warn("Dashboard sync warning:", err)
    }).finally(() => {
      if (isMounted) setIsLoading(false)
    })

    return () => { isMounted = false }
  }, [tenant.id])

  const totalOutstanding = invoices
    .filter((i: any) => i.status !== "paid")
    .reduce((sum: number, i: any) => {
      const amt = Number(i.total_amount ?? i.amount ?? 0)
      const paid = Number(i.paid_amount ?? i.paidAmount ?? 0)
      return sum + (amt - paid)
    }, 0)

  const totalCollected = invoices.reduce((sum: number, i: any) => {
    return sum + Number(i.paid_amount ?? i.paidAmount ?? 0)
  }, 0)

  const totalInvoiced = invoices.reduce((sum: number, i: any) => {
    return sum + Number(i.total_amount ?? i.amount ?? 0)
  }, 0)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 text-white backdrop-blur-xs">
                {tenant?.name || "Institution"}
              </span>
              <button
                type="button"
                onClick={() => navigate("/app/plans")}
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-400/25 hover:bg-amber-400/35 text-amber-200 border border-amber-300/30 backdrop-blur-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{tenant?.subscriptionPlan || "Professional"} Plan</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name || "Administrator"}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/80 max-w-xl">
              Live multi-tenant institutional console. Real-time synchronisation active on port 8000.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/app/plans")}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold border-0 shadow-sm"
              leftIcon={<Sparkles className="w-4 h-4 text-slate-950" />}
            >
              Subscription Plans
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/app/students?admit=true")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Admit {t("learner")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/app/attendance")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              leftIcon={<CalendarClock className="w-4 h-4" />}
            >
              Mark Attendance
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={`Total Enrolled ${t("learners")}`}
          value={studentsCount.toLocaleString()}
          description="Active student registry records"
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          title={`Active ${t("educators")} & Staff`}
          value={staffCount.toLocaleString()}
          description="Faculty & administration members"
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <StatsCard
          title={`Academic ${t("classes")}`}
          value={classesCount.toLocaleString()}
          description="Class cohorts & lecture streams"
          icon={<CalendarClock className="w-5 h-5" />}
        />
        <StatsCard
          title="Total Fee Collections"
          value={formatCurrency(totalCollected, tenant.currency)}
          description={`Out of ${formatCurrency(totalInvoiced, tenant.currency)} billed`}
          icon={<Wallet className="w-5 h-5 text-emerald-600" />}
        />
      </div>

      {/* Main Content Split: Bulletins & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Institutional Overview & Recent Announcements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Broadcasts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-indigo-600" />
                  Live Institutional Circulars
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Most recent broadcasts from administrative office</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/app/communications")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {announcements.map((anc) => (
                <div
                  key={anc.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {anc.title}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {anc.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {anc.content}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                    <span>By {anc.author}</span>
                    <span>•</span>
                    <span className="uppercase font-semibold text-indigo-600 dark:text-indigo-400">{anc.audience}</span>
                  </div>
                </div>
              ))}

              {announcements.length === 0 && !isLoading && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No circulars published yet. Use the Communications page to broadcast news.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Quick Modules & System Integrity */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <button
                type="button"
                onClick={() => navigate("/app/plans")}
                className="w-full p-3 rounded-xl border border-amber-300/60 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500 text-left transition-all flex items-center justify-between group shadow-xs"
              >
                <div>
                  <p className="text-xs font-bold text-[#112D4E] dark:text-amber-200 group-hover:text-[#3F72AF] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Subscription Plans & Quotas
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">View Starter, Professional & Enterprise tiers</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-amber-500 group-hover:text-[#3F72AF]" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/app/students")}
                className="w-full p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">Student Directory</p>
                  <p className="text-[11px] text-slate-400">View and manage admissions</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/app/staff")}
                className="w-full p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">Faculty & Staff</p>
                  <p className="text-[11px] text-slate-400">Instructor department assignments</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/app/finance")}
                className="w-full p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">Fee Collection Ledger</p>
                  <p className="text-[11px] text-slate-400">Record payments and audit dues</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/app/examinations")}
                className="w-full p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">Examinations & Marks</p>
                  <p className="text-[11px] text-slate-400">Enter grades and export transcripts</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>
            </CardContent>
          </Card>

          {/* Multi-Tenant Security Badge */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Multi-Tenant Data Isolation
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              All queries and transactions are strictly scoped to <span className="font-semibold text-indigo-700 dark:text-indigo-300">{tenant.name}</span> with row-level security headers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
