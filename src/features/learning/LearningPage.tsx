import React, { useState } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Assignment } from "../../types"
import { appStorage } from "../../services/storage"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { BookMarked, Calendar, CheckCircle2, Clock, UploadCloud, FileCheck, ArrowUpRight } from "lucide-react"

export const LearningPage: React.FC = () => {
  const { t } = useTenant()
  const { can, user } = useAuth()
  const [assignments] = useState<Assignment[]>(() => appStorage.getAssignments())
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault()
    setUploadSuccess(true)
    setTimeout(() => {
      setUploadSuccess(false)
      setIsSubmitModalOpen(false)
    }, 1500)
  }

  const columns: Column<Assignment>[] = [
    {
      key: "courseCode",
      header: "Code",
      sortable: true,
      render: (a) => <span className="font-mono text-xs font-bold text-indigo-600">{a.courseCode}</span>
    },
    {
      key: "title",
      header: "Assignment Title",
      sortable: true,
      render: (a) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{a.title}</p>
          <p className="text-[11px] text-slate-400">{a.courseName}</p>
        </div>
      )
    },
    {
      key: "dueDate",
      header: "Deadline",
      sortable: true,
      render: (a) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> {a.dueDate}
        </span>
      )
    },
    {
      key: "maxPoints",
      header: "Points",
      sortable: true,
      align: "center",
      render: (a) => <span className="font-semibold text-xs">{a.maxPoints} pts</span>
    },
    {
      key: "submissionsCount",
      header: "Submission Rate",
      sortable: true,
      align: "center",
      render: (a) => {
        const pct = Math.round((a.submissionsCount / a.totalEnrolled) * 100)
        return (
          <div className="text-center">
            <span className="text-xs font-semibold">{a.submissionsCount} / {a.totalEnrolled}</span>
            <div className="w-20 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      }
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (a) => (
        <Badge
          variant={a.status === "active" ? "primary" : a.status === "graded" ? "success" : "warning"}
          size="sm"
          className="capitalize"
        >
          {a.status.replace("_", " ")}
        </Badge>
      )
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      render: (a) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedAssignment(a)
            setIsSubmitModalOpen(true)
          }}
        >
          {user?.role === "student" ? "Upload Work" : "View Submissions"}
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Learning Management & Coursework
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Deliver coursework assignments, digital learning modules, and automated grading rubrics.
          </p>
        </div>

        {can("faculty") && (
          <Button leftIcon={<BookMarked className="w-4 h-4" />}>
            New Assignment
          </Button>
        )}
      </div>

      <DataTable
        data={assignments}
        columns={columns}
        searchPlaceholder="Search assignments or courses..."
        searchKeys={["title", "courseCode", "courseName"]}
        exportFileName="coursework-assignments"
      />

      {/* Submission Modal */}
      {selectedAssignment && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title={`Coursework Submission — ${selectedAssignment.courseCode}`}
          description={selectedAssignment.title}
          size="md"
        >
          {uploadSuccess ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Work Uploaded Successfully
              </h3>
              <p className="text-xs text-slate-500">
                Your submission timestamp has been cryptographically recorded for plagiarism review.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitWork} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Assignment Brief:</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {selectedAssignment.description}
                </p>
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500 font-medium">
                  <span>Max Score: {selectedAssignment.maxPoints} Points</span>
                  <span>Due: {selectedAssignment.dueDate}</span>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Click to choose PDF or Project ZIP file
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Maximum file size: 25MB (Accepts .pdf, .zip, .ipynb, .docx)
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Assignment
                </Button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}
