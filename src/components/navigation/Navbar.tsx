import React, { useState } from "react"
import { useLocation, useNavigate, Link } from "react-router-dom"
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  ShieldCheck, 
  ExternalLink, 
  BookOpen,
  Shield
} from "lucide-react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { useTheme } from "../../app/providers/ThemeProvider"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { Modal } from "../ui/Modal"

interface NavbarProps {
  onOpenMobileMenu: () => void
  onOpenCommandPalette: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onOpenCommandPalette }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const [isNotificationOpen, setIsNotificationOpen] = useState(false)

  // Generate breadcrumb title
  const pathParts = location.pathname.split("/").filter(Boolean)
  const currentPageTitle = pathParts[pathParts.length - 1] 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1)
    : "Dashboard"

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        {/* Left Side: Mobile toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-400">OMNI Platform</span>
            <span>/</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {currentPageTitle}
            </span>
          </div>
        </div>

        {/* Middle / Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* SuperAdmin Quick Switcher */}
          {Boolean(user?.is_superuser) && (
            <Link
              to="/admin/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#3F72AF]/40 bg-[#3F72AF] text-white hover:bg-[#2d568c] text-[11px] font-bold shadow-sm shadow-[#3F72AF]/25 transition-all"
              title="Open SaaS Platform SuperAdmin Control Console"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Platform Admin</span>
            </Link>
          )}

          {/* Interactive API Docs Link */}
          <a
            href="http://127.0.0.1:8000/api/v1/docs/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-100 dark:border-slate-700/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Open Interactive Swagger API Documentation"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#3F72AF]" />
            <span>API Docs</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>

          {/* Quick Search / Command Palette Button */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 h-9 px-3 text-xs text-slate-500 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700/60 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Quick Jump...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Active Institutional Identity Badge */}
          <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#DBE2EF] bg-[#F9F7F7] dark:border-slate-700/70 dark:bg-slate-800/80 text-xs font-semibold text-[#112D4E] dark:text-slate-300 shadow-2xs">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-xs"
              style={{ backgroundColor: tenant.primaryColor }}
            >
              {tenant.code ? tenant.code.slice(0, 2) : "ED"}
            </div>
            <span className="max-w-[130px] sm:max-w-[180px] truncate">{tenant.name}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          {/* User Role Pill */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <Badge variant="primary" size="sm" className="capitalize">
              <ShieldCheck className="w-3 h-3" />
              {user?.role.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </header>

      {/* Notifications Drawer Modal */}
      <Modal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        title="Institutional Notifications"
        description="Real-time alerts, academic bulletins, and administrative updates"
        size="md"
      >
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/60 dark:bg-amber-950/30 dark:border-amber-900/40 text-xs">
            <div className="flex items-center justify-between font-semibold text-amber-800 dark:text-amber-300">
              <span>Fall Mid-Term Exam Schedule Published</span>
              <span className="text-[10px] text-amber-600">10m ago</span>
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              The revised examination roster for Computer Science & Robotics cohorts is now live.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 dark:bg-slate-800/40 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span>Tuition Fee Reconciliation Complete</span>
              <span className="text-[10px] text-slate-400">2h ago</span>
            </div>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              12 new fee payments have been cleared and verified by the Bursar office.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 dark:bg-slate-800/40 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
              <span>Campus IT Maintenance Window</span>
              <span className="text-[10px] text-slate-400">Yesterday</span>
            </div>
            <p className="mt-1 text-slate-500 dark:text-slate-400">
              High-speed WiFi fiber router upgrades will occur Saturday 02:00 AM UTC.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsNotificationOpen(false)
                navigate("/app/communications")
              }}
              rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
            >
              View All Bulletins
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
