import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Staff } from "../../types"
import { appStorage } from "../../services/storage"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Plus, GraduationCap, Mail, Phone, Calendar, Clock, BookOpen, Loader2, Edit3, Trash2, Eye, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"

function mapBackendStaff(s: any): Staff {
  const rawName = (s.full_name || `${s.first_name || ""} ${s.last_name || ""}`).trim()
  const parts = rawName.length > 0 ? rawName.split(" ") : ["Staff", "Member"]
  const fn = parts[0] || (s.email ? s.email.split("@")[0] : "Staff")
  const ln = parts.slice(1).join(" ") || "Member"

  return {
    id: s.id,
    staffNumber: s.employee_id || `FAC-${String(s.id).slice(0, 4)}`,
    firstName: fn,
    lastName: ln,
    email: s.email || s.user?.email || `${fn.toLowerCase()}.${ln.toLowerCase()}@omni-edu.org`,
    avatar: s.avatar_url || s.user?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fn)}+${encodeURIComponent(ln)}&background=4f46e5&color=fff`,
    roleTitle: s.designation || "Faculty",
    department: s.department_name || s.department?.name || "Academic Faculty",
    designation: s.designation || "Lecturer",
    joiningDate: s.joined_date || s.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
    status: s.status === "active" ? "active" : "on_leave",
    subjects: s.subjects || ["Core Curriculum"],
    phone: s.phone_number || "+1 (555) 000-0000",
    weeklyHours: Number(s.weekly_hours || 16),
  }
}

export const StaffPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can, user } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null)

  // Add staff form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [department, setDepartment] = useState("Computer Science & AI")
  const [designation, setDesignation] = useState("Assistant Professor")
  const [phone, setPhone] = useState("")
  const [weeklyHours, setWeeklyHours] = useState(16)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    designation: "",
    phone: "",
    weeklyHours: 16,
    status: "active",
  })
  const [editError, setEditError] = useState("")
  const [editSuccess, setEditSuccess] = useState("")

  const canManage = can("institute_admin") || can("staff.manage") || user?.is_superuser

  const fetchStaff = async () => {
    setIsLoading(true)
    try {
      const data = await api.staff.list()
      if (Array.isArray(data)) {
        setStaff(data.map(mapBackendStaff))
      } else {
        setStaff([])
      }
    } catch (err) {
      console.warn("Could not fetch staff from API:", err)
      setStaff(appStorage.getStaff())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [tenant.id, tenant.slug])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setFormError("First and last name are required.")
      return
    }

    setIsSubmitting(true)
    setFormError("")

    try {
      await api.staff.create({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        designation: designation.trim(),
        qualification: "Faculty Member",
        employment_type: "full_time",
        phone_number: phone.trim() || undefined,
      })

      const staffNumber = `FAC-${100 + staff.length + 1}`
      appStorage.addStaff({
        staffNumber,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@omni-edu.org`,
        roleTitle: designation,
        department,
        designation,
        joiningDate: new Date().toISOString().split("T")[0],
        status: "active",
        subjects: ["Core Curriculum"],
        phone: phone || "+1 (555) 000-0000",
        weeklyHours: Number(weeklyHours) || 16
      })

      await fetchStaff()
      setIsSubmitting(false)
      setIsAddModalOpen(false)
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
    } catch (err: any) {
      setFormError(err.message || "Failed to create staff member. Please check details.")
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (st: Staff) => {
    setStaffToEdit(st)
    setEditForm({
      firstName: st.firstName,
      lastName: st.lastName,
      email: st.email,
      department: st.department,
      designation: st.designation,
      phone: st.phone,
      weeklyHours: st.weeklyHours,
      status: st.status,
    })
    setEditError("")
    setEditSuccess("")
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffToEdit) return
    setIsSubmitting(true)
    setEditError("")
    setEditSuccess("")

    try {
      await api.staff.update(staffToEdit.id, {
        designation: editForm.designation.trim(),
        phone_number: editForm.phone.trim() || undefined,
        status: editForm.status === "active" ? "active" : "on_leave",
      })

      setEditSuccess("Faculty profile updated successfully!")
      await fetchStaff()
      setTimeout(() => {
        setIsEditModalOpen(false)
        setStaffToEdit(null)
      }, 1000)
    } catch (err: any) {
      setEditError(err.message || "Failed to update staff record.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm(`Are you sure you want to remove this ${t("educator")} member?`)) {
      try {
        await api.staff.delete(id)
      } catch (err) {
        console.warn("Backend staff delete failed:", err)
      }
      await fetchStaff()
      if (selectedStaff?.id === id) setSelectedStaff(null)
    }
  }

  const columns: Column<Staff>[] = [
    {
      key: "staffNumber",
      header: "Staff ID",
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{s.staffNumber}</span>
    },
    {
      key: "firstName",
      header: t("educator"),
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-2.5">
          <img
            src={s.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.firstName)}+${encodeURIComponent(s.lastName)}&background=4f46e5&color=fff`}
            alt={s.firstName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-100">{s.firstName} {s.lastName}</p>
            <p className="text-[11px] text-slate-400">{s.designation}</p>
          </div>
        </div>
      )
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      render: (s) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{s.department}</span>
    },
    {
      key: "weeklyHours",
      header: "Workload",
      sortable: true,
      align: "center",
      render: (s) => (
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
          <Clock className="w-3 h-3 text-slate-400" /> {s.weeklyHours} hrs/wk
        </span>
      )
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      render: (s) => (
        <Badge variant={s.status === "active" ? "success" : "warning"} size="sm" className="capitalize">
          {s.status.replace("_", " ")}
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
            onClick={() => setSelectedStaff(s)}
            className="h-8 w-8 p-0"
            title="View Dossier"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEdit(s)}
                className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                title="Edit Faculty"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(s.id)}
                className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                title="Delete Faculty"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
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
            {t("educators")} & Staff Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Faculty workloads, academic departments, research specializations, and availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStaff}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canManage && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add {t("educator")}
            </Button>
          )}
        </div>
      </div>

      <DataTable
        data={staff}
        columns={columns}
        searchPlaceholder="Search by name, department, or staff ID..."
        searchKeys={["firstName", "lastName", "staffNumber", "department", "email"]}
        onRowClick={(item) => setSelectedStaff(item)}
        exportFileName={`${t("educators").toLowerCase()}-directory`}
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add New ${t("educator")}`}
        description="Register a faculty member or instructor into the institutional directory"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Arthur"
            />
            <Input
              label="Last Name *"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Pendelton"
            />
          </div>

          <Input
            label="Institutional Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="arthur.pendelton@institution.edu"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Computer Science"
            />
            <Input
              label="Designation / Title"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Associate Professor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
            />
            <Input
              label="Weekly Teaching Hours"
              type="number"
              value={weeklyHours}
              onChange={(e) => setWeeklyHours(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {isSubmitting ? "Registering..." : `Save ${t("educator")}`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Staff Modal */}
      {isEditModalOpen && staffToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Edit ${t("educator")} Record`}
          description={`Update faculty details for ${staffToEdit.firstName} ${staffToEdit.lastName}`}
          size="md"
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                disabled
                value={editForm.firstName}
              />
              <Input
                label="Last Name"
                disabled
                value={editForm.lastName}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Designation / Title *"
                required
                value={editForm.designation}
                onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
              />
              <Select
                label="Status"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                options={[
                  { value: "active", label: "Active" },
                  { value: "on_leave", label: "On Leave" },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              <Input
                label="Weekly Teaching Hours"
                type="number"
                value={editForm.weeklyHours}
                onChange={(e) => setEditForm({ ...editForm, weeklyHours: Number(e.target.value) })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Selected Staff Profile Modal */}
      {selectedStaff && (
        <Modal
          isOpen={!!selectedStaff}
          onClose={() => setSelectedStaff(null)}
          title={`${t("educator")} Dossier`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={selectedStaff.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStaff.firstName)}+${encodeURIComponent(selectedStaff.lastName)}&background=4f46e5&color=fff`}
                alt={selectedStaff.firstName}
                className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedStaff.firstName} {selectedStaff.lastName}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                  {selectedStaff.roleTitle}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedStaff.department} • Joined {selectedStaff.joiningDate}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                Assigned Subject Curriculums
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedStaff.subjects.map((subj, i) => (
                  <Badge key={i} variant="secondary">
                    {subj}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {canManage && (
                <Button variant="outline" size="sm" onClick={() => {
                  setSelectedStaff(null)
                  handleOpenEdit(selectedStaff)
                }}>
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Profile
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={() => setSelectedStaff(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
