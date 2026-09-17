import React, { useState } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { Button } from "../../components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { Badge } from "../../components/ui/Badge"
import { Select } from "../../components/ui/Select"
import { BarChart3, Download, FileText, Printer, CheckCircle2, ShieldAlert } from "lucide-react"

export const ReportsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const [selectedReport, setSelectedReport] = useState("attendance")
  const [selectedTerm, setSelectedTerm] = useState("Fall 2026")
  const [isExporting, setIsExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState("")

  const handleExport = (format: "csv" | "pdf") => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      setExportMessage(`Successfully compiled ${selectedReport.toUpperCase()} report in ${format.toUpperCase()} format!`)
      setTimeout(() => setExportMessage(""), 4000)
    }, 1000)
  }

  const reportsList = [
    {
      id: "attendance",
      title: `${t("learner")} Attendance & Absenteeism Dossier`,
      desc: "Detailed breakdown of daily attendance percentages, unexcused absences, and chronic low-attendance flags.",
      badge: "Compliance",
      rowsCount: "3,420 Records"
    },
    {
      id: "academics",
      title: "Semester Grade Distribution & GPA Ledger",
      desc: "Official grade curve analysis, credits earned, class rankings, and academic probation rosters.",
      badge: "Academic",
      rowsCount: "1,240 Records"
    },
    {
      id: "finance",
      title: "Bursar Revenue & Fee Collection Audit",
      desc: "Reconciliation of invoiced tuitions, cleared bank remittances, scholarship disbursements, and aging arrears.",
      badge: "Finance",
      rowsCount: "4,180 Records"
    },
    {
      id: "faculty",
      title: `${t("educator")} Workload & Teaching Hours Analysis`,
      desc: "Classroom lecture distribution, lab supervision hours, and faculty-to-student ratio metrics.",
      badge: "HR / Staff",
      rowsCount: "180 Records"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Reports & Export Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-ready institutional reporting with instant CSV and certified PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-44">
            <Select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              options={[
                { value: "Fall 2026", label: "Fall 2026 Term" },
                { value: "Spring 2026", label: "Spring 2026 Term" },
                { value: "Academic Year 2025-26", label: "Full Year 2025-26" }
              ]}
            />
          </div>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportsList.map((rep) => {
          const isSelected = rep.id === selectedReport
          return (
            <div
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30 shadow-xs"
                  : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge variant={isSelected ? "primary" : "secondary"}>
                  {rep.badge}
                </Badge>
                <span className="text-xs font-mono text-slate-400">{rep.rowsCount}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                {rep.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {rep.desc}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Target: {selectedTerm}
                </span>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isExporting && isSelected}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExport("csv")
                    }}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    isLoading={isExporting && isSelected}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExport("pdf")
                    }}
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
