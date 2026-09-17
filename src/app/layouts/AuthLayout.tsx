import React from "react"
import { Outlet, Link } from "react-router-dom"
import { Sparkles, Shield, BookOpen, Layers } from "lucide-react"

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Left Column: Visual Brand Showcase (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-linear-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white overflow-hidden">
        {/* Abstract decorative geometric background shapes */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* Top brand header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-indigo-900 flex items-center justify-center font-bold text-xl shadow-lg">
              Ω
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">OMNI Educational SaaS</h1>
              <p className="text-xs text-indigo-200">Unified Project & Institutional ERP</p>
            </div>
          </Link>
        </div>

        {/* Center Testimonial / Highlights */}
        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-xs font-semibold tracking-wide uppercase text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Multi-Tenant Next-Gen Architecture
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
            One platform adaptable for Universities, Schools, and Coaching Academies.
          </h2>

          <p className="text-sm text-indigo-200/90 leading-relaxed">
            Eliminate fragmented software. Manage student lifecycles, faculty workloads, attendance, examinations, and fee reconciliation with enterprise security.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="text-2xl font-bold">99.98%</div>
              <div className="text-xs text-indigo-200">System Uptime & Reliability</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-xs text-indigo-200">Adaptive Terminology Engine</div>
            </div>
          </div>
        </div>

        {/* Bottom footer note */}
        <div className="relative z-10 text-xs text-indigo-300/80 flex items-center justify-between">
          <span>© 2026 OMNI Educational Systems Ltd.</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-emerald-400" /> SOC2 & GDPR Compliant
          </span>
        </div>
      </div>

      {/* Right Column: Form Outlet */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
