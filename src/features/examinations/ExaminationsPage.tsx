import React, { useState } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Exam, MarkRecord } from "../../types"
import { appStorage } from "../../services/storage"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { FileSpreadsheet, Eye, Printer, Award, CheckCircle2, FileText } from "lucide-react"

export const ExaminationsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can } = useAuth()
  const [exams] = useState<Exam[]>(() => appStorage.getExams())
  const [selectedExam, setSelectedExam] = useState<Exam>(exams[0])
  const [marks, setMarks] = useState<MarkRecord[]>(() => appStorage.getMarks(exams[0].id))
  const [selectedReportCard, setSelectedReportCard] = useState<MarkRecord | null>(null)

  const handleExamSelect = (exam: Exam) => {
    setSelectedExam(exam)
    setMarks(appStorage.getMarks(exam.id))
  }

  const handleScoreChange = (markId: string, newScore: number) => {
    appStorage.updateMark(markId, newScore)
    setMarks([...appStorage.getMarks(selectedExam.id)])
  }

  const columns: Column<MarkRecord>[] = [
    {
      key: "admissionNumber",
      header: "Adm ID",
      sortable: true,
      render: (m) => <span className="font-mono text-xs font-semibold">{m.admissionNumber}</span>
    },
    {
      key: "studentName",
      header: t("learner"),
      sortable: true,
      render: (m) => <span className="font-semibold text-slate-900 dark:text-slate-100">{m.studentName}</span>
    },
    {
      key: "marksObtained",
      header: `Score (Max ${selectedExam.maxMarks})`,
      sortable: true,
      align: "center",
      render: (m) => (
        <div className="inline-flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={selectedExam.maxMarks}
            value={m.marksObtained}
            onChange={(e) => handleScoreChange(m.id, Number(e.target.value))}
            className="w-16 h-8 text-center text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
          <span className="text-xs text-slate-400">/ {m.maxMarks}</span>
        </div>
      )
    },
    {
      key: "grade",
      header: "Grade",
      sortable: true,
      align: "center",
      render: (m) => (
        <Badge
          variant={
            m.grade.startsWith("A") ? "success" : m.grade.startsWith("B") ? "primary" : "warning"
          }
        >
          {m.grade}
        </Badge>
      )
    },
    {
      key: "gpa",
      header: "Grade Points",
      sortable: true,
      align: "center",
      render: (m) => <span className="font-semibold text-slate-900 dark:text-slate-100">{m.gpa.toFixed(1)}</span>
    },
    {
      key: "status",
      header: "Publish State",
      align: "center",
      render: (m) => (
        <Badge variant={m.status === "published" ? "success" : "secondary"} size="sm">
          {m.status}
        </Badge>
      )
    },
    {
      key: "report",
      header: "Transcript",
      align: "right",
      render: (m) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedReportCard(m)}
          leftIcon={<FileText className="w-3.5 h-3.5" />}
        >
          Report Card
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Examinations & Grade Sheets
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administer examination rosters, input assessment scores, and publish certified transcripts.
          </p>
        </div>

        {can("institute_admin") && (
          <Button leftIcon={<Award className="w-4 h-4" />}>
            Schedule New Exam
          </Button>
        )}
      </div>

      {/* Exam Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exams.map((ex) => {
          const isSelected = ex.id === selectedExam.id
          return (
            <div
              key={ex.id}
              onClick={() => handleExamSelect(ex)}
              className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-xs"
                  : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  {ex.courseCode}
                </span>
                <Badge variant={ex.status === "published" ? "success" : "warning"} size="sm">
                  {ex.status}
                </Badge>
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mt-1.5 truncate">
                {ex.name}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {ex.date} • {ex.time}
              </p>
              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Pass: {ex.passingMarks} / Max: {ex.maxMarks}</span>
                <span className="font-medium text-slate-600 dark:text-slate-300">{ex.venue}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Grade Sheet Table */}
      <DataTable
        data={marks}
        columns={columns}
        searchPlaceholder={`Search by ${t("learner").toLowerCase()} or adm number...`}
        searchKeys={["studentName", "admissionNumber", "grade"]}
        exportFileName={`${selectedExam.courseCode}-grades`}
      />

      {/* Official Report Card Modal */}
      {selectedReportCard && (
        <Modal
          isOpen={!!selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
          title="Official Transcript & Report Card"
          description={`${tenant.name} Academic Records Division`}
          size="md"
        >
          <div className="space-y-4 p-4 border rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="text-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                {tenant.name}
              </h3>
              <p className="text-xs text-slate-500">Official Semester Grade Memorandum</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">{t("learner")}: </span>
                <strong className="text-slate-800 dark:text-slate-200">{selectedReportCard.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Admission No: </span>
                <strong className="font-mono">{selectedReportCard.admissionNumber}</strong>
              </div>
              <div>
                <span className="text-slate-400">Examination: </span>
                <span>{selectedExam.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Course Code: </span>
                <span>{selectedExam.courseCode}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-around text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Marks</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedReportCard.marksObtained} / {selectedReportCard.maxMarks}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Grade</span>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {selectedReportCard.grade}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">GPA Wt</span>
                <p className="text-xl font-bold text-emerald-600">
                  {selectedReportCard.gpa.toFixed(1)}
                </p>
              </div>
            </div>

            {selectedReportCard.feedback && (
              <div className="text-xs text-slate-600 dark:text-slate-300 italic p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                "{selectedReportCard.feedback}"
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Print Transcript
              </Button>
              <Button size="sm" onClick={() => setSelectedReportCard(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
