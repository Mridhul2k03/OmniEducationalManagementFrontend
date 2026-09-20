import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { api } from "../../services/api"
import { formatCurrency } from "../../lib/utils"
import { 
  Building2, 
  Users, 
  GraduationCap, 
  Wallet, 
  Shield, 
  ArrowUpRight, 
  Plus, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Server,
  ChevronRight,
  Sparkles,
  Lock,
  RefreshCw
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { StatsCard } from "../../components/ui/StatsCard"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card"

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const fetchStats = async () => {
    setIsRefreshing(true)
    try {
      const data = await api.platformAdmin.getStats()
      setStats(data)
    } catch (err) {
      console.warn("Failed to load platform stats:", err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-indigo-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-6 sm:p-8 border border-indigo-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/10 text-indigo-200 border border-white/20">
              <Shield className="w-3.5 h-3.5 text-indigo-300" /> Platform Control Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Global Platform Command Center
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/80 dark:text-slate-300 max-w-xl leading-relaxed">
              Top-level SaaS administration. Monitor client institutions, control multi-tenant user access, manage license quotas, and review global audit events.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/admin/tenants?new=true")}
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-white text-indigo-900 hover:bg-slate-100 font-bold"
            >
              Onboard Institution
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin/users?new=true")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              leftIcon={<Users className="w-4 h-4" />}
            >
              Add Platform User
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Client Institutions"
          value={stats?.tenants?.total?.toLocaleString() || "0"}
          description={`${stats?.tenants?.active || 0} active • ${stats?.tenants?.suspended || 0} suspended`}
          icon={<Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          colorVariant="indigo"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs"
        />
        <StatsCard
          title="Total User Accounts"
          value={stats?.users?.total?.toLocaleString() || "0"}
          description={`${stats?.users?.active || 0} active across organizations`}
          icon={<Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          colorVariant="emerald"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs"
        />
        <StatsCard
          title="Enrolled Learners"
          value={stats?.academics?.total_students?.toLocaleString() || "0"}
          description="Total student profiles in system"
          icon={<GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
          colorVariant="violet"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs"
        />
        <StatsCard
          title="Gross SaaS Billings"
          value={formatCurrency(stats?.finance?.total_invoiced || 0, "USD")}
          description={`Collected: ${formatCurrency(stats?.finance?.total_collected || 0, "USD")}`}
          icon={<Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          colorVariant="amber"
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs"
        />
      </div>

      {/* Main Content Split: Recent Tenants & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Client Institutions */}
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div>
              <CardTitle className="text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Recent Client Institutions
              </CardTitle>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Institutions provisioned on the platform</p>
            </div>
            <Link
              to="/admin/tenants"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {stats?.recent_tenants?.map((t: any) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 hover:border-indigo-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-500/30">
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">slug: {t.slug} • type: {t.institution_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={t.status === "active" ? "success" : "danger"}>
                    {t.status.toUpperCase()}
                  </Badge>
                  <Link
                    to="/admin/tenants"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}

            {(!stats?.recent_tenants || stats.recent_tenants.length === 0) && (
              <div className="p-8 text-center text-xs text-slate-400">
                No client institutions registered yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Recent Users & System Diagnostics */}
        <div className="space-y-6">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <CardTitle className="text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Recent User Accounts
                </CardTitle>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Newly provisioned platform accounts</p>
              </div>
              <Link
                to="/admin/users"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 flex items-center gap-1"
              >
                Manage Users <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {stats?.recent_users?.map((u: any) => (
                <div
                  key={u.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                      {u.first_name ? u.first_name[0].toUpperCase() : u.email[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.full_name || u.email}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {u.is_superuser && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                        SUPER
                      </span>
                    )}
                    <Badge variant={u.is_active ? "success" : "danger"}>
                      {u.is_active ? "ACTIVE" : "LOCKED"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Platform Status Card */}
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Multi-Tenant Core Engine
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-500/30">
                    HEALTHY
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">DRF Backend listening on port 8000 with row-level isolation</p>
              </div>
            </div>
            <Link
              to="/admin/system"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
