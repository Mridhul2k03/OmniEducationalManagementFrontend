import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Student, StudentStatus } from "../../types"
import { appStorage } from "../../services/storage"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { formatCurrency } from "../../lib/utils"
import { 
  Plus, UserCheck, Eye, Edit3, Trash2, Mail, Phone, Calendar, BookOpen, 
  AlertCircle, RefreshCw, Loader2, CheckCircle2, ShieldAlert, Clock, 
  RotateCcw, Check, XCircle, Search, Filter, Share2, Copy, ExternalLink 
} from "lucide-react"

function mapBackendStudent(s: any): Student {
  const guardian = s.guardian_links?.[0]
  const genderMap: Record<string, "male" | "female" | "other"> = {
    M: "male",
    F: "female",
    O: "other",
  }
  const statusMap: Record<string, StudentStatus> = {
    admitted: "active",
    enrolled: "active",
    applied: "active",
    suspended: "suspended",
    graduated: "graduated",
    withdrawn: "transferred",
    active: "active",
  }

  const fn = s.first_name || ""
  const ln = s.last_name || ""

  return {
    id: s.id,
    admissionNumber: s.admission_number || "",
    firstName: fn,
    lastName: ln,
    email: s.user?.email || s.email || (fn ? `${fn.toLowerCase()}.${ln.toLowerCase()}@omni-edu.org` : "—"),
    avatar: s.avatar || s.user?.avatar_url,
    gender: genderMap[s.gender] || (s.gender as any) || "other",
    dateOfBirth: s.date_of_birth || "",
    gradeOrProgram: s.grade_or_program || s.enrollments?.[0]?.class_cohort_name || s.current_class_name || "—",
    sectionOrBatch: s.section_or_batch || s.enrollments?.[0]?.section_name || s.current_section_name || "—",
    enrollmentDate: s.admission_date || s.created_at?.split("T")[0] || "",
    status: statusMap[s.status] || "active",
    guardianName: guardian?.guardian_name || s.guardian_name || "—",
    guardianRelationship: guardian?.relationship || "—",
    guardianContact: guardian?.phone_number || s.guardian_contact || "—",
    outstandingBalance: Number(s.outstanding_balance ?? 0),
    attendanceRate: Number(s.attendance_rate ?? 0),
    gpa: Number(s.gpa ?? 0.0),
  }
}

