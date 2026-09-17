import React, { useState } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { AttendanceRecord, AttendanceStatus } from "../../types"
import { appStorage } from "../../services/storage"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Select } from "../../components/ui/Select"
import { Input } from "../../components/ui/Input"
import { CheckCircle2, XCircle, Clock, AlertCircle, Save, Check } from "lucide-react"

export const AttendancePage: React.FC = () => {
  const { t } = useTenant()
  const [selectedClass, setSelectedClass] = useState("CS-304")
  const [selectedDate, setSelectedDate] = useState("2026-09-17")
  const [records, setRecords] = useState<AttendanceRecord[]>(() => 
    appStorage.getAttendance("CS-304", "2026-09-17")
  )
  const [isSaved, setIsSaved] = useState(false)

  const handleStatusChange = (recordId: string, status: AttendanceStatus) => {
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status } : r))
    setIsSaved(false)
  }

  const markAll = (status: AttendanceStatus) => {
    setRecords(prev => prev.map(r => ({ ...r, status })))
    setIsSaved(false)
  }

  const handleSave = () => {
    appStorage.saveAttendance(records)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  // Calculated stats
  const total = records.length
  const presentCount = records.filter(r => r.status === "present").length
  const lateCount = records.filter(r => r.status === "late").length
  const absentCount = records.filter(r => r.status === "absent").length
  const excusedCount = records.filter(r => r.status === "excused").length
  const presentPct = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Attendance Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Log daily attendance records, reason flags, and track instant completion rates.
          </p>
        </div>

        <Button
          onClick={handleSave}
          leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          variant={isSaved ? "secondary" : "primary"}
        >
          {isSaved ? "Saved Successfully!" : "Save Attendance Sheet"}
        </Button>
      </div>

      {/* Control Filters & Summary stats banner */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48">
              <Select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setRecords(appStorage.getAttendance(e.target.value, selectedDate))
                }}
                options={[
                  { value: "CS-304", label: "CS-304: Machine Learning" },
                  { value: "CS-101", label: "CS-101: Foundations of CS" },
                  { value: "MATH-202", label: "MATH-202: Linear Algebra" }
                ]}
              />
            </div>
            <div className="w-44">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setRecords(appStorage.getAttendance(selectedClass, e.target.value))
                }}
              />
            </div>
          </div>

          {/* Bulk quick actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Bulk:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll("present")}
              className="text-xs text-emerald-600 dark:text-emerald-400"
            >
              All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAll("absent")}
              className="text-xs text-rose-600 dark:text-rose-400"
            >
              All Absent
            </Button>
          </div>
        </div>

        {/* Live metric summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Attendance Rate</span>
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{presentPct}%</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/40 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Present</span>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{presentCount}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Late</span>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{lateCount}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/40 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Absent</span>
            <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{absentCount}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Excused</span>
            <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{excusedCount}</p>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200 dark:bg-slate-800/50 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Adm ID</th>
                <th className="px-4 py-3">{t("learner")}</th>
                <th className="px-4 py-3 text-center">Attendance Status</th>
                <th className="px-4 py-3">Remarks / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {r.admissionNumber}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                      {r.studentName}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(r.id, "present")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          r.status === "present"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                        }`}
                      >
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(r.id, "late")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          r.status === "late"
                            ? "bg-amber-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                        }`}
                      >
                        Late
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(r.id, "absent")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          r.status === "absent"
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(r.id, "excused")}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                          r.status === "excused"
                            ? "bg-slate-700 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                        }`}
                      >
                        Excused
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <input
                      type="text"
                      defaultValue={r.notes || ""}
                      placeholder="Optional notes..."
                      className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-2 py-1 placeholder:text-slate-400"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
