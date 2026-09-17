import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { 
  Menu, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  Building, 
  Check, 
  ChevronDown,
  ShieldCheck,
  ExternalLink
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
  const { tenant, tenants, setTenantId } = useTenant()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const [isTenantDropdownOpen, setIsTenantDropdownOpen] = useState(false)
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

          {/* Tenant Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsTenantDropdownOpen(!isTenantDropdownOpen)}
              className="flex items-center gap-2 h-9 px-3 rounded-lg border border-slate-200/80 bg-white hover:bg-slate-50 dark:border-slate-700/70 dark:bg-slate-900 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Building className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="max-w-[120px] sm:max-w-[150px] truncate">{tenant.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isTenantDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsTenantDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-72 z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-semibold uppercase text-slate-400">
                      Switch Institution Tenant
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Multi-tenant dynamic terminology engine
                    </p>
                  </div>
                  <div className="py-1 space-y-1">
                    {tenants.map((t) => {
                      const isCurrent = t.id === tenant.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setTenantId(t.id)
                            setIsTenantDropdownOpen(false)
                          }}
                          className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                            isCurrent
                              ? "bg-indigo-50/80 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 font-semibold"
                              : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5"
                            style={{ backgroundColor: t.primaryColor }}
                          >
                            {t.code.slice(0, 2)}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="truncate font-medium">{t.name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">
                              {t.type.replace("_", " ")} • {t.currency}
                            </p>
                          </div>
                          {isCurrent && <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
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
