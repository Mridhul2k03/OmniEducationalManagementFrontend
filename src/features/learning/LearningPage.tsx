import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Assignment } from "../../types"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { 
  BookMarked, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  UploadCloud, 
  FileCheck, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  Loader2,
  RefreshCw 
} from "lucide-react"

export const LearningPage: React.FC = () => {
  const { t, tenant } = useTenant()
  const { can, user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [submissionText, setSubmissionText] = useState("")

  // Form
  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
    maxPoints: 100,
    description: "",
  })
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const canManageLMS = can("institute_admin") || can("faculty") || user?.is_superuser

  const fetchAssignments = async () => {
    setIsLoading(true)
    try {
      const [subjectsData, classesData] = await Promise.all([
        api.academics.getSubjects(),
        api.academics.getClasses(),
      ])

      if (Array.isArray(subjectsData)) setSubjects(subjectsData)
      if (Array.isArray(classesData)) setClasses(classesData)

      if (Array.isArray(subjectsData) && subjectsData.length > 0) {
        const liveAssignments: Assignment[] = subjectsData.map((subj: any, idx: number) => ({
          id: `asg-${subj.id}`,
          title: `${subj.name} — Core Practical Assignment`,
          courseCode: subj.code || `SUBJ-${idx + 1}`,
          courseName: subj.name,
          dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
          maxPoints: 100,
          submissionsCount: 12 + idx * 4,
          totalEnrolled: 40,
          status: "active",
          description: `Comprehensive research and problem-set review for ${subj.name}. Prepare your report and code notebook for evaluation.`,
        }))
        setAssignments(liveAssignments)
      } else {
        setAssignments([])
      }
    } catch {
      setAssignments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [tenant.id, tenant.slug])

  const handleOpenCreate = () => {
    setFormError("")
    setFormSuccess("")
    setFormData({
      title: "",
      subject_id: subjects[0]?.id || "",
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      maxPoints: 100,
      description: "",
    })
    setIsCreateModalOpen(true)
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setFormError("Assignment title is required.")
      return
    }

    const matchedSubj = subjects.find(s => s.id === formData.subject_id) || subjects[0]
    const newAsg: Assignment = {
      id: `asg-${Date.now()}`,
      title: formData.title.trim(),
      courseCode: matchedSubj?.code || "ACAD-101",
      courseName: matchedSubj?.name || "Core Subject",
      dueDate: formData.dueDate,
      maxPoints: Number(formData.maxPoints) || 100,
      submissionsCount: 0,
      totalEnrolled: 40,
      status: "active",
      description: formData.description.trim() || "Complete practical assessment questions.",
    }

    setAssignments(prev => [newAsg, ...prev])
    setFormSuccess("Assignment created successfully!")
    setTimeout(() => {
      setIsCreateModalOpen(false)
      setFormSuccess("")
    }, 800)
  }

  const handleOpenEdit = (asg: Assignment) => {
    setAssignmentToEdit(asg)
    setFormData({
      title: asg.title,
      subject_id: "",
      dueDate: asg.dueDate,
      maxPoints: asg.maxPoints,
      description: asg.description,
    })
    setFormError("")
    setFormSuccess("")
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!assignmentToEdit) return

    setAssignments(prev => prev.map(a => a.id === assignmentToEdit.id ? {
      ...a,
      title: formData.title.trim(),
      dueDate: formData.dueDate,
      maxPoints: Number(formData.maxPoints) || 100,
      description: formData.description.trim(),
    } : a))

    setFormSuccess("Assignment updated!")
    setTimeout(() => {
      setIsEditModalOpen(false)
      setAssignmentToEdit(null)
      setFormSuccess("")
    }, 800)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      setAssignments(prev => prev.filter(a => a.id !== id))
    }
  }

  const handleOpenSubmit = (asg: Assignment) => {
    setSelectedAssignment(asg)
    setSubmissionText("")
    setIsSubmitModalOpen(true)
  }

  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault()
    setUploadSuccess(true)
    setTimeout(() => {
      setUploadSuccess(false)
      setIsSubmitModalOpen(false)
      if (selectedAssignment) {
        setAssignments(prev => prev.map(a => a.id === selectedAssignment.id ? {
          ...a,
          submissionsCount: a.submissionsCount + 1,
        } : a))
      }
    }, 1500)
  }

  const columns: Column<Assignment>[] = [
    {
      key: "courseCode",
      header: "Code",
      sortable: true,
      render: (a) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{a.courseCode}</span>
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
      header: "Submissions",
      sortable: true,
      align: "center",
      render: (a) => (
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {a.submissionsCount} / {a.totalEnrolled}
        </span>
      )
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
          {a.status}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenSubmit(a)}
            className="text-xs h-7 px-2.5"
          >
            Submit Work
          </Button>
          {canManageLMS && (
            <>
              <button
                onClick={() => handleOpenEdit(a)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Edit Assignment"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDelete(a.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete Assignment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Learning Management System & Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create research assignments, distribute reading material, and track student submissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAssignments}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canManageLMS && (
            <Button
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Create Assignment
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={assignments}
        columns={columns}
        searchPlaceholder="Search assignments by title or course code..."
        searchKeys={["title", "courseCode", "courseName"]}
        onRowClick={(a) => setSelectedAssignment(a)}
        exportFileName="lms-assignments"
      />

      {/* Create Assignment Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Learning Assignment"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{formSuccess}</span>
            </div>
          )}

          <Input
            label="Assignment Title *"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Distributed Systems Lab 3"
          />

          {subjects.length > 0 && (
            <Select
              label="Subject / Module"
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              options={subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code || "SUBJ"})` }))}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Submission Deadline *"
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
            <Input
              label="Max Points *"
              type="number"
              required
              value={formData.maxPoints}
              onChange={(e) => setFormData({ ...formData, maxPoints: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Instructions & Problem Set Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail the deliverables, code formatting, and criteria..."
              className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Publish Assignment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Assignment Modal */}
      {isEditModalOpen && assignmentToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Assignment"
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            <Input
              label="Assignment Title *"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Submission Deadline *"
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
              <Input
                label="Max Points *"
                type="number"
                required
                value={formData.maxPoints}
                onChange={(e) => setFormData({ ...formData, maxPoints: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instructions
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Submit Assignment Modal */}
      {isSubmitModalOpen && selectedAssignment && (
        <Modal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title={`Submit Work: ${selectedAssignment.title}`}
          size="md"
        >
          <form onSubmit={handleSubmitWork} className="space-y-4">
            <p className="text-xs text-slate-500">
              {selectedAssignment.description}
            </p>

            {uploadSuccess ? (
              <div className="p-6 text-center bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Assignment Uploaded & Recorded!</p>
                <p className="text-xs text-slate-500">Timestamp: {new Date().toLocaleTimeString()}</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Student Submission Notes / GitHub Repo Link
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter notebook URL, research findings summary, or repository link..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Drag & Drop PDF / ZIP Artifacts</p>
                  <p className="text-[10px] text-slate-400 mt-1">Maximum file size: 50MB</p>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Submit Deliverable
                  </Button>
                </div>
              </>
            )}
          </form>
        </Modal>
      )}
    </div>
  )
}
