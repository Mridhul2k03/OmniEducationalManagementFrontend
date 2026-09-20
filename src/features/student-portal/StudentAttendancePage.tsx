import React, { useState, useEffect } from "react"
import { Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react"
import { api, AttendanceRecordItem } from "../../services/api"

export const StudentAttendancePage: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecordItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true)
        const res = await api.studentPortal.getAttendance()
        setRecords(res || [])
      } catch {
        // Handled
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [])

  const total = records.length
  const presentCount = records.filter((r) => r.status === "present" || r.status === "late").length
  const absentCount = records.filter((r) => r.status === "absent").length
  const lateCount = records.filter((r) => r.status === "late").length
  const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : 100

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#112D4E] dark:text-white flex items-center gap-2.5">
          <Clock className="w-7 h-7 text-[#3F72AF]" />
          Attendance Records & Audit
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your attendance rate, present/absent history, and institutional remarks.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#3F72AF]">{attendanceRate}%</span>
            <span className="text-xs text-emerald-600 font-bold">Standard: 75%</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Days</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">{presentCount}</span>
            <span className="text-xs text-slate-500">Days</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Absent Days</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600">{absentCount}</span>
            <span className="text-xs text-slate-500">Days</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Late Arrivals</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600">{lateCount}</span>
            <span className="text-xs text-slate-500">Recorded</span>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#DBE2EF] dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#DBE2EF] dark:border-slate-800">
          <h2 className="font-bold text-base text-[#112D4E] dark:text-white">
            Daily Attendance Log
          </h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded bg-[#DBE2EF]/40 dark:bg-slate-800/40" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No attendance entries recorded for this term yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F7F7] dark:bg-slate-800/50 border-b border-[#DBE2EF] dark:border-slate-800 text-xs font-semibold text-[#112D4E] dark:text-slate-200 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">Subject / Period</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE2EF] dark:divide-slate-800 text-xs">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#DBE2EF]/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-[#112D4E] dark:text-white">
                      {rec.formatted_date || rec.date}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">
                      {rec.subject_name}
                    </td>
                    <td className="py-3.5 px-6">
                      {rec.status === "present" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Present
                        </span>
                      ) : rec.status === "late" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5" /> Late
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                          <XCircle className="w-3.5 h-3.5" /> Absent
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400">
                      {rec.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
