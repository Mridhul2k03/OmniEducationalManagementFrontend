import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { AttendanceRecord, AttendanceStatus } from "../../types"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle, Save, Check } from "lucide-react"

function mapBackendAttendance(rec: any): AttendanceRecord {
  return {
    id: rec.id,
    studentId: rec.student?.id || rec.student,
    studentName: rec.student_name || rec.student?.full_name || "Student",
    admissionNumber: rec.admission_number || rec.student?.admission_number || "ADM",
    classId: rec.section?.id || rec.section || "",
    date: rec.date,
    status: (rec.status === "present" ? "present" : (rec.status === "absent" ? "absent" : "late")) as AttendanceStatus,
    notes: rec.remarks || "",
  }
}

export const AttendancePage: React.FC = () => {
  const { tenant, t } = useTenant()
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [sections, setSections] = useState<Array<{ id: string; name: string; class_cohort_name?: string }>>([])
  const [selectedSectionId, setSelectedSectionId] = useState<string>("")
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch sections
  useEffect(() => {
    let isMounted = true
    api.academics.getSections().then((data) => {
      if (!isMounted || !Array.isArray(data)) return
      setSections(data)
      if (data.length > 0 && !selectedSectionId) {
        setSelectedSectionId(data[0].id)
      }
    }).catch(() => {})
    return () => { isMounted = false }
  }, [tenant.id])

  // Fetch attendance records for section + date
  const fetchAttendance = async () => {
    setIsLoading(true)
    try {
      const data = await api.attendance.getRecords({
        date: selectedDate,
        section_id: selectedSectionId || undefined,
      })

      if (Array.isArray(data) && data.length > 0) {
        setRecords(data.map(mapBackendAttendance))
      } else {
        // If no records marked yet for this date, fetch enrolled students in this tenant to offer live entry sheet
        const studentsList = await api.students.list()
        if (Array.isArray(studentsList) && studentsList.length > 0) {
          const draftRecords: AttendanceRecord[] = studentsList.map((s: any) => ({
            id: `draft-${s.id}-${selectedDate}`,
            studentId: s.id,
            studentName: s.full_name || `${s.first_name} ${s.last_name}`,
            admissionNumber: s.admission_number,
            classId: selectedSectionId || "",
            date: selectedDate,
            status: "present" as AttendanceStatus,
            notes: "",
          }))
          setRecords(draftRecords)
        } else {
          setRecords([])
        }
      }
    } catch (err) {
      console.warn("Could not fetch attendance from API:", err)
      setRecords([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [tenant.id, selectedDate, selectedSectionId])

  const handleStatusChange = (recordId: string, status: AttendanceStatus) => {
    setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status } : r))
    setIsSaved(false)
  }

  const markAll = (status: AttendanceStatus) => {
    setRecords(prev => prev.map(r => ({ ...r, status })))
    setIsSaved(false)
  }

  const handleSave = async () => {
    if (records.length === 0) return
    setIsSaving(true)

    try {
      const validEntries = records
        .filter(r => r.studentId)
        .map(r => ({
          student_id: r.studentId,
          status: r.status,
          remarks: r.notes || "",
        }))

      if (validEntries.length > 0) {
        const targetSection = selectedSectionId || sections[0]?.id
        if (targetSection) {
          await api.attendance.bulkMark({
            section_id: targetSection,
            date: selectedDate,
            entries: validEntries,
          })
        }
      }

      setIsSaved(true)
      await fetchAttendance()
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      console.error("Failed to save attendance:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const stats = {
    total: records.length,
    present: records.filter(r => r.status === "present").length,
    absent: records.filter(r => r.status === "absent").length,
    late: records.filter(r => r.status === "late").length,
    rate: records.length > 0 
      ? Math.round((records.filter(r => r.status === "present" || r.status === "late").length / records.length) * 100) 
      : 0
  }

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "admissionNumber",
      header: "Adm No.",
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-500">{r.admissionNumber}</span>
    },
    {
      key: "studentName",
      header: `${t("learner")} Name`,
      sortable: true,
      render: (r) => (
        <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
          {r.studentName}
        </span>
      )
    },
    {
      key: "status",
      header: "Status Control",
      render: (r) => {
        return (
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => handleStatusChange(r.id, "present")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                r.status === "present"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              Present
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(r.id, "late")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                r.status === "late"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              Late
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange(r.id, "absent")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                r.status === "absent"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700"
              }`}
            >
              Absent
            </button>
          </div>
        )
      }
    },
    {
      key: "notes",
      header: "Remarks / Notes",
      render: (r) => (
        <span className="text-xs text-slate-400 italic">
          {r.notes || "—"}
        </span>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Daily Attendance Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Record, verify, and transmit daily classroom attendance logs in real time.
          </p>
        </div>

        <Button
          onClick={handleSave}
          isLoading={isSaving}
          leftIcon={isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          variant={isSaved ? "secondary" : "primary"}
        >
          {isSaved ? "Attendance Saved & Synced!" : "Save Attendance Sheet"}
        </Button>
      </div>

      {/* Control Filters & Summary stats banner */}
      <div className="p-4 rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900/90 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {sections.length > 0 && (
              <div className="w-56">
                <Select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  options={sections.map(sec => ({
                    value: sec.id,
                    label: `${sec.class_cohort_name || "Cohort"} - ${sec.name}`
                  }))}
                />
              </div>
            )}
            <div className="w-44">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
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

        {/* Live Counters Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center font-bold text-xs">
              {stats.total}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Enrolled</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Total Roster</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold text-xs">
              {stats.present}
            </div>
            <div>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-semibold">Present</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{stats.rate}% Rate</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/20">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold text-xs">
              {stats.late}
            </div>
            <div>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase tracking-wider font-semibold">Late Arrival</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Transit / Note</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-rose-50/50 dark:bg-rose-950/20">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center font-bold text-xs">
              {stats.absent}
            </div>
            <div>
              <p className="text-[10px] text-rose-600 dark:text-rose-400 uppercase tracking-wider font-semibold">Absent</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Action Flagged</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Records Table */}
      <DataTable
        columns={columns}
        data={records}
        searchPlaceholder="Search students..."
        searchKeys={["studentName", "admissionNumber"]}
        emptyTitle="No records found"
        emptyDescription={`No ${t("learners")} found for this date. Check student enrollment.`}
      />
    </div>
  )
}
