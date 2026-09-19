import React from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarClock, 
  CheckCircle2, 
  FileSpreadsheet, 
  Wallet, 
  Megaphone, 
  BookMarked, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  ShieldAlert,
  ScrollText
} from "lucide-react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { cn } from "../../lib/utils"

interface SidebarProps {
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { tenant, t } = useTenant()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navGroups = [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", path: "/app/dashboard", icon: LayoutDashboard, permission: "view:all" },
        { label: "Announcements", path: "/app/communications", icon: Megaphone, permission: "view:all" },
      ]
    },
    {
      group: "People",
      items: [
        { label: t("learners"), path: "/app/students", icon: Users, permission: "view:all" },
        { label: t("educators"), path: "/app/staff", icon: GraduationCap, permission: "view:all" },
      ]
    },
    {
      group: "Academics",
      items: [
        { label: `${t("programs")} & ${t("classes")}`, path: "/app/academics", icon: BookOpen, permission: "view:all" },
        { label: "Weekly Timetable", path: "/app/timetable", icon: CalendarClock, permission: "view:all" },
        { label: "Attendance Matrix", path: "/app/attendance", icon: CheckCircle2, permission: "view:all" },
        { label: "Exams & Marks", path: "/app/examinations", icon: FileSpreadsheet, permission: "view:all" },
      ]
    },
    {
      group: "Operations & Learning",
      items: [
        { label: "Finance & Invoices", path: "/app/finance", icon: Wallet, permission: "view:finance" },
        { label: "Assignments & LMS", path: "/app/learning", icon: BookMarked, permission: "view:all" },
        { label: "Reports & Exports", path: "/app/reports", icon: BarChart3, permission: "view:all" },
      ]
    },
    {
      group: "Administration",
      items: [
        { label: "Tenant & RBAC Settings", path: "/app/settings", icon: Settings, permission: "institute_admin" },
        { label: "Security & Audit Logs", path: "/app/audit-logs", icon: ScrollText, permission: "institute_admin" }
      ]
    }
  ]

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 border-r border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 overflow-hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {tenant.code.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {tenant.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">
                  {tenant.type.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <div
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar"
        >
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                {grp.group}
              </p>
              <div className="space-y-1">
                {grp.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                          isActive
                            ? "bg-indigo-50 text-indigo-700 font-semibold dark:bg-indigo-950/50 dark:text-indigo-300"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200"
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          {/* SuperAdmin Console Direct Link */}
          {Boolean(user?.is_superuser) && (
            <NavLink
              to="/admin/dashboard"
              onClick={onCloseMobile}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-indigo-500/40 text-indigo-300 hover:bg-slate-800 hover:text-white transition-all text-xs font-semibold shadow-md group"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>SuperAdmin Console</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
            </NavLink>
          )}

          {/* User profile */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <img
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                alt={user?.name}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user?.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
            </div>

            <button
              onClick={async () => {
                await logout()
                navigate("/auth/login")
              }}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
