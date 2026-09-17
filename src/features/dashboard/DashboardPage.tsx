import React from "react"
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
  TrendingUp
} from "lucide-react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { StatsCard } from "../../components/ui/StatsCard"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { formatCurrency } from "../../lib/utils"
import { appStorage } from "../../services/storage"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

const ENROLLMENT_DATA = [
  { month: "Jan", learners: 2800, attendance: 92 },
  { month: "Feb", learners: 2950, attendance: 94 },
  { month: "Mar", learners: 3100, attendance: 91 },
  { month: "Apr", learners: 3200, attendance: 95 },
  { month: "May", learners: 3280, attendance: 93 },
  { month: "Jun", learners: 3420, attendance: 96 },
]

const DEPARTMENT_DISTRIBUTION = [
  { name: "Computer Science", value: 1240, color: "#6366f1" },
  { name: "Robotics & Hardware", value: 820, color: "#06b6d4" },
  { name: "Business & Econ", value: 680, color: "#10b981" },
  { name: "Mathematics", value: 680, color: "#f59e0b" },
]

export const DashboardPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { user } = useAuth()
  const navigate = useNavigate()

  const students = appStorage.getStudents()
  const staff = appStorage.getStaff()
  const invoices = appStorage.getInvoices()
  const announcements = appStorage.getAnnouncements().slice(0, 3)
  const timetable = appStorage.getTimetable().slice(0, 4)

  const totalOutstanding = invoices
    .filter(i => i.status !== "paid")
    .reduce((sum, i) => sum + (i.amount - i.paidAmount), 0)

  const totalCollected = invoices.reduce((sum, i) => sum + i.paidAmount, 0)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-white/20 text-white backdrop-blur-xs">
                {tenant.name}
              </span>
              <span className="text-xs text-indigo-200">
                • {tenant.subscriptionPlan} Tier
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 max-w-xl">
              Here is your live institutional overview for {tenant.name}. Terminology is automatically adapted for {tenant.type.replace('_', ' ')}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/app/students")}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Admit {t("learner")}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate("/app/attendance")}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Mark Attendance
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={`Total ${t("learners")}`}
          value={tenant.currentLearners.toLocaleString()}
          change={{ value: "8.4%", isPositive: true, label: "vs last term" }}
          icon={<Users className="w-5 h-5" />}
          colorVariant="indigo"
        />
        <StatsCard
          title={`Active ${t("educators")}`}
          value={staff.length}
          description="100% faculty allocated"
          icon={<GraduationCap className="w-5 h-5" />}
          colorVariant="emerald"
        />
        <StatsCard
          title="Attendance Rate"
          value="95.2%"
          change={{ value: "1.2%", isPositive: true, label: "this week" }}
          icon={<CheckCircle2 className="w-5 h-5" />}
          colorVariant="sky"
        />
        <StatsCard
          title="Fee Revenue"
          value={formatCurrency(totalCollected, tenant.currency)}
          description={`${formatCurrency(totalOutstanding, tenant.currency)} pending collection`}
          icon={<Wallet className="w-5 h-5" />}
          colorVariant="amber"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Growth Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>{t("learner")} Enrollment & Retention Trajectory</CardTitle>
              <p className="text-xs text-slate-500">6-month trend across active cohorts</p>
            </div>
            <Badge variant="primary">2026 Academic Year</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ENROLLMENT_DATA}>
                  <defs>
                    <linearGradient id="colorLearners" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      fontSize: "12px",
                      border: "none"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="learners"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorLearners)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Cohort Distribution</CardTitle>
            <p className="text-xs text-slate-500">Learners by department or program</p>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DEPARTMENT_DISTRIBUTION}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {DEPARTMENT_DISTRIBUTION.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-1.5 pt-2 text-xs">
              {DEPARTMENT_DISTRIBUTION.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[140px]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Widget Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Today's Academic Schedule</CardTitle>
              <p className="text-xs text-slate-500">Live lecture & lab sessions</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/timetable")}
            >
              Full Timetable →
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {timetable.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] shrink-0">
                    {slot.startTime}
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-900 dark:text-slate-100">
                      {slot.courseName}
                    </h5>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      {slot.instructorName} • {slot.room}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{slot.batchName}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Latest Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Institutional Bulletins</CardTitle>
              <p className="text-xs text-slate-500">Official notices & broadcasts</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app/communications")}
            >
              All Bulletins →
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {announcements.map((anc) => (
              <div
                key={anc.id}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={anc.priority === "urgent" ? "danger" : anc.priority === "high" ? "warning" : "secondary"}>
                    {anc.priority}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{anc.date}</span>
                </div>
                <h5 className="font-semibold text-slate-900 dark:text-slate-100">
                  {anc.title}
                </h5>
                <p className="text-slate-600 dark:text-slate-300 line-clamp-2 text-[11px]">
                  {anc.content}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
