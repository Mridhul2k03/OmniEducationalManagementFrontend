import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Search, 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarClock, 
  CheckCircle2, 
  FileSpreadsheet, 
  Wallet, 
  Megaphone, 
  Settings,
  ArrowRight
} from "lucide-react"
import { Modal } from "../ui/Modal"
import { useTenant } from "../../app/providers/TenantProvider"

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("")
  const navigate = useNavigate()
  const { t } = useTenant()

  const navItems = [
    { label: "Dashboard Overview", path: "/app/dashboard", icon: LayoutDashboard, category: "Overview" },
    { label: `${t("learners")} Directory`, path: "/app/students", icon: Users, category: "People" },
    { label: `${t("educators")} Directory`, path: "/app/staff", icon: GraduationCap, category: "People" },
    { label: `${t("programs")} & ${t("classes")}`, path: "/app/academics", icon: BookOpen, category: "Academics" },
    { label: "Weekly Timetable Grid", path: "/app/timetable", icon: CalendarClock, category: "Academics" },
    { label: "Attendance Matrix & Live Session", path: "/app/attendance", icon: CheckCircle2, category: "Operations" },
    { label: "Examinations, Marks & Report Cards", path: "/app/examinations", icon: FileSpreadsheet, category: "Operations" },
    { label: "Finance, Fees & Invoices", path: "/app/finance", icon: Wallet, category: "Finance" },
    { label: "Bulletins & Campus Announcements", path: "/app/communications", icon: Megaphone, category: "Communication" },
    { label: "Tenant Settings & RBAC Permissions", path: "/app/settings", icon: Settings, category: "Administration" },
  ]

  const filtered = navItems.filter(item => 
    item.label.toLowerCase().includes(query.toLowerCase()) || 
    item.category.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (path: string) => {
    navigate(path)
    onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Open triggered from parent or global listener
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to page..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 no-scrollbar">
          {filtered.length === 0 ? (
            <p className="p-4 text-xs text-center text-slate-400">No matching routes found.</p>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    <span>{item.label}</span>
                    <span className="text-[10px] text-slate-400 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.2">
                      {item.category}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
