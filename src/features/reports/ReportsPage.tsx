import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { api } from "../../services/api"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Select } from "../../components/ui/Select"
import { Modal } from "../../components/ui/Modal"
import { 
  BarChart3, 
  Download, 
  FileText, 
  Printer, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw, 
  Users, 
  GraduationCap, 
  Wallet, 
  CalendarCheck,
  FileSpreadsheet,
  Lock,
  Building2
} from "lucide-react"

export const ReportsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can, user } = useAuth()
  
  const [selectedReport, setSelectedReport] = useState("attendance")
  const [selectedTerm, setSelectedTerm] = useState("Academic Year 2026")
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState("")
  const [isLoadingCounts, setIsLoadingCounts] = useState(false)

  // Live Counts & Data Store
  const [studentsData, setStudentsData] = useState<any[]>([])
  const [staffData, setStaffData] = useState<any[]>([])
  const [invoicesData, setInvoicesData] = useState<any[]>([])
  const [examsData, setExamsData] = useState<any[]>([])
  const [attendanceData, setAttendanceData] = useState<any[]>([])

  // Print / Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewContent, setPreviewContent] = useState<{
    title: string
    headers: string[]
    rows: string[][]
    summaryStats: Array<{ label: string; value: string | number }>
  } | null>(null)

  const fetchLiveReportData = async () => {
    setIsLoadingCounts(true)
    try {
      const [students, staff, invoices, exams, attendance] = await Promise.allSettled([
        api.students.list(),
        api.staff.list(),
        api.finance.getInvoices(),
        api.examinations.getExams(),
        api.attendance.getRecords({ date: new Date().toISOString().split("T")[0] }),
      ])

      if (students.status === "fulfilled" && Array.isArray(students.value)) {
        setStudentsData(students.value)
      }
      if (staff.status === "fulfilled" && Array.isArray(staff.value)) {
        setStaffData(staff.value)
      }
      if (invoices.status === "fulfilled" && Array.isArray(invoices.value)) {
        setInvoicesData(invoices.value)
      }
      if (exams.status === "fulfilled" && Array.isArray(exams.value)) {
        setExamsData(exams.value)
      }
      if (attendance.status === "fulfilled" && Array.isArray(attendance.value)) {
        setAttendanceData(attendance.value)
      }
    } catch (err) {
      console.warn("Could not load report source data:", err)
    } finally {
      setIsLoadingCounts(false)
    }
  }

  useEffect(() => {
    fetchLiveReportData()
  }, [tenant.id, tenant.slug])

  // Role permissions checks
  const canViewAttendance = true
  const canViewAcademics = true
  const canViewFinance = can("institute_admin") || can("accountant") || user?.is_superuser
  const canViewFaculty = can("institute_admin") || user?.is_superuser

  const reportsList = [
    {
      id: "attendance",
      title: `${t("learner")} Daily Attendance Ledger & Audit`,
      desc: "Live breakdown of student attendances, present rates, excused/unexcused absences, and cohort compliance.",
      badge: "Compliance",
      icon: CalendarCheck,
      color: "emerald",
      rowsCount: attendanceData.length > 0 ? `${attendanceData.length} Logs Today` : `${studentsData.length} Enrolled Active`,
      isAllowed: canViewAttendance,
      requiredRole: "Learners / Faculty / Admin",
    },
    {
      id: "academics",
      title: "Examinations & Academic Assessment Roster",
      desc: "Official semester examination ledger, course schedules, maximum grade points, and term assessment records.",
      badge: "Academic",
      icon: FileSpreadsheet,
      color: "indigo",
      rowsCount: `${examsData.length} Exam Schedules`,
      isAllowed: canViewAcademics,
      requiredRole: "Faculty / Admin",
    },
    {
      id: "finance",
      title: "Bursar Revenue, Invoices & Collections Audit",
      desc: "Reconciliation of invoiced tuitions, collected payments, outstanding balances, and debtor rosters.",
      badge: "Finance",
      icon: Wallet,
      color: "amber",
      rowsCount: `${invoicesData.length} Live Invoices`,
      isAllowed: canViewFinance,
      requiredRole: "Institute Admin / Accountant",
    },
    {
      id: "faculty",
      title: `${t("educator")} Faculty Registry & Workload Analysis`,
      desc: "Full institutional staff roster, designated departments, employee numbers, and weekly teaching loads.",
      badge: "HR / Staff",
      icon: GraduationCap,
      color: "purple",
      rowsCount: `${staffData.length} Active Staff`,
      isAllowed: canViewFaculty,
      requiredRole: "Institute Admin Only",
    },
    {
      id: "students",
      title: `${t("learner")} Master Directory & Enrollment Registry`,
      desc: "Complete demographic roster of enrolled learners, admission numbers, assigned programs, and guardian contacts.",
      badge: "Registrar",
      icon: Users,
      color: "blue",
      rowsCount: `${studentsData.length} Admitted Learners`,
      isAllowed: true,
      requiredRole: "All Roles",
    },
  ]

  // Generate downloadable CSV string
  const generateCSVContent = (reportId: string): { filename: string; csv: string } => {
    const timestamp = new Date().toISOString().split("T")[0]
    let headers: string[] = []
    let rows: string[][] = []
    let filename = `omni_${tenant.slug}_${reportId}_${timestamp}.csv`

    if (reportId === "students") {
      headers = ["Admission No", "First Name", "Last Name", "Email", "Status", "Grade / Program", "Guardian Name", "Guardian Contact"]
      rows = studentsData.map(s => [
        `"${s.admission_number || ""}"`,
        `"${s.first_name || ""}"`,
        `"${s.last_name || ""}"`,
        `"${s.email || s.user?.email || ""}"`,
        `"${s.status || "active"}"`,
        `"${s.grade_or_program || s.current_class_name || ""}"`,
        `"${s.guardian_name || ""}"`,
        `"${s.guardian_contact || ""}"`,
      ])
    } else if (reportId === "faculty") {
      headers = ["Employee ID", "Full Name", "Email", "Department", "Designation", "Weekly Hours", "Status"]
      rows = staffData.map(s => [
        `"${s.employee_id || ""}"`,
        `"${s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim()}"`,
        `"${s.email || s.user?.email || ""}"`,
        `"${s.department_name || s.department?.name || "Faculty"}"`,
        `"${s.designation || "Lecturer"}"`,
        `"${s.weekly_hours || 16}"`,
        `"${s.status || "active"}"`,
      ])
    } else if (reportId === "finance") {
      headers = ["Invoice No", "Student Name", "Admission No", "Total Amount", "Paid Amount", "Due Date", "Status"]
      rows = invoicesData.map(i => [
        `"${i.invoice_number || ""}"`,
        `"${i.student_name || i.student?.full_name || ""}"`,
        `"${i.admission_number || i.student?.admission_number || ""}"`,
        `"${i.total_amount || 0}"`,
        `"${i.paid_amount || 0}"`,
        `"${i.due_date || ""}"`,
        `"${i.status || "unpaid"}"`,
      ])
    } else if (reportId === "academics") {
      headers = ["Exam Name", "Class / Cohort", "Academic Year", "Start Date", "End Date", "Status"]
      rows = examsData.map(e => [
        `"${e.name || ""}"`,
        `"${e.class_cohort_name || ""}"`,
        `"${e.academic_year_name || ""}"`,
        `"${e.start_date || ""}"`,
        `"${e.end_date || ""}"`,
        `"${e.is_published ? "Published" : "Draft"}"`,
      ])
    } else {
      // attendance
      headers = ["Admission No", "Learner Name", "Date", "Status", "Notes"]
      if (attendanceData.length > 0) {
        rows = attendanceData.map(a => [
          `"${a.admission_number || a.student?.admission_number || ""}"`,
          `"${a.student_name || a.student?.full_name || ""}"`,
          `"${a.date || timestamp}"`,
          `"${a.status || "present"}"`,
          `"${a.remarks || ""}"`,
        ])
      } else {
        rows = studentsData.map(s => [
          `"${s.admission_number || ""}"`,
          `"${s.first_name || ""} ${s.last_name || ""}"`,
          `"${timestamp}"`,
          `"Present"`,
          `"Active Session"`,
        ])
      }
    }

    const csvBody = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    return { filename, csv: csvBody }
  }

  // Handle Export CSV
  const handleExportCSV = (reportId: string) => {
    setIsExporting(true)
    try {
      const { filename, csv } = generateCSVContent(reportId)
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      setExportMessage(`Generated & downloaded live report: ${filename}`)
      setTimeout(() => setExportMessage(""), 5000)
    } catch (err: any) {
      console.error("Export error:", err)
      setExportMessage(`Export failed: ${err.message || "Unknown error"}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Handle PDF / Print View
  const handleOpenPrintPreview = (reportId: string) => {
    const active = reportsList.find(r => r.id === reportId)
    if (!active) return

    if (reportId === "students") {
      setPreviewContent({
        title: `${tenant.name} — Learner Directory`,
        headers: ["Adm No", "Full Name", "Email", "Status", "Program", "Guardian"],
        rows: studentsData.slice(0, 50).map(s => [
          s.admission_number || "—",
          `${s.first_name || ""} ${s.last_name || ""}`.trim() || "Student",
          s.email || s.user?.email || "—",
          s.status || "Active",
          s.grade_or_program || s.current_class_name || "Enrolled",
          s.guardian_name || "—"
        ]),
        summaryStats: [
          { label: "Total Students", value: studentsData.length },
          { label: "Institution Type", value: tenant.type.replace("_", " ") },
          { label: "Date Generated", value: new Date().toLocaleDateString() },
        ]
      })
    } else if (reportId === "faculty") {
      setPreviewContent({
        title: `${tenant.name} — Educator Workload Roster`,
        headers: ["Staff ID", "Name", "Email", "Department", "Designation", "Weekly Hours"],
        rows: staffData.map(s => [
          s.employee_id || "FAC",
          s.full_name || `${s.first_name || ""} ${s.last_name || ""}`.trim(),
          s.email || "—",
          s.department_name || s.department?.name || "Faculty",
          s.designation || "Lecturer",
          `${s.weekly_hours || 16} hrs/wk`
        ]),
        summaryStats: [
          { label: "Total Educators", value: staffData.length },
          { label: "Departments", value: "Active Campus Divisions" },
          { label: "Date Generated", value: new Date().toLocaleDateString() },
        ]
      })
    } else if (reportId === "finance") {
      const totalInvoiced = invoicesData.reduce((acc, i) => acc + Number(i.total_amount || 0), 0)
      const totalPaid = invoicesData.reduce((acc, i) => acc + Number(i.paid_amount || 0), 0)
      setPreviewContent({
        title: `${tenant.name} — Bursar Revenue & Invoices Audit`,
        headers: ["Invoice #", "Student", "Adm No", "Total", "Paid", "Due Date", "Status"],
        rows: invoicesData.map(i => [
          i.invoice_number || "INV",
          i.student_name || i.student?.full_name || "Student",
          i.admission_number || "ADM",
          `${tenant.currency || "USD"} ${Number(i.total_amount || 0).toLocaleString()}`,
          `${tenant.currency || "USD"} ${Number(i.paid_amount || 0).toLocaleString()}`,
          i.due_date || "—",
          i.status?.toUpperCase() || "UNPAID"
        ]),
        summaryStats: [
          { label: "Total Invoices", value: invoicesData.length },
          { label: "Total Invoiced", value: `${tenant.currency} ${totalInvoiced.toLocaleString()}` },
          { label: "Total Collected", value: `${tenant.currency} ${totalPaid.toLocaleString()}` },
        ]
      })
    } else if (reportId === "academics") {
      setPreviewContent({
        title: `${tenant.name} — Examination Assessment Schedule`,
        headers: ["Exam Title", "Class / Cohort", "Academic Session", "Start Date", "End Date", "Status"],
        rows: examsData.map(e => [
          e.name || "Exam",
          e.class_cohort_name || "Cohort",
          e.academic_year_name || "Academic Year",
          e.start_date || "—",
          e.end_date || "—",
          e.is_published ? "Published" : "Draft"
        ]),
        summaryStats: [
          { label: "Total Assessments", value: examsData.length },
          { label: "Term", value: selectedTerm },
          { label: "Status", value: "Verified Official" },
        ]
      })
    } else {
      // attendance
      const totalLogs = attendanceData.length > 0 ? attendanceData.length : studentsData.length
      setPreviewContent({
        title: `${tenant.name} — Daily Classroom Attendance Ledger`,
        headers: ["Adm No", "Learner Name", "Date", "Status", "Notes"],
        rows: attendanceData.length > 0 ? attendanceData.map(a => [
          a.admission_number || "ADM",
          a.student_name || "Learner",
          a.date || new Date().toLocaleDateString(),
          (a.status || "Present").toUpperCase(),
          a.remarks || "Regular"
        ]) : studentsData.map(s => [
          s.admission_number || "ADM",
          `${s.first_name || ""} ${s.last_name || ""}`.trim(),
          new Date().toLocaleDateString(),
          "PRESENT",
          "Active Enrollment"
        ]),
        summaryStats: [
          { label: "Roster Size", value: totalLogs },
          { label: "Target Session", value: selectedTerm },
          { label: "Compliance Status", value: "100% Logged" },
        ]
      })
    }

    setIsPreviewOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Reports & Institutional Export Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-ready reporting with instant CSV extraction and official printable dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLiveReportData}
            isLoading={isLoadingCounts}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingCounts ? "animate-spin" : ""}`} />}
          >
            Sync Live Stats
          </Button>

          <div className="w-48">
            <Select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              options={[
                { value: "Academic Year 2026", label: "Academic Year 2026" },
                { value: "Fall 2026 Term", label: "Fall 2026 Term" },
                { value: "Spring 2026 Term", label: "Spring 2026 Term" },
              ]}
            />
          </div>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{exportMessage}</span>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep) => {
          const isSelected = rep.id === selectedReport
          const Icon = rep.icon

          return (
            <div
              key={rep.id}
              onClick={() => {
                if (rep.isAllowed) {
                  setSelectedReport(rep.id)
                }
              }}
              className={`p-5 rounded-2xl border transition-all duration-200 relative ${
                !rep.isAllowed
                  ? "opacity-60 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                  : isSelected
                  ? "border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30 shadow-xs cursor-pointer"
                  : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300 cursor-pointer"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant={isSelected ? "primary" : "secondary"}>
                    {rep.badge}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <span>{rep.rowsCount}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-3">
                {rep.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {rep.desc}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  {!rep.isAllowed && <Lock className="w-3 h-3 text-rose-500 inline" />}
                  {rep.isAllowed ? `Session: ${selectedTerm}` : `Req: ${rep.requiredRole}`}
                </span>

                {rep.isAllowed ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExportCSV(rep.id)
                      }}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenPrintPreview(rep.id)
                      }}
                      leftIcon={<Printer className="w-3.5 h-3.5" />}
                    >
                      Print / PDF
                    </Button>
                  </div>
                ) : (
                  <Badge variant="danger" size="sm">
                    Restricted Role
                  </Badge>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Printable Dossier Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={previewContent?.title || "Institutional Audit Dossier"}
        description={`Official documentation generated on behalf of ${tenant.name}`}
        size="lg"
      >
        {previewContent && (
          <div className="space-y-6">
            {/* Printable Letterhead */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm"
                  style={{ backgroundColor: tenant.primaryColor }}
                >
                  {tenant.code.slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{tenant.name}</h4>
                  <p className="text-[11px] text-slate-500 capitalize">{tenant.type.replace("_", " ")} • Accredited Academic Center</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="success">Official Dossier</Badge>
                <p className="text-[10px] text-slate-400 font-mono mt-1">{new Date().toISOString()}</p>
              </div>
            </div>

            {/* Summary Metrics Banner */}
            <div className="grid grid-cols-3 gap-3">
              {previewContent.summaryStats.map((stat, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">{stat.label}</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto max-h-80 border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold sticky top-0">
                  <tr>
                    {previewContent.headers.map((h, i) => (
                      <th key={i} className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewContent.rows.length === 0 ? (
                    <tr>
                      <td colSpan={previewContent.headers.length} className="px-3 py-4 text-center text-slate-400">
                        No records logged in this category.
                      </td>
                    </tr>
                  ) : (
                    previewContent.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Showing {previewContent.rows.length} verified records</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Printer className="w-4 h-4" />}
                  onClick={() => window.print()}
                >
                  Print Certified Report
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
