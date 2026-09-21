import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Exam, MarkRecord } from "../../types"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { 
  FileSpreadsheet, 
  Eye, 
  Printer, 
  Award, 
  CheckCircle2, 
  FileText, 
  Plus, 
  Trash2, 
  Check, 
  Lock, 
  RefreshCw, 
  AlertCircle,
  Loader2 
} from "lucide-react"

function mapBackendExam(ex: any): Exam {
  const sched = ex.exam_subjects?.[0]
  return {
    id: ex.id,
    name: ex.name,
    courseCode: sched?.subject_name || ex.name || "Assessment",
    courseName: ex.class_cohort_name || ex.academic_year_name || "Academic Cohort",
    term: ex.academic_year_name || "Active Session",
    date: ex.start_date || sched?.exam_date || new Date().toISOString().split("T")[0],
    time: sched?.start_time ? `${sched.start_time.slice(0, 5)} - ${sched.end_time?.slice(0, 5)}` : "10:00 - 13:00",
    venue: "Main Hall",
    maxMarks: Number(sched?.max_marks || 100),
    passingMarks: Number(sched?.passing_marks || 40),
    status: (ex.is_published ? "published" : "upcoming") as Exam["status"],
  }
}

function mapBackendMark(m: any): MarkRecord {
  return {
    id: m.id,
    examId: m.exam_id || m.exam_subject || "",
    studentId: m.student?.id || m.student || "",
    studentName: m.student_name || m.student?.full_name || "Enrolled Student",
    admissionNumber: m.admission_number || m.student?.admission_number || "",
    marksObtained: Number(m.marks_obtained || 0),
    maxMarks: Number(m.max_marks || 100),
    grade: m.grade || "—",
    gpa: Number(m.grade_point || 0.0),
    status: m.status === "entered" ? "submitted" : m.status || "submitted",
    feedback: m.feedback || "",
  }
}

