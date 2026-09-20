import React from "react"
import { Outlet, Link } from "react-router-dom"
import { Button } from "../../components/ui/Button"
import { useTheme } from "../providers/ThemeProvider"
import { Sun, Moon, ArrowRight, ShieldCheck } from "lucide-react"

export const PublicLayout: React.FC = () => {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F7] dark:bg-slate-950 text-[#112D4E] dark:text-slate-100 font-sans">
      {/* Public Navbar */}
      <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-[#DBE2EF] dark:border-slate-800 bg-[#F9F7F7]/90 dark:bg-slate-950/80 backdrop-blur-md px-6 lg:px-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#3F72AF] to-[#112D4E] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#3F72AF]/20">
            Ω
          </div>
          <div>
            <span className="text-base font-bold tracking-tight">OMNI Edu</span>
            <span className="text-xs text-[#112D4E] dark:text-indigo-400 font-semibold ml-1.5 px-2 py-0.5 rounded-full bg-[#DBE2EF] dark:bg-indigo-950/50">
              SaaS
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link to="/auth/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/app/dashboard">
            <Button size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 dark:border-slate-800/80 py-8 px-6 lg:px-12 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>© 2026 OMNI Educational Project Management System. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <span>Security & ISO 27001</span>
          <span>Privacy Policy</span>
          <span>API Documentation</span>
        </div>
      </footer>
    </div>
  )
}
