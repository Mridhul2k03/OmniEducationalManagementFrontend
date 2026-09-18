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
import { Plus, UserCheck, Eye, Trash2, Mail, Phone, Calendar, BookOpen, AlertCircle, RefreshCw, Loader2 } from "lucide-react"

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
  }

  const fn = s.first_name || ""
  const ln = s.last_name || ""
  const fallbackEmail = `${fn.toLowerCase()}.${ln.toLowerCase()}@omni-edu.org`

  return {
    id: s.id,
    admissionNumber: s.admission_number || `ADM-${s.id?.slice(0, 5) || "001"}`,
    firstName: fn,
    lastName: ln,
    email: s.user?.email || s.email || fallbackEmail,
    avatar: s.avatar || s.user?.avatar_url,
    gender: genderMap[s.gender] || "other",
    dateOfBirth: s.date_of_birth || "2005-01-01",
    gradeOrProgram: s.grade_or_program || s.enrollments?.[0]?.class_cohort_name || "B.Sc. Computer Science",
    sectionOrBatch: s.section_or_batch || s.enrollments?.[0]?.section_name || "Cohort A - Year 1",
    enrollmentDate: s.admission_date || new Date().toISOString().split("T")[0],
    status: statusMap[s.status] || "active",
    guardianName: guardian?.guardian_name || "Legal Guardian",
    guardianRelationship: guardian?.relationship || "Guardian",
    guardianContact: guardian?.phone_number || "+1 (555) 000-0000",
    outstandingBalance: s.outstanding_balance ?? 0,
    attendanceRate: s.attendance_rate ?? 95,
    gpa: s.gpa ?? 3.8,
  }
}

export const StudentsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can } = useAuth()
  const [searchParams] = useSearchParams()
  const [students, setStudents] = useState<Student[]>(() => appStorage.getStudents())
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Modals state
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

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

  const fetchStudents = async () => {
    setIsLoading(true)
    try {
      const data = await api.students.list()
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map(mapBackendStudent)
        setStudents(mapped)
      } else {
        setStudents(appStorage.getStudents())
      }
    } catch (err) {
      console.warn("Could not fetch students from API, using fallback:", err)
      setStudents(appStorage.getStudents())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [tenant.id])

  useEffect(() => {
    if (searchParams.get("admit") === "true") {
      setIsAdmitModalOpen(true)
    }
  }, [searchParams])

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

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to remove this ${t("learner")} record?`)) {
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
      render: (s) => <span className="font-mono text-xs font-semibold">{s.admissionNumber}</span>
    },
    {
      key: "firstName",
      header: t("learner"),
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <img
            src={s.avatar || `https://ui-avatars.com/api/?name=${s.firstName}+${s.lastName}&background=6366f1&color=fff`}
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
          {can("institute_admin") && (
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

        <Button
          onClick={() => setIsAdmitModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Admit New {t("learner")}
        </Button>
      </div>

      {/* Main Table */}
      <DataTable
        data={students}
        columns={columns}
        searchPlaceholder={`Search by name, ID, or ${t("program")}...`}
        searchKeys={["firstName", "lastName", "admissionNumber", "gradeOrProgram", "email"]}
        onRowClick={(student) => setSelectedStudent(student)}
        exportFileName={`${t("learners").toLowerCase()}-records`}
      />

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
              label="Institutional Email *"
              type="email"
              required
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
                src={selectedStudent.avatar || `https://ui-avatars.com/api/?name=${selectedStudent.firstName}+${selectedStudent.lastName}&background=6366f1&color=fff`}
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

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
