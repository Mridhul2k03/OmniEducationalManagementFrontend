import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { Button } from "../../components/ui/Button"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Badge } from "../../components/ui/Badge"
import { Tabs } from "../../components/ui/Tabs"
import { Modal } from "../../components/ui/Modal"
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card"
import { DataTable, Column } from "../../components/tables/DataTable"
import { api } from "../../services/api"
import { InstitutionUser, RoleDefinition, PermissionDefinition } from "../../types"
import {
  Shield,
  ShieldAlert,
  Building2,
  Layers,
  CheckCircle2,
  Sliders,
  Save,
  ScrollText,
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Lock,
  Power,
  RefreshCw,
  Crown,
  UserCheck,
  AlertCircle,
  Loader2,
  Search,
  KeyRound,
  Eye,
  Check,
} from "lucide-react"
import { AuditLogsPage } from "../audit/AuditLogsPage"

const ALL_PERMISSION_MODULES = [
  {
    module: "Administration & Security",
    permissions: [
      { code: "users.manage_admins", name: "Create & Manage Admin Accounts", desc: "Super Admin only" },
      { code: "users.manage_roles", name: "Manage Roles & Permissions", desc: "Configure RBAC matrix" },
      { code: "users.manage_staff", name: "Add, Edit, Deactivate Staff", desc: "Manage faculty & staff lifecycle" },
      { code: "users.view", name: "View Users Directory", desc: "Browse institutional users" },
      { code: "tenant.manage_settings", name: "Manage Institution Settings", desc: "Profile, branding & timezones" },
      { code: "audit.view", name: "View Audit Trail", desc: "Inspect security logs" },
    ],
  },
  {
    module: "Learners & Admissions",
    permissions: [
      { code: "students.view", name: "View Learners", desc: "Browse student registry" },
      { code: "students.create", name: "Create Student / Admission", desc: "Register new students" },
      { code: "students.update", name: "Update Student Details", desc: "Modify student records" },
      { code: "students.delete", name: "Archive / Delete Student", desc: "Remove student profiles" },
    ],
  },
  {
    module: "Attendance & Schedules",
    permissions: [
      { code: "attendance.view", name: "View Attendance Records", desc: "Inspect daily matrices" },
      { code: "attendance.mark", name: "Mark Daily Attendance", desc: "Record class presence" },
      { code: "attendance.correct", name: "Approve / Correct Attendance", desc: "Edit historical entries" },
    ],
  },
  {
    module: "Examinations & Grading",
    permissions: [
      { code: "exams.manage", name: "Create & Schedule Exams", desc: "Setup test timetables" },
      { code: "marks.enter", name: "Enter Marks", desc: "Submit course scores" },
      { code: "marks.review", name: "Review Examination Marks", desc: "Verify and calibrate grades" },
      { code: "marks.publish", name: "Publish Results", desc: "Release official transcripts" },
    ],
  },
  {
    module: "Finance & Fee Invoicing",
    permissions: [
      { code: "fees.view", name: "View Fees & Invoices", desc: "Inspect billing registers" },
      { code: "fees.create_invoice", name: "Generate Invoices", desc: "Issue fee demands" },
      { code: "fees.record_payment", name: "Record Payments", desc: "Process receipt entries" },
      { code: "fees.refund", name: "Process Fee Refunds", desc: "Authorize disbursements" },
    ],
  },
  {
    module: "Academics, Staff & Reporting",
    permissions: [
      { code: "academics.manage", name: "Manage Academics", desc: "Curriculums, classes, terms" },
      { code: "staff.manage", name: "Manage Staff Workloads", desc: "Faculty assignments" },
      { code: "reports.export", name: "Export Data & Reports", desc: "Generate PDF / CSV digests" },
    ],
  },
]

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { tenant, updateTenant, t } = useTenant()
  const { user, can, isInstitutionSuperAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState("users")
  const [isSaved, setIsSaved] = useState(false)

  // Users Tab State
  const [usersList, setUsersList] = useState<InstitutionUser[]>([])
  const [rolesList, setRolesList] = useState<RoleDefinition[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [userRoleFilter, setUserRoleFilter] = useState("all")
  const [userStatusFilter, setUserStatusFilter] = useState("all")

  // Modals
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [isViewDossierModalOpen, setIsViewDossierModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<InstitutionUser | null>(null)

  // Add User Form
  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Password123!",
    phone: "",
    roleCode: "institution_admin",
    designation: "Administrator",
    department: "",
    permissions: [] as string[],
  })
  const [addError, setAddError] = useState("")
  const [addLoading, setAddLoading] = useState(false)

  // Edit User Form
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    roleCode: "institution_admin",
    designation: "",
    permissions: [] as string[],
  })
  const [editError, setEditError] = useState("")
  const [editLoading, setEditLoading] = useState(false)

  // Reset Password Form
  const [newPassword, setNewPassword] = useState("Password123!")
  const [resetError, setResetError] = useState("")
  const [resetSuccess, setResetSuccess] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  // Tenant Profile Form
  const [name, setName] = useState(tenant.name)
  const [tagline, setTagline] = useState(tenant.tagline)
  const [currency, setCurrency] = useState(tenant.currency)
  const [timezone, setTimezone] = useState(tenant.timezone)
  const [primaryColor, setPrimaryColor] = useState(tenant.primaryColor)

  const isAuthorized = isInstitutionSuperAdmin || user?.is_superuser || can("institute_admin") || can("users.manage_roles")

  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const data = await api.institutionUsers.list()
      if (Array.isArray(data)) {
        setUsersList(data)
      } else {
        setUsersList([])
      }
    } catch (err) {
      console.warn("Could not load users list:", err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const roles = await api.roles.list()
      if (Array.isArray(roles)) {
        setRolesList(roles)
      }
    } catch (err) {
      console.warn("Could not load roles:", err)
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      fetchUsers()
      fetchRoles()
    }
  }, [tenant.id, tenant.slug])

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-4">
          <Shield className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="mt-1.5 text-xs text-slate-500 max-w-sm">
          Tenant Settings & RBAC configuration require Administrator credentials.
        </p>
      </div>
    )
  }

  const handleSaveTenant = (e: React.FormEvent) => {
    e.preventDefault()
    updateTenant({
      ...tenant,
      name,
      tagline,
      currency,
      timezone,
      primaryColor,
    })
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const handleToggleStatus = async (userItem: InstitutionUser) => {
    if (userItem.is_institution_superadmin && !isInstitutionSuperAdmin && !user?.is_superuser) {
      alert("Only an Institution Super Admin can modify a Super Admin account.")
      return
    }
    if (userItem.id === user?.id) {
      alert("You cannot deactivate your own active session account.")
      return
    }

    try {
      await api.institutionUsers.toggleStatus(userItem.membership_id)
      await fetchUsers()
    } catch (err: any) {
      alert(err.message || "Failed to update user status.")
    }
  }

  const handleOpenAddUser = () => {
    setAddForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "Password123!",
      phone: "",
      roleCode: isInstitutionSuperAdmin ? "institution_admin" : "faculty",
      designation: "Administrator",
      department: "",
      permissions: [
        "staff.manage",
        "students.view",
        "attendance.view",
        "academics.manage",
      ],
    })
    setAddError("")
    setIsAddUserModalOpen(true)
  }

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addForm.firstName.trim() || !addForm.lastName.trim() || !addForm.email.trim()) {
      setAddError("First name, last name, and email are required.")
      return
    }

    setAddLoading(true)
    setAddError("")

    try {
      await api.institutionUsers.create({
        first_name: addForm.firstName.trim(),
        last_name: addForm.lastName.trim(),
        email: addForm.email.trim().toLowerCase(),
        password: addForm.password,
        phone_number: addForm.phone.trim() || undefined,
        role_code: addForm.roleCode,
        designation: addForm.designation.trim() || undefined,
        permissions: addForm.permissions,
      })

      await fetchUsers()
      setIsAddUserModalOpen(false)
    } catch (err: any) {
      setAddError(err.message || "Failed to create user account.")
    } finally {
      setAddLoading(false)
    }
  }

  const handleOpenEditUser = (userItem: InstitutionUser) => {
    setSelectedUser(userItem)
    setEditForm({
      firstName: userItem.first_name,
      lastName: userItem.last_name,
      phone: userItem.phone_number || "",
      roleCode: userItem.primary_role?.code || "faculty",
      designation: userItem.staff_profile?.designation || "",
      permissions: userItem.permissions || [],
    })
    setEditError("")
    setIsEditUserModalOpen(true)
  }

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setEditLoading(true)
    setEditError("")

    try {
      await api.institutionUsers.update(selectedUser.membership_id, {
        first_name: editForm.firstName.trim(),
        last_name: editForm.lastName.trim(),
        phone_number: editForm.phone.trim() || undefined,
        role_code: editForm.roleCode,
        designation: editForm.designation.trim() || undefined,
        permissions: editForm.permissions,
      })

      await fetchUsers()
      setIsEditUserModalOpen(false)
      setSelectedUser(null)
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.")
    } finally {
      setEditLoading(false)
    }
  }

  const handleOpenResetPassword = (userItem: InstitutionUser) => {
    setSelectedUser(userItem)
    setNewPassword("Password123!")
    setResetError("")
    setResetSuccess("")
    setIsResetPasswordModalOpen(true)
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    if (!newPassword || newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.")
      return
    }

    setResetLoading(true)
    setResetError("")
    setResetSuccess("")

    try {
      await api.institutionUsers.resetPassword(selectedUser.membership_id, newPassword)
      setResetSuccess(`Password for ${selectedUser.email} has been updated successfully!`)
      setTimeout(() => {
        setIsResetPasswordModalOpen(false)
        setSelectedUser(null)
      }, 1500)
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.")
    } finally {
      setResetLoading(false)
    }
  }

  const handleDeleteUser = async (userItem: InstitutionUser) => {
    if (userItem.is_institution_superadmin) {
      alert("Institution Super Admin accounts cannot be deleted directly.")
      return
    }
    if (window.confirm(`Are you sure you want to remove user "${userItem.email}" from ${tenant.name}?`)) {
      try {
        await api.institutionUsers.delete(userItem.membership_id)
        await fetchUsers()
      } catch (err: any) {
        alert(err.message || "Failed to delete user.")
      }
    }
  }

  const tabs = [
    { id: "users", label: "Admins & Staff Accounts", icon: <Users className="w-4 h-4" /> },
    { id: "rbac", label: "Roles & Permissions Matrix", icon: <Shield className="w-4 h-4" /> },
    { id: "hierarchy", label: "Authority & Governance", icon: <ShieldAlert className="w-4 h-4" /> },
    { id: "tenant", label: "Institution Profile", icon: <Building2 className="w-4 h-4" /> },
    { id: "terminology", label: "Adaptive Terminology Engine", icon: <Sliders className="w-4 h-4" /> },
    { id: "subscription", label: "Plan & Usage Limits", icon: <Layers className="w-4 h-4" /> },
    { id: "audit", label: "Security & Audit Trail", icon: <ScrollText className="w-4 h-4" /> },
  ]

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.staff_profile?.designation?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.staff_profile?.employee_id?.toLowerCase().includes(userSearch.toLowerCase())

    const matchesRole =
      userRoleFilter === "all" ||
      u.primary_role?.code === userRoleFilter ||
      (userRoleFilter === "super_admin" && u.is_institution_superadmin)

    const matchesStatus =
      userStatusFilter === "all" || u.status === userStatusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  // Metrics
  const totalCount = usersList.length
  const superAdminCount = usersList.filter((u) => u.is_institution_superadmin).length
  const adminCount = usersList.filter((u) => !u.is_institution_superadmin && u.primary_role?.code === "institution_admin").length
  const staffCount = usersList.filter((u) => ["faculty", "teacher", "accountant", "principal", "librarian"].includes(u.primary_role?.code)).length
  const activeCount = usersList.filter((u) => u.status === "active").length
  const suspendedCount = usersList.filter((u) => u.status === "suspended").length

  const userColumns: Column<InstitutionUser>[] = [
    {
      key: "name",
      header: "User & Identity",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || u.email)}&background=4f46e5&color=fff`}
              alt={u.full_name}
              className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            {u.is_institution_superadmin && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-xs" title="Institution Super Admin">
                <Crown className="w-3 h-3" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 dark:text-slate-100">{u.full_name || "Unnamed User"}</span>
              {u.staff_profile?.employee_id && (
                <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                  {u.staff_profile.employee_id}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Assigned Role",
      sortable: true,
      render: (u) => {
        if (u.is_institution_superadmin) {
          return (
            <Badge variant="warning" size="sm" className="font-semibold flex items-center gap-1 w-fit bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Crown className="w-3 h-3" /> Institution Super Admin
            </Badge>
          )
        }
        if (u.primary_role?.code === "institution_admin") {
          return (
            <Badge variant="primary" size="sm" className="font-semibold flex items-center gap-1 w-fit bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Shield className="w-3 h-3" /> Delegated Admin
            </Badge>
          )
        }
        return (
          <Badge variant="secondary" size="sm" className="capitalize w-fit">
            {u.primary_role?.name || u.primary_role?.code?.replace("_", " ")}
          </Badge>
        )
      },
    },
    {
      key: "designation",
      header: "Designation / Dept",
      render: (u) => (
        <div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
            {u.staff_profile?.designation || "Staff Member"}
          </p>
          <p className="text-[11px] text-slate-400">
            {u.staff_profile?.department || "General Administration"}
          </p>
        </div>
      ),
    },
    {
      key: "permissions",
      header: "RBAC Capabilities",
      render: (u) => {
        if (u.is_institution_superadmin) {
          return <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Wildcard Full Access (*)</span>
        }
        return (
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
            {u.permissions?.length || 0} permissions
          </span>
        )
      },
    },
    {
      key: "status",
      header: "Account Status",
      align: "center",
      render: (u) => (
        <Badge variant={u.status === "active" ? "success" : "danger"} size="sm" className="capitalize">
          {u.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedUser(u)
              setIsViewDossierModalOpen(true)
            }}
            className="h-8 w-8 p-0"
            title="View User Dossier"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEditUser(u)}
            className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
            title="Edit Role & Permissions"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(u)}
            className={`h-8 w-8 p-0 ${
              u.status === "active"
                ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                : "text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
            }`}
            title={u.status === "active" ? "Deactivate Account" : "Activate Account"}
          >
            <Power className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenResetPassword(u)}
            className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
            title="Reset Password"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </Button>

          {!u.is_institution_superadmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteUser(u)}
              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
              title="Remove User"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Institution Governance & RBAC Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage Super Admins, delegated administrators, staff roles, and granular capability matrices for {tenant.name}.
          </p>
        </div>

        {isSaved && (
          <div className="p-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" /> Changes Applied
          </div>
        )}
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* TAB 1: Admins & Staff Accounts */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Accounts</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 shadow-xs">
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Super Admins
              </span>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{superAdminCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 shadow-xs">
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Delegated Admins
              </span>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{adminCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 shadow-xs">
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Faculty & Staff</span>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{staffCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 shadow-xs">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Status</span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {activeCount} <span className="text-xs font-normal text-slate-400">({suspendedCount} Suspended)</span>
              </p>
            </div>
          </div>

          {/* Action and Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search name, email, employee ID..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="all">All Roles</option>
                <option value="super_admin">Super Admins</option>
                <option value="institution_admin">Delegated Admins</option>
                <option value="faculty">Faculty / Instructors</option>
                <option value="accountant">Accountants</option>
                <option value="student">Students</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="outline" size="sm" onClick={fetchUsers} disabled={isLoadingUsers}>
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/app/users")} leftIcon={<Users className="w-4 h-4 text-indigo-400" />}>
                Full User Portal
              </Button>
              <Button size="sm" onClick={handleOpenAddUser} leftIcon={<UserPlus className="w-4 h-4" />}>
                Add User / Admin
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <DataTable
            data={filteredUsers}
            columns={userColumns}
            searchPlaceholder="Filter user records..."
            exportFileName={`${tenant.slug}-users-registry`}
          />
        </div>
      )}

      {/* TAB 2: Roles & Permissions Matrix */}
      {activeTab === "rbac" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Configurable Role-Based Access Control (RBAC)</CardTitle>
                <p className="text-xs text-slate-500">
                  Matrix of assigned capabilities and security boundaries across institutional roles.
                </p>
              </div>
              <Badge variant="primary" size="sm">
                Tenant Scoped
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {ALL_PERMISSION_MODULES.map((mod) => (
              <div key={mod.module} className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {mod.module}
                </h3>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 w-1/3">Capability</th>
                        <th className="px-4 py-2.5 text-center">Super Admin</th>
                        <th className="px-4 py-2.5 text-center">Delegated Admin</th>
                        <th className="px-4 py-2.5 text-center">Faculty</th>
                        <th className="px-4 py-2.5 text-center">Accountant</th>
                        <th className="px-4 py-2.5 text-center">Student</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {mod.permissions.map((p) => (
                        <tr key={p.code} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{p.name}</p>
                            <p className="font-mono text-[10px] text-slate-400">{p.code}</p>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs">
                              ✓
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {p.code !== "users.manage_admins" ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {["students.view", "attendance.view", "attendance.mark", "exams.manage", "marks.enter", "marks.review"].includes(p.code) ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {["students.view", "fees.view", "fees.create_invoice", "fees.record_payment", "fees.refund", "reports.export"].includes(p.code) ? (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {["attendance.view", "fees.view"].includes(p.code) ? (
                              <span className="text-slate-500 font-medium text-[11px]">Own only</span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Authority & Governance */}
      {activeTab === "hierarchy" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Tier 1: Institution Super Admin
              </CardTitle>
              <p className="text-xs text-slate-500">Unrestricted institutional governance and master key</p>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Full Tenant Control:</strong> Can create, manage, suspend, or promote other Admin accounts within the institution.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Staff & Faculty Lifecycle:</strong> Add, update, deactivate, reset credentials, and assign custom granular permission bundles.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
                <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Hierarchy Immunity:</strong> Cannot be deactivated, demoted, or deleted by delegated Admins.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-500" />
                Tier 2: Delegated Admins (Sub-Admins)
              </CardTitle>
              <p className="text-xs text-slate-500">Operational administration bounded by assigned scopes</p>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <CheckCircle2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Staff & Resource Management:</strong> Can manage faculty, learners, and academic operations based strictly on granted permissions.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Boundaries Enforced:</strong> Cannot create other Super Admins or alter master RBAC configurations without delegation.
                </span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Cross-Tenant Leakage:</strong> All operations strictly bound to active organization tenant ID.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: Institution Profile */}
      {activeTab === "tenant" && (
        <Card>
          <CardHeader>
            <CardTitle>Institution Profile & Custom Branding</CardTitle>
            <p className="text-xs text-slate-500">Configure public institutional metadata and global theme accents</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveTenant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Institution Legal Name" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Motto / Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Select
                  label="Primary Currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  options={[
                    { value: "USD", label: "USD ($ - US Dollar)" },
                    { value: "EUR", label: "EUR (€ - Euro)" },
                    { value: "GBP", label: "GBP (£ - British Pound)" },
                    { value: "INR", label: "INR (₹ - Indian Rupee)" },
                  ]}
                />
                <Select
                  label="Institution Timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  options={[
                    { value: "America/New_York", label: "Eastern Time (US & Canada)" },
                    { value: "Europe/Berlin", label: "Central European Time" },
                    { value: "Asia/Kolkata", label: "India Standard Time" },
                    { value: "UTC", label: "Coordinated Universal Time (UTC)" },
                  ]}
                />
                <Input label="Brand Accent Color" type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>

              <div className="pt-3 flex justify-end">
                <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
                  Save Tenant Configuration
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: Adaptive Terminology */}
      {activeTab === "terminology" && (
        <Card>
          <CardHeader>
            <CardTitle>Tenant-Adaptive Vocabulary Dictionary</CardTitle>
            <p className="text-xs text-slate-500">
              The platform dynamically replaces generic school terminology with higher-ed or coaching terms.
            </p>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Concept Key</th>
                    <th className="px-4 py-3">Generic Term</th>
                    <th className="px-4 py-3">Current Tenant Vocabulary ({tenant.name})</th>
                    <th className="px-4 py-3">Higher Ed Equivalent</th>
                    <th className="px-4 py-3">Coaching Equivalent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  <tr>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">learner</td>
                    <td className="px-4 py-3">Student</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{t("learner")}</td>
                    <td className="px-4 py-3 text-slate-500">Student / Scholar</td>
                    <td className="px-4 py-3 text-slate-500">Aspirant / Candidate</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">educator</td>
                    <td className="px-4 py-3">Teacher</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{t("educator")}</td>
                    <td className="px-4 py-3 text-slate-500">Professor / Faculty</td>
                    <td className="px-4 py-3 text-slate-500">Mentor / Subject Master</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">class</td>
                    <td className="px-4 py-3">Class / Grade</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{t("class")}</td>
                    <td className="px-4 py-3 text-slate-500">Course / Section</td>
                    <td className="px-4 py-3 text-slate-500">Batch / Prep Group</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-mono font-semibold text-indigo-600">term</td>
                    <td className="px-4 py-3">Term / Quarter</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{t("term")}</td>
                    <td className="px-4 py-3 text-slate-500">Semester / Trimester</td>
                    <td className="px-4 py-3 text-slate-500">Phase / Module Run</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 6: Subscription */}
      {activeTab === "subscription" && (
        <Card>
          <CardHeader>
            <CardTitle>Institutional License & Quota Utilization</CardTitle>
            <p className="text-xs text-slate-500">Current plan specifications and learner tier allowances</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold uppercase">Active Tier</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{tenant.subscriptionPlan}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Status: {tenant.subscriptionStatus.toUpperCase()}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold uppercase">Learner Headcount</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {tenant.currentLearners.toLocaleString()} / {tenant.maxLearners.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {Math.round((tenant.currentLearners / tenant.maxLearners) * 100)}% capacity allocated
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold uppercase">Renewal Date</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{tenant.subscriptionExpiry}</p>
                <p className="text-[11px] text-indigo-500 mt-0.5">Enterprise auto-renewal enabled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 7: Security Audit Trail */}
      {activeTab === "audit" && (
        <div className="pt-2">
          <AuditLogsPage />
        </div>
      )}

      {/* MODAL: Add User / Admin */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Register Institutional User / Admin"
        description="Create an account and configure exact RBAC permissions"
        size="lg"
      >
        <form onSubmit={handleAddUserSubmit} className="space-y-4">
          {addError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Account Role & Tier</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Assigned Role *"
                value={addForm.roleCode}
                onChange={(e) => setAddForm({ ...addForm, roleCode: e.target.value })}
                options={[
                  ...(isInstitutionSuperAdmin || user?.is_superuser
                    ? [{ value: "institution_super_admin", label: "👑 Institution Super Admin (Full Control)" }]
                    : []),
                  { value: "institution_admin", label: "🛡️ Institution Admin (Delegated)" },
                  { value: "faculty", label: "🎓 Faculty / Instructor" },
                  { value: "accountant", label: "💼 Accountant / Bursar" },
                  { value: "student", label: "📚 Student / Learner" },
                  { value: "guardian", label: "👨‍👩‍👧 Parent / Guardian" },
                ]}
              />
              <Input
                label="Designation / Title"
                value={addForm.designation}
                onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                placeholder="e.g. Associate Dean"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name *" required value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} />
            <Input label="Last Name *" required value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Email Address *" type="email" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
            <Input label="Temporary Password" type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
          </div>

          <Input label="Phone Number" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} placeholder="+1 (555) 000-0000" />

          {/* Granular Permissions Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Granular Permissions Assigned
              </h4>
              <span className="text-[11px] text-slate-400">
                {addForm.roleCode === "institution_super_admin" ? "All Wildcard (*)" : `${addForm.permissions.length} selected`}
              </span>
            </div>

            {addForm.roleCode === "institution_super_admin" ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
                ⚡ Institution Super Admins automatically hold wildcard access (*) across all institutional capabilities.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
                {ALL_PERMISSION_MODULES.map((mod) => (
                  <div key={mod.module} className="space-y-1.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{mod.module}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                      {mod.permissions.map((p) => {
                        const isChecked = addForm.permissions.includes(p.code)
                        return (
                          <label key={p.code} className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAddForm({ ...addForm, permissions: [...addForm.permissions, p.code] })
                                } else {
                                  setAddForm({ ...addForm, permissions: addForm.permissions.filter((x) => x !== p.code) })
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="truncate">{p.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" disabled={addLoading} onClick={() => setIsAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addLoading} leftIcon={addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {addLoading ? "Creating Account..." : "Create User Account"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit User & Role */}
      {isEditUserModalOpen && selectedUser && (
        <Modal
          isOpen={isEditUserModalOpen}
          onClose={() => setIsEditUserModalOpen(false)}
          title={`Edit User Account: ${selectedUser.full_name}`}
          description="Update role delegation, designation, and custom capability codes"
          size="lg"
        >
          <form onSubmit={handleEditUserSubmit} className="space-y-4">
            {editError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name *" required value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
              <Input label="Last Name *" required value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Role Assignment"
                value={editForm.roleCode}
                onChange={(e) => setEditForm({ ...editForm, roleCode: e.target.value })}
                options={[
                  ...(isInstitutionSuperAdmin || user?.is_superuser
                    ? [{ value: "institution_super_admin", label: "👑 Institution Super Admin" }]
                    : []),
                  { value: "institution_admin", label: "🛡️ Institution Admin (Delegated)" },
                  { value: "faculty", label: "🎓 Faculty / Instructor" },
                  { value: "accountant", label: "💼 Accountant / Bursar" },
                  { value: "student", label: "📚 Student / Learner" },
                  { value: "guardian", label: "👨‍👩‍👧 Parent / Guardian" },
                ]}
              />
              <Input label="Designation" value={editForm.designation} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} />
            </div>

            <Input label="Contact Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Configured Permissions
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs">
                {ALL_PERMISSION_MODULES.map((mod) => (
                  <div key={mod.module} className="space-y-1.5">
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{mod.module}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                      {mod.permissions.map((p) => {
                        const isChecked = editForm.permissions.includes(p.code)
                        return (
                          <label key={p.code} className="flex items-center gap-2 cursor-pointer hover:text-indigo-600">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditForm({ ...editForm, permissions: [...editForm.permissions, p.code] })
                                } else {
                                  setEditForm({ ...editForm, permissions: editForm.permissions.filter((x) => x !== p.code) })
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                            />
                            <span className="truncate">{p.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" disabled={editLoading} onClick={() => setIsEditUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading} leftIcon={editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {editLoading ? "Saving Changes..." : "Save User Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: Reset Password */}
      {isResetPasswordModalOpen && selectedUser && (
        <Modal
          isOpen={isResetPasswordModalOpen}
          onClose={() => setIsResetPasswordModalOpen(false)}
          title={`Reset Password for ${selectedUser.full_name || selectedUser.email}`}
          description="Assign a new temporary password for this user account"
          size="sm"
        >
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            {resetError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}
            {resetSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <Input
              label="New Password *"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 8 characters"
            />

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" disabled={resetLoading} onClick={() => setIsResetPasswordModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={resetLoading} leftIcon={resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {resetLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: View User Dossier */}
      {isViewDossierModalOpen && selectedUser && (
        <Modal
          isOpen={isViewDossierModalOpen}
          onClose={() => setIsViewDossierModalOpen(false)}
          title="User Governance Dossier"
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <img
                src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.full_name)}&background=4f46e5&color=fff`}
                alt={selectedUser.full_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {selectedUser.full_name}
                  {selectedUser.is_institution_superadmin && <Crown className="w-4 h-4 text-amber-500" />}
                </h3>
                <p className="text-slate-400">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={selectedUser.status === "active" ? "success" : "danger"} size="sm">
                    {selectedUser.status}
                  </Badge>
                  <span className="text-[11px] text-slate-500">Joined {selectedUser.joined_at?.split("T")[0]}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Active Roles & Scope
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedUser.roles?.map((r) => (
                  <Badge key={r.id} variant="primary" size="sm">
                    {r.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Permissions Manifest
              </h4>
              {selectedUser.is_institution_superadmin ? (
                <p className="text-amber-600 dark:text-amber-400 font-semibold">Wildcard Master Key (*)</p>
              ) : (
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {selectedUser.permissions?.map((p) => (
                    <span key={p} className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setIsViewDossierModalOpen(false)}>
                Close Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
