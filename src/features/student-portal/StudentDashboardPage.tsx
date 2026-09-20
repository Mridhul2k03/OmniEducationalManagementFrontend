import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { 
  Sparkles, 
  GraduationCap, 
  Clock, 
  Award, 
  CreditCard, 
  CalendarDays, 
  Bell, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  UserCheck
} from "lucide-react"
import { api, StudentDashboardResponse } from "../../services/api"
import { useAuth } from "../../app/providers/AuthProvider"

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<StudentDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const res = await api.studentPortal.getDashboard()
        if (isMounted) {
          setData(res)
          setError(null)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to load student dashboard records.")
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchDashboard()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 rounded-2xl bg-[#DBE2EF]/50 dark:bg-slate-800/50" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-[#DBE2EF]/40 dark:bg-slate-800/40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-xl bg-[#DBE2EF]/30 dark:bg-slate-800/30" />
          <div className="h-72 rounded-xl bg-[#DBE2EF]/30 dark:bg-slate-800/30" />
        </div>
      </div>
    )
  }

  const student = data?.student
  const placement = data?.academic_placement
  const metrics = data?.metrics
  const timetable = data?.timetable || []
  const grades = data?.recent_grades || []
  const announcements = data?.announcements || []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#112D4E] via-[#1b3d68] to-[#3F72AF] text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#DBE2EF] text-xs font-semibold backdrop-blur-sm border border-white/10">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{student?.institution_name || "Academic Campus"}</span>
              <span>•</span>
              <span>{placement?.academic_year || "Current Session"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {student?.first_name || user?.name || "Student"}!
            </h1>
            <p className="text-sm text-[#DBE2EF]/90">
              You are enrolled in <span className="font-semibold text-white">{placement?.class_cohort || "Grade"}</span> ({placement?.section || "Section A"}), Roll #{placement?.roll_number || "01"}. Your admission number is <span className="font-mono bg-white/15 px-2 py-0.5 rounded text-white">{student?.admission_number || "ADM-001"}</span>.
            </p>
          </div>

          {/* Quick AI Tutor CTA */}
          <Link
            to="/student/ai-tutor"
            className="flex-shrink-0 group flex items-center gap-3 p-4 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-md transition-all shadow-lg text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-[#112D4E] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                Gemini AI 2.5
              </div>
              <div className="text-sm font-bold text-white">Ask AI Study Tutor</div>
              <div className="text-xs text-[#DBE2EF]">Get instant homework help & quiz prep &rarr;</div>
            </div>
          </Link>
        </div>
      </div>

      {/* 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overall Attendance
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#112D4E] dark:text-white">
                {metrics?.attendance_pct ?? 96.5}%
              </span>
              <span className="text-xs text-emerald-600 font-medium">Good Standing</span>
            </div>
            <div className="w-32 bg-[#DBE2EF] dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, metrics?.attendance_pct ?? 96.5)}%` }}
              />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* GPA / Academic Standing */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Academic GPA
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#3F72AF]">
                {metrics?.gpa ? Number(metrics.gpa).toFixed(2) : "3.85"}
              </span>
              <span className="text-xs text-slate-500">/ 4.00</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              Avg: {metrics?.avg_percentage ?? 88}%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#3F72AF]">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Fee Balance */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Tuition Balance
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#112D4E] dark:text-white">
                {student?.currency || "$"}{Number(metrics?.balance_due ?? 0).toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              {metrics?.balance_due && metrics.balance_due > 0 ? (
                <span className="text-amber-600 font-medium">Pending payment</span>
              ) : (
                <span className="text-emerald-600 font-medium">Fully settled</span>
              )}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Classes Scheduled */}
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Today's Periods
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#112D4E] dark:text-white">
                {timetable.length || 5}
              </span>
              <span className="text-xs text-slate-500">Lectures</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
              08:30 AM – 02:05 PM
            </span>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Timetable + Recent Grades */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timetable Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#112D4E] dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#3F72AF]" />
              Today's Class Schedule
            </h2>
            <Link
              to="/student/timetable"
              className="text-xs font-semibold text-[#3F72AF] hover:text-[#112D4E] dark:hover:text-blue-400 flex items-center gap-1"
            >
              Full Week Schedule <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {timetable.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 text-slate-500">
                No classes scheduled for today. Enjoy your study break!
              </div>
            ) : (
              timetable.map((period, idx) => (
                <div
                  key={period.id || idx}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 hover:border-[#3F72AF]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#DBE2EF]/60 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-[#112D4E] dark:text-white">
                      P{idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#112D4E] dark:text-white">
                        {period.subject_name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{period.teacher_name}</span>
                        <span>•</span>
                        <span>{period.room_number}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#DBE2EF] dark:bg-slate-800 text-[#112D4E] dark:text-slate-300">
                      {period.start_time} - {period.end_time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar: Recent Exam Grades & Campus Announcements */}
        <div className="space-y-6">
          {/* Recent Grades */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#112D4E] dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#3F72AF]" />
                Recent Examination Marks
              </h3>
              <Link to="/student/grades" className="text-xs text-[#3F72AF] hover:underline">
                View All
              </Link>
            </div>

            {grades.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No recent examination marks recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {grades.slice(0, 4).map((grade, idx) => (
                  <div
                    key={grade.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9F7F7] dark:bg-slate-800/60 border border-[#DBE2EF] dark:border-slate-700/50"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#112D4E] dark:text-white">
                        {grade.subject_name}
                      </div>
                      <div className="text-[11px] text-slate-500">{grade.exam_name}</div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-extrabold bg-[#3F72AF] text-white">
                        Grade {grade.grade}
                      </span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {grade.marks_obtained} / {grade.max_marks}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campus Bulletins */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#112D4E] dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Campus Bulletins
              </h3>
            </div>

            {announcements.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                No active announcements at this time.
              </p>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann, idx) => (
                  <div
                    key={ann.id || idx}
                    className="p-3 rounded-lg border border-[#DBE2EF] dark:border-slate-800 bg-[#F9F7F7] dark:bg-slate-800/40 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#112D4E] dark:text-white">
                        {ann.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">{ann.published_at}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                      {ann.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
