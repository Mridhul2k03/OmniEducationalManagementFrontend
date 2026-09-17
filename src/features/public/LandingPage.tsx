import React from "react"
import { Link } from "react-router-dom"
import { 
  Building2, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Zap,
  BarChart3,
  Users2
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Card, CardContent } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"

export const LandingPage: React.FC = () => {
  const institutionTypes = [
    {
      title: "Universities & Colleges",
      desc: "Multi-faculty programs, credit-hour calculations, semester GPA weighting, and departmental budget controls.",
      badge: "Higher Ed",
      icon: GraduationCap,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50"
    },
    {
      title: "K-12 Schools",
      desc: "Grade level progression, parent-teacher communication, daily period attendance, and term report cards.",
      badge: "School",
      icon: BookOpen,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50"
    },
    {
      title: "Coaching & Test Prep",
      desc: "Fast-track batches, entrance exam ranking, practice test scoring, and fee installments with SMS reminders.",
      badge: "Coaching",
      icon: Zap,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50"
    }
  ]

  const featurePillars = [
    "Adaptive Terminology Engine (Students vs Pupils vs Aspirants)",
    "Granular Role-Based Access Control (RBAC) & Audit Trails",
    "Interactive Attendance Matrix with One-Click Bulk Submission",
    "Automated Examination Grading with Dynamic GPA Computation",
    "Comprehensive Fee Structuring, Invoicing & Bursar Tracking",
    "Weekly Interactive Timetable Grid with Room Conflict Detection"
  ]

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6 lg:px-12 max-w-7xl mx-auto text-center">
        {/* Decorative blur backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Introducing OMNI Edu SaaS 2.0</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
          The Unified Operating System for <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-violet-600">Modern Education</span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          From universities and K-12 schools to competitive coaching institutes—manage learners, faculty, academics, exams, and finances in one tenant-adaptive platform.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/app/dashboard">
            <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Launch Live App Demo
            </Button>
          </Link>
          <Link to="/auth/login">
            <Button variant="outline" size="lg">
              Sign In to Tenant Portal
            </Button>
          </Link>
        </div>

        {/* Live UI Preview Card */}
        <div className="mt-14 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-3 shadow-2xl backdrop-blur-md">
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-6 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400 font-mono ml-2">omni-edu.cloud / enterprise-suite</span>
              </div>
              <Badge variant="success">Tenant Active: Oxford Crest University</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                <span className="text-xs text-slate-400 font-medium uppercase">Active Learners</span>
                <p className="text-2xl font-bold mt-1 text-indigo-600">3,420</p>
                <span className="text-[11px] text-emerald-600">↑ 8.4% this semester</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                <span className="text-xs text-slate-400 font-medium uppercase">Average Attendance</span>
                <p className="text-2xl font-bold mt-1 text-emerald-600">94.8%</p>
                <span className="text-[11px] text-slate-500">Across 64 live cohorts</span>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                <span className="text-xs text-slate-400 font-medium uppercase">Fee Collection</span>
                <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">$1.84M</p>
                <span className="text-[11px] text-indigo-600">91.2% cleared</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Institution Types Showcase */}
      <section className="py-16 px-6 lg:px-12 max-w-7xl mx-auto border-t border-slate-100 dark:border-slate-800/80">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="primary">Adaptive by Design</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2 text-slate-900 dark:text-white">
            Architected for Every Educational Ecosystem
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            The user interface dynamically re-labels terminology, academic schedules, and workflows based on the institution type.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {institutionTypes.map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${item.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="secondary">{item.badge}</Badge>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Core Pillars Checkmarks */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Built for Scalable Operations</h2>
            <p className="text-sm text-slate-500 mt-1">Enterprise-grade capabilities out of the box</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featurePillars.map((feat, i) => (
              <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">{feat}</span>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/app/dashboard">
              <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore All Modules in Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