export const StudentsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can, user } = useAuth()
  const [searchParams] = useSearchParams()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Modals state
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null)

  // New Admission Form State
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [dob, setDob] = useState("2005-01-01")
  const [gender, setGender] = useState<"male" | "female" | "other">("female")
  const [gradeOrProgram, setGradeOrProgram] = useState("B.Sc. Computer Science")
  const [sectionOrBatch, setSectionOrBatch] = useState("Cohort A - Year 1")
  const [guardianName, setGuardianName] = useState("")
  const [guardianContact, setGuardianContact] = useState("")
  const [formError, setFormError] = useState("")

  // Edit Form State
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "2005-01-01",
    gender: "female",
    gradeOrProgram: "",
    sectionOrBatch: "",
    status: "active",
    guardianName: "",
    guardianContact: "",
    outstandingBalance: 0,
    attendanceRate: 95,
  })
  const [editError, setEditError] = useState("")
  const [editSuccess, setEditSuccess] = useState("")

  const canManage = can("institute_admin") || can("students.create") || user?.is_superuser
  const canUpdate = can("institute_admin") || can("students.update") || can("faculty") || user?.is_superuser
  const canDelete = can("institute_admin") || can("students.delete") || user?.is_superuser

  // Top Tabs: "students" | "requests"
  const [activeTab, setActiveTab] = useState<"students" | "requests">(
    (searchParams.get("tab") as any) === "requests" ? "requests" : "students"
  )

  // Verification Requests State
  const [requests, setRequests] = useState<any[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(false)
  const [requestFilter, setRequestFilter] = useState<string>("all")
  const [requestSearch, setRequestSearch] = useState("")

  // Request Action Modals State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [requestToReject, setRequestToReject] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectPermanent, setRejectPermanent] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null)

  // Shareable Registration Link State
  const [copiedLink, setCopiedLink] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const registrationLink = typeof window !== "undefined"
    ? `${window.location.origin}/student/register?institution=${tenant.slug || tenant.id}`
    : `/student/register?institution=${tenant.slug || tenant.id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      const el = document.createElement("textarea")
      el.value = registrationLink
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const data = await api.students.list()
      if (Array.isArray(data)) {
        const mapped = data.map(mapBackendStudent)
        setStudents(mapped)
      } else {
        setStudents([])
      }
    } catch (err) {
      console.warn("Could not fetch students from API:", err)
      setStudents(appStorage.getStudents())
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRequests = async () => {
    setIsLoadingRequests(true)
    try {
      const data = await api.students.listRegistrationRequests({
        status: requestFilter !== "all" ? requestFilter : undefined,
        search: requestSearch || undefined,
      })
      setRequests(Array.isArray(data) ? data : [])
    } catch (err) {
      console.warn("Could not fetch registration requests:", err)
      setRequests([])
    } finally {
      setIsLoadingRequests(false)
    }
  }

  useEffect(() => {
    fetchStudents()
    fetchRequests()
  }, [tenant.id, tenant.slug])

  useEffect(() => {
    if (activeTab === "requests") {
      fetchRequests()
    }
  }, [activeTab, requestFilter])

  useEffect(() => {
    if (searchParams.get("admit") === "true" && canManage) {
      setIsAdmitModalOpen(true)
    }
  }, [searchParams, canManage])

  const pendingRequestsCount = requests.filter((r) => r.status === "pending").length

  const handleApproveRequest = async (requestId: string) => {
    setIsActionLoading(true)
    setActionSuccessMessage(null)
    setActionErrorMessage(null)
    try {
      const res = await api.students.approveRegistrationRequest(requestId)
      setActionSuccessMessage(res?.message || "Student registration approved and enrolled successfully.")
      await fetchRequests()
      await fetchStudents()
    } catch (err: any) {
      setActionErrorMessage(err?.message || "Failed to approve registration request.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleOpenRejectModal = (req: any) => {
    setRequestToReject(req)
    setRejectReason("")
    setRejectPermanent(false)
    setActionErrorMessage(null)
    setIsRejectModalOpen(true)
  }

  const handleConfirmReject = async () => {
    if (!requestToReject) return
    setIsActionLoading(true)
    setActionSuccessMessage(null)
    setActionErrorMessage(null)
    try {
      const res = await api.students.rejectRegistrationRequest(requestToReject.id, {
        permanent: rejectPermanent,
        reason: rejectReason.trim(),
      })
      setActionSuccessMessage(res?.message || "Request rejected successfully.")
      setIsRejectModalOpen(false)
      setRequestToReject(null)
      await fetchRequests()
    } catch (err: any) {
      setActionErrorMessage(err?.message || "Failed to reject registration request.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleAdmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setFormError("Please fill out first and last name.")
      return
    }

    setFormError("")
    setIsSubmitting(true)

    try {
      const gFirst = guardianName.trim() ? guardianName.trim().split(" ")[0] : "Legal"
      const gLast = guardianName.trim() && guardianName.trim().split(" ").length > 1 
        ? guardianName.trim().split(" ").slice(1).join(" ") 
        : "Guardian"

      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        class_name: gradeOrProgram,
        section_name: sectionOrBatch,
        date_of_birth: dob || "2005-01-01",
        gender: gender === "female" ? "F" : gender === "male" ? "M" : "O",
        admission_date: new Date().toISOString().split("T")[0],
        guardian: {
          first_name: gFirst,
          last_name: gLast,
          phone_number: guardianContact.trim() || "+1 (555) 000-0000",
          relationship: "legal_guardian",
        }
      }

      await api.students.admit(payload)

      // Sync local storage for resilience
      const admNum = `ADM-${new Date().getFullYear()}-${String(students.length + 1).padStart(3, "0")}`
      appStorage.addStudent({
        admissionNumber: admNum,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@omni-edu.org`,
        gender,
        dateOfBirth: dob || "2005-01-01",
        gradeOrProgram,
        sectionOrBatch,
        enrollmentDate: new Date().toISOString().split("T")[0],
        status: "active",
        guardianName: guardianName || "Legal Guardian",
        guardianRelationship: "Parent",
        guardianContact: guardianContact || "+1 (555) 000-0000",
        outstandingBalance: 0,
        attendanceRate: 100,
        gpa: 4.0
      })

      await fetchStudents()
      setIsAdmitModalOpen(false)
      // Reset form
      setFirstName("")
      setLastName("")
      setEmail("")
      setGuardianName("")
      setGuardianContact("")
      setFormError("")
    } catch (err: any) {
      console.error("Admit student error:", err)
      setFormError(err.message || "Failed to admit student. Please verify server connection.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (s: Student) => {
    setStudentToEdit(s)
    setEditForm({
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      dateOfBirth: s.dateOfBirth,
      gender: s.gender,
      gradeOrProgram: s.gradeOrProgram,
      sectionOrBatch: s.sectionOrBatch,
      status: s.status,
      guardianName: s.guardianName,
      guardianContact: s.guardianContact,
      outstandingBalance: s.outstandingBalance,
      attendanceRate: s.attendanceRate,
    })
    setEditError("")
    setEditSuccess("")
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentToEdit) return
    setIsSubmitting(true)
    setEditError("")
    setEditSuccess("")

    try {
      await api.students.update(studentToEdit.id, {
        first_name: editForm.firstName.trim(),
        last_name: editForm.lastName.trim(),
        gender: editForm.gender === "female" ? "F" : editForm.gender === "male" ? "M" : "O",
        date_of_birth: editForm.dateOfBirth,
        status: editForm.status === "active" ? "enrolled" : editForm.status,
      })

      appStorage.updateStudent(studentToEdit.id, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        gender: editForm.gender as any,
        dateOfBirth: editForm.dateOfBirth,
        gradeOrProgram: editForm.gradeOrProgram,
        sectionOrBatch: editForm.sectionOrBatch,
        status: editForm.status as any,
        guardianName: editForm.guardianName,
        guardianContact: editForm.guardianContact,
        outstandingBalance: Number(editForm.outstandingBalance),
        attendanceRate: Number(editForm.attendanceRate),
      })

      setEditSuccess("Student record updated successfully!")
      await fetchStudents()
      setTimeout(() => {
        setIsEditModalOpen(false)
        setStudentToEdit(null)
      }, 1000)
    } catch (err: any) {
      setEditError(err.message || "Failed to update student record.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to remove this ${t("learner")} record? This action will archive their profile.`)) {
      try {
        await api.students.delete(id)
      } catch (err) {
        console.warn("Backend student delete failed:", err)
      }
      appStorage.deleteStudent(id)
      await fetchStudents()
      if (selectedStudent?.id === id) setSelectedStudent(null)
    }
  }

  const columns: Column<Student>[] = [
    {
      key: "admissionNumber",
      header: "Adm. ID",
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{s.admissionNumber}</span>
    },
    {
      key: "firstName",
      header: t("learner"),
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <img
            src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.firstName)}+${encodeURIComponent(s.lastName)}&background=6366f1&color=fff`}
            alt={s.firstName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{s.firstName} {s.lastName}</p>
            <p className="text-[11px] text-slate-400">{s.email}</p>
          </div>
        </div>
      )
    },
    {
      key: "gradeOrProgram",
      header: `${t("program")} / ${t("class")}`,
      sortable: true,
      render: (s) => (
        <div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{s.gradeOrProgram}</p>
          <p className="text-[10px] text-slate-400">{s.sectionOrBatch}</p>
        </div>
      )
    },
    {
      key: "attendanceRate",
      header: "Attendance",
      sortable: true,
      align: "center",
      render: (s) => (
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
          s.attendanceRate >= 90 
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : s.attendanceRate >= 75
            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
        }`}>
          {s.attendanceRate}%
        </span>
      )
    },
    {
      key: "outstandingBalance",
      header: "Balance",
      sortable: true,
      align: "right",
      render: (s) => (
        <span className={s.outstandingBalance > 0 ? "text-rose-600 font-semibold" : "text-slate-500"}>
          {formatCurrency(s.outstandingBalance, tenant.currency)}
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (s) => (
        <Badge
          variant={
            s.status === "active" ? "success" : s.status === "suspended" ? "danger" : "secondary"
          }
          size="sm"
          className="capitalize"
        >
          {s.status}
        </Badge>
      )
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedStudent(s)}
            className="h-8 w-8 p-0"
            title="View Profile"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {canUpdate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEdit(s)}
              className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              title="Edit Student"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(s.id)}
              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
              title="Delete Record"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("learners")} Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage institutional admissions, academic status, balances, and guardian contacts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
            className="border-[#3F72AF]/40 text-[#112D4E] dark:text-slate-200 hover:bg-[#3F72AF]/10"
            leftIcon={<Share2 className="w-3.5 h-3.5 text-[#3F72AF]" />}
          >
            <span>Registration Link</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudents}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canManage && (
            <Button
              onClick={() => setIsAdmitModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Admit New {t("learner")}
            </Button>
          )}
        </div>
      </div>

      {/* Action Notification Messages */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:underline text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="font-medium">{actionErrorMessage}</span>
          </div>
          <button onClick={() => setActionErrorMessage(null)} className="text-rose-700 hover:underline text-xs font-semibold">
            Dismiss
          </button>
        </div>
      )}

      {/* Top Navigation Tabs */}
      <div className="flex border-b border-[#DBE2EF] dark:border-slate-800 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("students")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "students"
              ? "border-[#3F72AF] text-[#112D4E] dark:text-white"
              : "border-transparent text-slate-500 hover:text-[#112D4E] dark:hover:text-slate-300"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Active {t("learners")} Directory</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DBE2EF]/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "requests"
              ? "border-[#3F72AF] text-[#112D4E] dark:text-white"
              : "border-transparent text-slate-500 hover:text-[#112D4E] dark:hover:text-slate-300"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Student Verification Requests</span>
          {pendingRequestsCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
              {pendingRequestsCount} pending
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[#DBE2EF]/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Enrolled Directory */}
      {activeTab === "students" && (
        <DataTable
          data={students}
          columns={columns}
          searchPlaceholder={`Search by name, ID, or ${t("program")}...`}
          searchKeys={["firstName", "lastName", "admissionNumber", "gradeOrProgram", "email"]}
          onRowClick={(student) => setSelectedStudent(student)}
          exportFileName={`${t("learners").toLowerCase()}-records`}
        />
      )}

      {/* Tab 2: Verification Requests Management */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Shareable Registration Link Banner */}
          <div className="bg-gradient-to-r from-[#DBE2EF]/50 via-white to-[#DBE2EF]/30 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800/50 p-4 sm:p-5 rounded-2xl border border-[#3F72AF]/30 dark:border-[#3F72AF]/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center p-1.5 rounded-lg bg-[#3F72AF]/15 text-[#3F72AF] dark:text-blue-400">
                  <Share2 className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-[#112D4E] dark:text-white">
                  Direct Student Self-Registration Link
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  ✓ Pre-Selected for {tenant.name}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Send this link to prospective or newly admitted students. When opened, <strong>{tenant.name}</strong> is automatically pre-selected and locked in the registration portal. After registering, their verification requests appear here for approval.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
              <div className="flex items-center bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 select-all max-w-[320px] truncate shadow-inner">
                <span className="truncate">{registrationLink}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className={`transition-all font-semibold ${
                    copiedLink
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-[#112D4E] hover:bg-[#112D4E]/90 text-white"
                  }`}
                  leftIcon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedLink ? "Copied!" : "Copy Link"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(registrationLink, "_blank")}
                  className="border-[#DBE2EF] dark:border-slate-700 hover:bg-[#DBE2EF]/40"
                  title="Open in new tab to test"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                </Button>
              </div>
            </div>
          </div>

          {/* Controls Bar: Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-[#DBE2EF] dark:border-slate-800">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending Review" },
                { id: "approved", label: "Approved" },
                { id: "rejected", label: "Revision Required" },
                { id: "permanently_rejected", label: "Permanently Rejected" },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setRequestFilter(filter.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    requestFilter === filter.id
                      ? "bg-[#112D4E] text-white"
                      : "bg-[#DBE2EF]/40 text-slate-600 dark:text-slate-300 hover:bg-[#DBE2EF] dark:hover:bg-slate-800"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchRequests()}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#DBE2EF] dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#3F72AF]"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchRequests}
                disabled={isLoadingRequests}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRequests ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-[#DBE2EF] dark:border-slate-800 overflow-hidden shadow-xs">
            {isLoadingRequests ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#3F72AF]" />
                <span className="text-xs">Loading verification requests...</span>
              </div>
            ) : requests.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <UserCheck className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  No verification requests found
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When prospective or existing students self-register via the dedicated student login portal, their verification requests will appear here for your review.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#DBE2EF] dark:border-slate-800 bg-[#F9F7F7]/60 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-4">Adm. / Roll No</th>
                      <th className="py-3 px-4">Applicant & Contact</th>
                      <th className="py-3 px-4">Program / Grade</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-center">Re-requests</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DBE2EF]/60 dark:divide-slate-800">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#3F72AF]">
                          {req.admission_number}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {req.applicant_name || `${req.first_name} ${req.last_name}`}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{req.email}</span>
                            {req.phone_number && (
                              <>
                                <span>•</span>
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{req.phone_number}</span>
                              </>
                            )}
                          </div>
                          {req.notes && (
                            <p className="mt-1 text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded">
                              "{req.notes}"
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {req.grade_or_program || "—"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {req.last_requested_at ? new Date(req.last_requested_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3 px-4 text-center font-medium">
                          {req.re_request_count > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
                              {req.re_request_count}x
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {req.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              <Clock className="w-3 h-3" /> Pending Review
                            </span>
                          )}
                          {req.status === "approved" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {req.status === "rejected" && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                                <AlertCircle className="w-3 h-3" /> Revision Required
                              </span>
                              {req.rejection_reason && (
                                <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate" title={req.rejection_reason}>
                                  Reason: {req.rejection_reason}
                                </p>
                              )}
                            </div>
                          )}
                          {req.status === "permanently_rejected" && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                <ShieldAlert className="w-3 h-3" /> False / Permanently Rejected
                              </span>
                              {req.rejection_reason && (
                                <p className="text-[10px] text-rose-400 mt-0.5 max-w-xs truncate" title={req.rejection_reason}>
                                  {req.rejection_reason}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {req.status !== "approved" && req.status !== "permanently_rejected" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                isLoading={isActionLoading}
                                onClick={() => handleApproveRequest(req.id)}
                                leftIcon={<Check className="w-3.5 h-3.5" />}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => handleOpenRejectModal(req)}
                                leftIcon={<XCircle className="w-3.5 h-3.5" />}
                              >
                                Reject
                              </Button>
                            </div>
                          ) : req.status === "approved" ? (
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              Active Student
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                              Blacklisted
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admit Learner Modal */}
      <Modal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        title={`New ${t("learner")} Admission`}
        description={`Complete profile details for incoming ${t("learner").toLowerCase()}`}
        size="lg"
      >
        <form onSubmit={handleAdmitSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name *"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Liam"
            />
            <Input
              label="Last Name *"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Vance"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Institutional Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="liam.vance@student.edu"
            />
            <Input
              label="Date of Birth *"
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
            <Select
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              options={[
                { value: "female", label: "Female" },
                { value: "male", label: "Male" },
                { value: "other", label: "Other" }
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={`${t("program")} / Major`}
              value={gradeOrProgram}
              onChange={(e) => setGradeOrProgram(e.target.value)}
              placeholder="B.Sc. Computer Science"
            />
            <Input
              label={`${t("class")} / Cohort`}
              value={sectionOrBatch}
              onChange={(e) => setSectionOrBatch(e.target.value)}
              placeholder="Cohort A - Year 1"
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Guardian / Emergency Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Guardian Full Name"
                value={guardianName}
                onChange={(e) => setGuardianName(e.target.value)}
                placeholder="Parent / Sponsor Name"
              />
              <Input
                label="Guardian Contact Phone"
                value={guardianContact}
                onChange={(e) => setGuardianContact(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setIsAdmitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {isSubmitting ? "Submitting Admission..." : "Complete Admission"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Student Modal */}
      {isEditModalOpen && studentToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit ${t("learner")} Details`}
          description={`Update institutional records for ${studentToEdit.firstName} ${studentToEdit.lastName}`}
          size="lg"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}
            {editSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{editSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                required
                value={editForm.firstName}
                onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              />
              <Input
                label="Last Name *"
                required
                value={editForm.lastName}
                onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Institutional Email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
              <Input
                label="Date of Birth"
                type="date"
                value={editForm.dateOfBirth}
                onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
              />
              <Select
                label="Status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                options={[
                  { value: "active", label: "Active / Enrolled" },
                  { value: "suspended", label: "Suspended" },
                  { value: "graduated", label: "Graduated" },
                  { value: "transferred", label: "Withdrawn / Transferred" }
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`${t("program")} / Major`}
                value={editForm.gradeOrProgram}
                onChange={(e) => setEditForm({ ...editForm, gradeOrProgram: e.target.value })}
              />
              <Input
                label={`${t("class")} / Cohort`}
                value={editForm.sectionOrBatch}
                onChange={(e) => setEditForm({ ...editForm, sectionOrBatch: e.target.value })}
              />
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
              <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Guardian & Ledger
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Guardian Full Name"
                  value={editForm.guardianName}
                  onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })}
                />
                <Input
                  label="Guardian Contact Phone"
                  value={editForm.guardianContact}
                  onChange={(e) => setEditForm({ ...editForm, guardianContact: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isSubmitting ? "Saving Updates..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Profile Detail Modal */}
      {selectedStudent && (
        <Modal
          isOpen={!!selectedStudent}
          onClose={() => setSelectedStudent(null)}
          title={`${t("learner")} Profile Details`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header info banner */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <img
                src={selectedStudent.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.firstName)}+${encodeURIComponent(selectedStudent.lastName)}&background=6366f1&color=fff`}
                alt={selectedStudent.firstName}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <Badge variant={selectedStudent.status === "active" ? "success" : "danger"}>
                    {selectedStudent.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Admission ID: <span className="font-mono font-semibold">{selectedStudent.admissionNumber}</span> • Enrolled: {selectedStudent.enrollmentDate}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedStudent.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Attendance Rate</span>
                <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  {selectedStudent.attendanceRate}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Cumulative GPA</span>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedStudent.gpa?.toFixed(2) || "3.80"}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Outstanding Fees</span>
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatCurrency(selectedStudent.outstandingBalance, tenant.currency)}
                </p>
              </div>
            </div>

            {/* Guardian and Academic Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Academic Placement
                </h4>
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <p><span className="text-slate-400">Program:</span> {selectedStudent.gradeOrProgram}</p>
                  <p><span className="text-slate-400">Cohort / Section:</span> {selectedStudent.sectionOrBatch}</p>
                  <p><span className="text-slate-400">Gender:</span> <span className="capitalize">{selectedStudent.gender}</span></p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500" /> Guardian Details
                </h4>
                <div className="space-y-1 text-slate-600 dark:text-slate-300">
                  <p><span className="text-slate-400">Name:</span> {selectedStudent.guardianName}</p>
                  <p><span className="text-slate-400">Relationship:</span> {selectedStudent.guardianRelationship}</p>
                  <p><span className="text-slate-400">Contact:</span> {selectedStudent.guardianContact}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {canUpdate && (
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedStudent(null)
                  handleOpenEdit(selectedStudent)
                }}>
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Student
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => setSelectedStudent(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Registration Request Modal */}
      {isRejectModalOpen && requestToReject && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => {
            if (!isActionLoading) {
              setIsRejectModalOpen(false)
              setRequestToReject(null)
            }
          }}
          title="Reject Student Verification Request"
          description="Review applicant details and choose rejection severity."
          size="md"
        >
          <div className="space-y-4">
            {/* Applicant Summary */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {requestToReject.applicant_name || `${requestToReject.first_name} ${requestToReject.last_name}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Student ID / Roll No:</span>
                <span className="font-mono font-bold text-[#3F72AF]">{requestToReject.admission_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span>{requestToReject.email}</span>
              </div>
            </div>

            {/* Rejection Reason Textarea */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Reason for Rejection (Visible to Student)
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-[#DBE2EF] bg-white px-3 py-2 text-xs text-[#112D4E] focus:ring-2 focus:ring-[#3F72AF] focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                placeholder="e.g. Student ID does not correspond to our active admission ledger. Please re-check your student credentials."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            {/* Permanent Rejection Checkbox */}
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rejectPermanent}
                  onChange={(e) => setRejectPermanent(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 border-rose-300 h-4 w-4"
                />
                <div>
                  <div className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    Reject Permanently (Flag as False / Fraudulent Request)
                  </div>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                    {rejectPermanent
                      ? "⚠️ CAUTION: The applicant will be permanently blacklisted. They cannot re-request verification or register again with this email address."
                      : "Leave unchecked to allow student to re-request verification after the 24-hour cooldown period."}
                  </p>
                </div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                disabled={isActionLoading}
                onClick={() => {
                  setIsRejectModalOpen(false)
                  setRequestToReject(null)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className={rejectPermanent ? "bg-rose-600 hover:bg-rose-700 text-white" : "bg-orange-600 hover:bg-orange-700 text-white"}
                disabled={isActionLoading}
                isLoading={isActionLoading}
                onClick={handleConfirmReject}
              >
                {rejectPermanent ? "Confirm Permanent Rejection" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Share Registration Link Modal */}
      {isShareModalOpen && (
        <Modal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title="Direct Student Registration Link"
          size="md"
        >
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-xl bg-[#DBE2EF]/30 dark:bg-slate-800/60 border border-[#DBE2EF] dark:border-slate-700 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#3F72AF]/10 text-[#3F72AF] dark:text-blue-400 shrink-0 mt-0.5">
                <Share2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#112D4E] dark:text-white">
                  University Student Onboarding Link
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Share this dedicated URL with students via email, SMS, admissions letters, or your university portal.
                </p>
              </div>
            </div>

            {/* Institution Details Pill */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="text-slate-400 block text-[11px]">Owner Institution:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{tenant.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Identifier / Slug:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{tenant.slug || tenant.id}</span>
              </div>
            </div>

            {/* Link Input & Copy */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Sharable URL (Institution Pre-Selected)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={registrationLink}
                  className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none select-all"
                />
                <Button
                  onClick={handleCopyLink}
                  className={`shrink-0 font-semibold ${
                    copiedLink
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-[#3F72AF] hover:bg-[#3F72AF]/90 text-white"
                  }`}
                  leftIcon={copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copiedLink ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* How it works note */}
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#3F72AF]" />
                How student self-registration works:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-blue-800/90 dark:text-blue-300 pl-1">
                <li>Students who visit this link see <strong>{tenant.name}</strong> locked as their institution.</li>
                <li>They create their account using their personal or official email.</li>
                <li>They submit a verification request with their admission / student ID.</li>
                <li>Their request arrives here under the <strong>Student Verification Requests</strong> tab for institutional review.</li>
              </ul>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsShareModalOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => window.open(registrationLink, "_blank")}
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open Link to Test
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
