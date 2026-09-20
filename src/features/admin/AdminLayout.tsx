import React, { useState } from "react"
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../../app/providers/AuthProvider"
import { useTheme } from "../../app/providers/ThemeProvider"
import { 
  Shield, 
  Users, 
  Building2, 
  Layers, 
  ScrollText, 
  Activity, 
  LayoutDashboard, 
  ArrowLeftRight, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight, 
  Sun, 
  Moon, 
  Sparkles, 
  Server 
} from "lucide-react"

const ADMIN_NAV_ITEMS = [
  { path: "/admin/dashboard", label: "Executive Overview", icon: LayoutDashboard },
  { path: "/admin/users", label: "User Control Center", icon: Users },
  { path: "/admin/tenants", label: "Institutions & Tenants", icon: Building2 },
  { path: "/admin/subscriptions", label: "SaaS Plans & Quotas", icon: Layers },
  { path: "/admin/audit-logs", label: "Security & Audit Logs", icon: ScrollText },
  { path: "/admin/system", label: "System Diagnostics", icon: Activity },
]

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate("/auth/login")
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors">
      {/* SuperAdmin Sidebar (Desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#3F72AF] to-[#112D4E] text-white font-black text-lg flex items-center justify-center shadow-lg shadow-[#3F72AF]/25">
              Ω
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wider uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                OMNI <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#DBE2EF] dark:bg-indigo-500/20 text-[#112D4E] dark:text-indigo-400 font-bold border border-[#DBE2EF] dark:border-indigo-500/30">ADMIN</span>
              </h2>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Global SaaS Control Console</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Platform Operations
          </div>
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-[#3F72AF] text-white shadow-md shadow-[#3F72AF]/25 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-[#DBE2EF]/60 dark:hover:bg-slate-800/60"
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Tenant App Switcher & User Profile Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/80 dark:bg-slate-900/80">
          <Link
            to="/app/dashboard"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#DBE2EF]/60 dark:bg-indigo-950/40 border border-[#DBE2EF] dark:border-indigo-800/40 text-[#112D4E] dark:text-indigo-300 hover:bg-[#DBE2EF] dark:hover:bg-indigo-900/50 hover:text-[#112D4E] dark:hover:text-white transition-all text-xs font-medium group"
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#3F72AF] dark:text-indigo-400" />
              <span>Switch to Tenant Workspace</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#3F72AF] dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-full bg-[#3F72AF] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name[0].toUpperCase() : "S"}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name || "SuperAdmin"}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 lg:pl-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#3F72AF] dark:text-indigo-400 hidden sm:block" />
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                SuperAdmin Platform Control Panel
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors shadow-2xs"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Tenant Portal Link */}
            <Link
              to="/app/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3F72AF] hover:bg-[#2d568c] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              Tenant Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex">
          <div className="w-72 bg-white dark:bg-slate-900 h-full p-5 flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">OMNI SUPERADMIN</h2>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-1 overflow-y-auto">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? "bg-[#3F72AF] text-white font-bold"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
              >
                {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                <span>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</span>
              </button>
              <Link
                to="/app/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#3F72AF] hover:bg-[#2d568c] text-white text-xs font-semibold"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Go to Tenant Portal
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-xs font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
        <Outlet />
      </main>
    </div>
  )
}