export const ExaminationsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can, user } = useAuth()
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [marks, setMarks] = useState<MarkRecord[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [selectedReportCard, setSelectedReportCard] = useState<MarkRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [examForm, setExamForm] = useState({
    name: "",
    class_cohort_id: "",
    academic_year_id: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  })
  const [formError, setFormError] = useState("")
  const [actionSuccess, setActionSuccess] = useState("")

  const canManageExams = can("institute_admin") || can("exams.manage") || user?.is_superuser
  const canEnterMarks = can("institute_admin") || can("marks.enter") || can("faculty") || user?.is_superuser

  const fetchExams = async () => {
    setIsLoading(true)
    try {
      const [examsRes, classesRes, yearsRes] = await Promise.all([
        api.examinations.getExams(),
        api.academics.getClasses(),
        api.academics.getYears(),
      ])

      if (Array.isArray(classesRes)) setClasses(classesRes)
      if (Array.isArray(yearsRes)) setAcademicYears(yearsRes)

      if (Array.isArray(examsRes) && examsRes.length > 0) {
        const mappedExams = examsRes.map(mapBackendExam)
        setExams(mappedExams)
        if (!selectedExam) {
          setSelectedExam(mappedExams[0])
        }
      } else {
        setExams([])
        setSelectedExam(null)
      }
    } catch (err) {
      console.warn("Could not fetch exams from API:", err)
      setExams([])
      setSelectedExam(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [tenant.id, tenant.slug])

  // Fetch Marks for Selected Exam
  const fetchMarksForExam = async (examId: string) => {
    try {
      const res = await api.examinations.getMarks({ exam_id: examId })
      if (Array.isArray(res) && res.length > 0) {
        setMarks(res.map(mapBackendMark))
      } else {
        setMarks([])
      }
    } catch {
      setMarks([])
    }
  }

  useEffect(() => {
    if (selectedExam?.id) {
      fetchMarksForExam(selectedExam.id)
    } else {
      setMarks([])
    }
  }, [selectedExam?.id])

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!examForm.name.trim()) {
      setFormError("Exam name is required.")
      return
    }

    setIsSubmitting(true)
    setFormError("")
    try {
      await api.examinations.createExam({
        name: examForm.name.trim(),
        class_cohort: examForm.class_cohort_id || classes[0]?.id,
        academic_year: examForm.academic_year_id || academicYears[0]?.id,
        start_date: examForm.start_date,
        end_date: examForm.end_date,
      })

      setActionSuccess("Examination created successfully!")
      await fetchExams()
      setTimeout(() => {
        setIsCreateModalOpen(false)
        setActionSuccess("")
      }, 1000)
    } catch (err: any) {
      setFormError(err.message || "Failed to create examination.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublishExam = async (examId: string) => {
    if (window.confirm("Publishing will lock examination scores and broadcast report cards to students. Proceed?")) {
      try {
        await api.examinations.publishExam(examId)
        setActionSuccess("Examination results published and locked!")
        await fetchExams()
        setTimeout(() => setActionSuccess(""), 3000)
      } catch (err: any) {
        alert(err.message || "Failed to publish exam.")
      }
    }
  }

  const handleDeleteExam = async (examId: string) => {
    if (window.confirm("Are you sure you want to delete this examination roster?")) {
      try {
        await api.examinations.deleteExam(examId)
        await fetchExams()
      } catch (err: any) {
        alert(err.message || "Failed to delete exam.")
      }
    }
  }

  const handleScoreChange = async (markId: string, newScore: number) => {
    setMarks(prev => prev.map(m => m.id === markId ? { ...m, marksObtained: newScore } : m))
    try {
      if (!markId.startsWith("draft-")) {
        await api.examinations.updateMark(markId, newScore)
      }
    } catch (err) {
      console.warn("Backend mark update error:", err)
    }
  }

  const columns: Column<MarkRecord>[] = [
    {
      key: "admissionNumber",
      header: "Adm ID",
      sortable: true,
      render: (m) => <span className="font-mono text-xs font-semibold text-slate-500">{m.admissionNumber}</span>
    },
    {
      key: "studentName",
      header: `${t("learner")} Name`,
      sortable: true,
      render: (m) => <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">{m.studentName}</span>
    },
    {
      key: "marksObtained",
      header: "Score / 100",
      sortable: true,
      align: "center",
      render: (m) => canEnterMarks && selectedExam?.status !== "published" ? (
        <input
          type="number"
          min={0}
          max={m.maxMarks}
          value={m.marksObtained}
          onChange={(e) => handleScoreChange(m.id, Number(e.target.value))}
          className="w-20 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      ) : (
        <span className="font-bold text-xs">{m.marksObtained}/{m.maxMarks}</span>
      )
    },
    {
      key: "grade",
      header: "Grade",
      align: "center",
      sortable: true,
      render: (m) => {
        const pct = (m.marksObtained / m.maxMarks) * 100
        const grade = pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B" : pct >= 55 ? "C" : "F"
        return (
          <Badge variant={grade.startsWith("A") ? "success" : grade === "B" ? "primary" : grade === "C" ? "warning" : "danger"}>
            {grade}
          </Badge>
        )
      }
    },
    {
      key: "feedback",
      header: "Academic Remarks",
      render: (m) => <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{m.feedback || "Standard Performance"}</span>
    },
    {
      key: "actions",
      header: "Report Card",
      align: "right",
      render: (m) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedReportCard(m)}
          leftIcon={<FileText className="w-3.5 h-3.5 text-indigo-500" />}
        >
          View Card
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Examinations & Transcript Grading
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administer examination rosters, record evaluation marks, and publish institutional report cards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchExams}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canManageExams && (
            <Button
              onClick={() => {
                setFormError("")
                setExamForm({
                  name: "",
                  class_cohort_id: classes[0]?.id || "",
                  academic_year_id: academicYears[0]?.id || "",
                  start_date: new Date().toISOString().split("T")[0],
                  end_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
                })
                setIsCreateModalOpen(true)
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Exam
            </Button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Exam Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {exams.map((ex) => {
          const isSelected = selectedExam?.id === ex.id
          return (
            <div
              key={ex.id}
              onClick={() => setSelectedExam(ex)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-xs"
                  : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge variant={ex.status === "published" ? "success" : "warning"} className="capitalize">
                  {ex.status === "published" ? "Results Published" : "Draft / Grading"}
                </Badge>
                <span className="text-[11px] text-slate-500">{ex.date}</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                {ex.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {ex.courseName} • Max {ex.maxMarks} Marks
              </p>

              {canManageExams && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                  {ex.status !== "published" ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handlePublishExam(ex.id)}
                      className="text-xs h-7 px-2.5"
                    >
                      <Check className="w-3 h-3 mr-1" /> Publish Results
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <Lock className="w-3 h-3" /> Sealed & Locked
                    </span>
                  )}

                  <button
                    onClick={() => handleDeleteExam(ex.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected Exam Marks Ledger */}
      {selectedExam && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
              Evaluation Ledger: {selectedExam.name}
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {marks.length} Candidate Transcripts
            </span>
          </div>

          <DataTable
            data={marks}
            columns={columns}
            searchPlaceholder="Search candidates by name or ID..."
            searchKeys={["studentName", "admissionNumber", "grade"]}
            exportFileName={`${selectedExam.name.toLowerCase().replace(/\s+/g, "-")}-grades`}
          />
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Examination"
        size="md"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Examination Name *"
            required
            value={examForm.name}
            onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
            placeholder="e.g. Mid-Term Assessment Fall 2026"
          />

          <div className="grid grid-cols-2 gap-4">
            {classes.length > 0 && (
              <Select
                label="Class Cohort"
                value={examForm.class_cohort_id}
                onChange={(e) => setExamForm({ ...examForm, class_cohort_id: e.target.value })}
                options={classes.map(c => ({ value: c.id, label: c.name }))}
              />
            )}
            {academicYears.length > 0 && (
              <Select
                label="Academic Year"
                value={examForm.academic_year_id}
                onChange={(e) => setExamForm({ ...examForm, academic_year_id: e.target.value })}
                options={academicYears.map(y => ({ value: y.id, label: y.name }))}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={examForm.start_date}
              onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={examForm.end_date}
              onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {isSubmitting ? "Creating..." : "Save Examination"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Official Report Card Modal */}
      {selectedReportCard && (
        <Modal
          isOpen={!!selectedReportCard}
          onClose={() => setSelectedReportCard(null)}
          title="Official Learner Grade Transcript"
          size="md"
        >
          <div className="space-y-6">
            <div className="text-center p-4 border-b border-slate-200 dark:border-slate-800">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md"
                style={{ backgroundColor: tenant.primaryColor }}
              >
                {tenant.code.slice(0, 2)}
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-2">
                {tenant.name}
              </h2>
              <p className="text-xs text-slate-500">Official Transcript & Academic Assessment</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400">Candidate Name:</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedReportCard.studentName}</p>
              </div>
              <div>
                <p className="text-slate-400">Admission Number:</p>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedReportCard.admissionNumber}</p>
              </div>
              <div>
                <p className="text-slate-400">Evaluation:</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedExam?.name}</p>
              </div>
              <div>
                <p className="text-slate-400">Score & Grade:</p>
                <p className="font-bold text-indigo-600">{selectedReportCard.marksObtained} / 100 ({selectedReportCard.grade})</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Educator Evaluation:</span>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{selectedReportCard.feedback || "Good progress demonstrated."}</p>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-3.5 h-3.5" />}>
                Print Card
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedReportCard(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
