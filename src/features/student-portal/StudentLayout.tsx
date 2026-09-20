import React, { useState } from "react"
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom"
import { 
  GraduationCap, 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  Award, 
  CreditCard, 
  Sparkles, 
  Sun, 
  Moon, 
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  ShieldAlert,
  ArrowLeft
} from "lucide-react"
import { useAuth } from "../../app/providers/AuthProvider"
import { useTheme } from "../../app/providers/ThemeProvider"
import { PlanGateModal } from "../subscription/PlanGateModal"
import { useSubscriptionPlan } from "../subscription/useSubscriptionPlan"

export const StudentLayout: React.FC = () => {
  const { user, logout, isInstitutionSuperAdmin, isSuperAdmin } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const { 
    currentPlanId, 
    availablePlans, 
    upgradeModalOpen, 
    setUpgradeModalOpen, 
    lockedFeatureName, 
    upgradeTo, 
    upgrading 
  } = useSubscriptionPlan()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  const navItems = [
    { to: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/timetable", label: "Class Timetable", icon: CalendarDays },
    { to: "/student/attendance", label: "Attendance", icon: Clock },
    { to: "/student/grades", label: "Grades & Exams", icon: Award },
    { to: "/student/fees", label: "Fee Ledger", icon: CreditCard },
    { 
      to: "/student/ai-tutor", 
      label: "Gemini AI Tutor", 
      icon: Sparkles, 
      badge: "AI 2.5",
      isAi: true 
    },
  ]

  const isStaffOrAdminPreview = isInstitutionSuperAdmin || isSuperAdmin || user?.role === "faculty"

  return (
    <div className="min-h-screen bg-[#F9F7F7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Banner if viewing in preview mode */}
      {isStaffOrAdminPreview && (
        <div className="bg-[#112D4E] text-[#DBE2EF] text-xs py-2 px-4 sm:px-6 lg:px-8 border-b border-[#3F72AF]/40">
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">
                <strong>Student Portal View</strong>: You are viewing this portal with Administrative privileges ({user?.role}).
              </span>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1 text-xs text-white hover:text-[#DBE2EF] underline font-medium shrink-0 whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Console
            </Link>
          </div>
        </div>
      )}

      {/* Main Student Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-[#DBE2EF] dark:border-slate-800 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-3 sm:gap-6">
          {/* Logo & Portal Branding */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-[#DBE2EF]/50 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/student/dashboard" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3F72AF] to-[#112D4E] flex items-center justify-center text-white shadow-md shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="shrink-0">
                <span className="font-extrabold text-base sm:text-lg text-[#112D4E] dark:text-white tracking-tight flex items-center gap-1.5 leading-tight">
                  OMNI <span className="text-[#3F72AF]">Learner</span>
                </span>
                <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide leading-tight">
                  Student Academic Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0 overflow-x-auto no-scrollbar py-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition-all ${
                      isActive
                        ? item.isAi
                          ? "bg-gradient-to-r from-[#3F72AF] to-indigo-600 text-white shadow-sm"
                          : "bg-[#3F72AF] text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-[#DBE2EF]/60 dark:hover:bg-slate-800 hover:text-[#112D4E] dark:hover:text-white"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-400 text-[#112D4E] uppercase tracking-wider shrink-0 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Right Tools: Theme Toggle, Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl border border-[#DBE2EF] dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#DBE2EF]/50 dark:hover:bg-slate-800 transition-colors"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#3F72AF]" />}
            </button>

            {/* Student Identity Pill */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#DBE2EF] dark:border-slate-800 shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#3F72AF] text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
              </div>
              <div className="hidden sm:flex flex-col text-left shrink-0">
                <span className="text-xs font-bold text-[#112D4E] dark:text-white max-w-[140px] truncate leading-tight">
                  {user?.name || "Student"}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {user?.student_profile?.admission_number || "Learner"}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
              title="Sign out of student portal"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#DBE2EF] dark:border-slate-800 bg-[#F9F7F7] dark:bg-slate-900 p-4 space-y-2 animate-fade-in">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-[#3F72AF] text-white"
                        : "text-slate-700 dark:text-slate-300 hover:bg-[#DBE2EF] dark:hover:bg-slate-800"
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-[#112D4E]">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  )}
                </NavLink>
              )
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Student Portal Footer */}
      <footer className="mt-auto border-t border-[#DBE2EF] dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-4 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            OMNI Educational Management • Student Information & Learning Hub
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">Powered by Gemini AI 2.5 Flash</span>
          </div>
        </div>
      </footer>

      {/* Plan Gate Modal */}
      <PlanGateModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlanId={currentPlanId}
        availablePlans={availablePlans}
        lockedFeature={lockedFeatureName}
        onUpgrade={upgradeTo}
        isUpgrading={upgrading}
      />
    </div>
  )
}
