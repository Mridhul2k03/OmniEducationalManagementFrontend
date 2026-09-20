import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { api } from "../../services/api"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { 
  Users, 
  Search, 
  Plus, 
  ShieldCheck, 
  Shield, 
  KeyRound, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  Mail, 
  Phone, 
  Lock, 
  UserCheck, 
  UserX, 
  Sparkles, 
  Crown, 
  Eye, 
  GraduationCap, 
  Wallet, 
  FileText, 
  Briefcase, 
  BookOpen, 
  ShieldAlert, 
  Filter,
  Check,
  UserPlus
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Modal } from "../../components/ui/Modal"
import { StatsCard } from "../../components/ui/StatsCard"
import { InstitutionUser, RoleDefinition } from "../../types"

// Available System Permissions grouped by category
const PERMISSION_GROUPS: Record<string, { label: string; permissions: { code: string; label: string; desc: string }[] }> = {
  users: {
    label: "User & Staff Administration",
    permissions: [
      { code: "users.create_admin", label: "Create Delegated Admins", desc: "Provision new administrative accounts for the tenant" },
      { code: "users.manage_staff", label: "Manage Staff Directory", desc: "Create, edit, and deactivate educator and staff profiles" },
      { code: "users.manage_roles", label: "Role & Permission Matrix", desc: "Configure role definitions and custom permission assignments" },
    ],
  },
  academics: {
    label: "Academic Operations & Timetable",
    permissions: [
      { code: "academics.view", label: "View Curriculum", desc: "Access courses, subjects, cohorts, and degree tracks" },
      { code: "academics.edit", label: "Manage Programs & Classes", desc: "Create and update academic curriculum, cohorts, and terms" },
      { code: "timetable.manage", label: "Manage Master Timetable", desc: "Schedule periods, assign class slots, and allocate classrooms" },
    ],
  },
  students: {
    label: "Learner & Enrollment Services",
    permissions: [
      { code: "students.view", label: "View Learner Directory", desc: "Search and inspect enrolled student profiles" },
      { code: "students.create", label: "Admit New Learners", desc: "Enroll new students and assign initial cohorts" },
      { code: "students.update", label: "Update Student Profiles", desc: "Edit student contact, guardian, and academic status" },
      { code: "students.delete", label: "Archive / Expel Students", desc: "Soft-delete student profiles from active institution roster" },
    ],
  },
  attendance: {
    label: "Attendance & Daily Operations",
    permissions: [
      { code: "attendance.mark", label: "Mark Attendance Ledgers", desc: "Take daily and session attendance for cohorts" },
      { code: "attendance.edit", label: "Correct Past Attendance", desc: "Modify historical attendance records and excuse absences" },
    ],
  },
  exams: {
    label: "Examinations & Grading",
    permissions: [
      { code: "exams.manage", label: "Create Exam Schedules", desc: "Configure examination schedules, venues, and timings" },
      { code: "marks.enter", label: "Enter & Edit Marks", desc: "Submit candidate scores for exams and assignments" },
      { code: "exams.publish", label: "Publish & Lock Results", desc: "Certify report cards and release results to student portals" },
    ],
  },
  finance: {
    label: "Financial Management & Invoices",
    permissions: [
      { code: "fees.view", label: "View Financial Records", desc: "Inspect fee structure, billing history, and invoices" },
      { code: "fees.create_invoice", label: "Issue Student Invoices", desc: "Generate tuition and incidental fee invoices" },
      { code: "fees.record_payment", label: "Record Payment Receipts", desc: "Collect payments, register receipts, and clear balances" },
    ],
  },
  settings: {
    label: "Institution Settings & Governance",
    permissions: [
      { code: "tenant.manage_settings", label: "Tenant Profile & Branding", desc: "Update institution name, logo, colors, and contacts" },
      { code: "audit.view_logs", label: "Audit & Security Logs", desc: "Inspect real-time administrative logs and security events" },
    ],
  },
}

export const InstitutionUsersPage: React.FC = () => {
  const { tenant } = useTenant()
  const { user, isInstitutionSuperAdmin, isSuperAdmin, can } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Authorization check: Institution Super Admin or users with user management permissions
  const isAuthorized = isInstitutionSuperAdmin || isSuperAdmin || can("institute_admin") || can("users.manage_staff") || can("users.create_admin") || can("users.manage_roles")

  // State
  const [users, setUsers] = useState<InstitutionUser[]>([])
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false)
  const [isDossierModalOpen, setIsDossierModalOpen] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<InstitutionUser | null>(null)
  
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Form states
  const [createUserForm, setCreateUserForm] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    role_code: "institution_admin",
    designation: "",
    permissions: [] as string[],
  })

  const [editUserForm, setEditUserForm] = useState<{
    first_name: string
    last_name: string
    phone_number: string
    status: "active" | "suspended" | "invited" | "inactive"
    role_code: string
    designation: string
    permissions: string[]
  }>({
    first_name: "",
    last_name: "",
    phone_number: "",
    status: "active",
    role_code: "faculty",
    designation: "",
    permissions: [],
  })

  const [newPassword, setNewPassword] = useState<string>("")

  // Load institutional users and roles
  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersData, rolesData] = await Promise.all([
        api.institutionUsers.list(),
        api.roles.list().catch(() => []),
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (err: any) {
      console.error("Failed to load institution users:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
    if (searchParams.get("new") === "true") {
      setIsCreateModalOpen(true)
    }
  }, [isAuthorized, searchParams])

  // Helpers for reading role info
  const getUserRoleCode = (u: InstitutionUser) => {
    return u.primary_role?.code || (u.roles && u.roles[0]?.code) || "faculty"
  }

  // Filtered institutional user list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const email = u.email || ""
      const firstName = u.first_name || ""
      const lastName = u.last_name || ""
      const phone = u.phone_number || ""
      const role = getUserRoleCode(u)

      const matchesSearch =
        !searchQuery ||
        email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.includes(searchQuery) ||
        role.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && (u.status === "active" || u.is_active)) ||
        (statusFilter === "suspended" && (u.status === "suspended" || u.status === "inactive" || !u.is_active))

      const matchesRole =
        roleFilter === "all" ||
        (roleFilter === "super_admin" && (role === "institution_super_admin" || role === "super_admin" || u.is_institution_superadmin)) ||
        (roleFilter === "admin" && (role === "institution_admin" || role === "institute_admin")) ||
        (roleFilter === "faculty" && role === "faculty") ||
        (roleFilter === "accountant" && role === "accountant") ||
        (roleFilter === "registrar" && role === "registrar") ||
        (roleFilter === "staff" && role === "staff") ||
        (roleFilter === "student" && role === "student") ||
        (roleFilter === "parent" && role === "parent")

      return matchesSearch && matchesStatus && matchesRole
    })
  }, [users, searchQuery, statusFilter, roleFilter])

  // Metric aggregates
  const totalCount = users.length
  const activeCount = users.filter((u) => u.status === "active" || u.is_active).length
  const superAdminsCount = users.filter((u) => u.is_institution_superadmin || getUserRoleCode(u) === "institution_super_admin" || getUserRoleCode(u) === "super_admin").length
  const delegatedAdminsCount = users.filter((u) => {
    const r = getUserRoleCode(u)
    return r === "institution_admin" || r === "institute_admin" || r === "registrar" || r === "accountant"
  }).length
  const educatorsCount = users.filter((u) => {
    const r = getUserRoleCode(u)
    return r === "faculty" || r === "staff"
  }).length
  const studentsCount = users.filter((u) => {
    const r = getUserRoleCode(u)
    return r === "student" || r === "parent"
  }).length

  // Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setActionError(null)
    try {
      await api.institutionUsers.create({
        email: createUserForm.email,
        password: createUserForm.password,
        first_name: createUserForm.first_name,
        last_name: createUserForm.last_name,
        phone_number: createUserForm.phone_number,
        role_code: createUserForm.role_code,
        designation: createUserForm.designation || undefined,
        permissions: createUserForm.permissions,
      })
      setActionSuccess(`User account created successfully!`)
      setTimeout(() => {
        setIsCreateModalOpen(false)
        setActionSuccess(null)
        setCreateUserForm({
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          phone_number: "",
          role_code: "faculty",
          designation: "",
          permissions: [],
        })
      }, 1000)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || "Failed to create user.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenEdit = (target: InstitutionUser) => {
    setSelectedUser(target)
    const targetRole = getUserRoleCode(target)
    setEditUserForm({
      first_name: target.first_name || "",
      last_name: target.last_name || "",
      phone_number: target.phone_number || "",
      status: target.status === "suspended" ? "suspended" : "active",
      role_code: targetRole,
      designation: target.staff_profile?.designation || "",
      permissions: target.permissions || [],
    })
    setIsEditModalOpen(true)
    setActionError(null)
    setActionSuccess(null)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setActionLoading(true)
    setActionError(null)
    try {
      const targetId = selectedUser.membership_id || selectedUser.id
      await api.institutionUsers.update(targetId, {
        first_name: editUserForm.first_name,
        last_name: editUserForm.last_name,
        phone_number: editUserForm.phone_number,
        status: editUserForm.status,
        role_code: editUserForm.role_code,
        designation: editUserForm.designation,
        permissions: editUserForm.permissions,
      })
      setActionSuccess("User profile and role updated successfully!")
      setTimeout(() => {
        setIsEditModalOpen(false)
        setActionSuccess(null)
      }, 1000)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || "Failed to update user.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (target: InstitutionUser) => {
    const isTargetSuper = target.is_institution_superadmin || getUserRoleCode(target) === "institution_super_admin" || getUserRoleCode(target) === "super_admin"
    if (isTargetSuper && !isInstitutionSuperAdmin && !isSuperAdmin) {
      alert("Hierarchy Violation: Only the Institution Super Admin can modify or deactivate another Super Admin.")
      return
    }

    const email = target.email || "this user"
    const isCurrentlyActive = target.status === "active" || target.is_active
    const confirmMsg = isCurrentlyActive
      ? `Are you sure you want to deactivate ${email}? They will immediately lose access to this institution.`
      : `Reactivate account for ${email}?`

    if (window.confirm(confirmMsg)) {
      try {
        const targetId = target.membership_id || target.id
        await api.institutionUsers.toggleStatus(targetId)
        await loadData()
      } catch (err: any) {
        alert(err.message || "Failed to toggle status.")
      }
    }
  }

  const handleOpenPasswordReset = (target: InstitutionUser) => {
    setSelectedUser(target)
    setNewPassword("")
    setIsPasswordModalOpen(true)
    setActionError(null)
    setActionSuccess(null)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setActionLoading(true)
    setActionError(null)
    try {
      const email = selectedUser.email
      const targetId = selectedUser.membership_id || selectedUser.id
      await api.institutionUsers.resetPassword(targetId, newPassword)
      setActionSuccess(`Password successfully reset for ${email}!`)
      setTimeout(() => {
        setIsPasswordModalOpen(false)
        setActionSuccess(null)
      }, 1200)
    } catch (err: any) {
      setActionError(err.message || "Failed to reset password.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenDossier = (target: InstitutionUser) => {
    setSelectedUser(target)
    setIsDossierModalOpen(true)
  }

  const handleDeleteUser = async (target: InstitutionUser) => {
    const isTargetSuper = target.is_institution_superadmin || getUserRoleCode(target) === "institution_super_admin" || getUserRoleCode(target) === "super_admin"
    if (isTargetSuper && !isInstitutionSuperAdmin && !isSuperAdmin) {
      alert("Hierarchy Violation: Delegated Admins cannot delete an Institution Super Admin.")
      return
    }

    const email = target.email || "this user"
    if (window.confirm(`Are you sure you want to permanently remove user "${email}" from this institution? This action will revoke all memberships and access rights.`)) {
      try {
        const targetId = target.membership_id || target.id
        await api.institutionUsers.delete(targetId)
        await loadData()
      } catch (err: any) {
        alert(err.message || "Failed to delete user.")
      }
    }
  }

  const togglePermission = (form: "create" | "edit", permCode: string) => {
    if (form === "create") {
      setCreateUserForm((prev) => {
        const has = prev.permissions.includes(permCode)
        return {
          ...prev,
          permissions: has ? prev.permissions.filter((p) => p !== permCode) : [...prev.permissions, permCode],
        }
      })
    } else {
      setEditUserForm((prev) => {
        const has = prev.permissions.includes(permCode)
        return {
          ...prev,
          permissions: has ? prev.permissions.filter((p) => p !== permCode) : [...prev.permissions, permCode],
        }
      })
    }
  }

  // Visual helper for Role Badges with Light and Dark contrast
  const renderRoleBadge = (target: InstitutionUser) => {
    const role = getUserRoleCode(target)
    const isSuper = target.is_institution_superadmin || role === "institution_super_admin" || role === "super_admin"

    if (isSuper) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30 shadow-xs">
          <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>Institution Super Admin</span>
        </span>
      )
    }

    if (role === "institution_admin" || role === "institute_admin") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30">
          <Shield className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Institution Admin</span>
        </span>
      )
    }

    if (role === "accountant") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
          <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Accountant / Bursar</span>
        </span>
      )
    }

    if (role === "registrar") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/15 dark:text-cyan-300 dark:border-cyan-500/30">
          <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span>Registrar</span>
        </span>
      )
    }

    if (role === "faculty") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30">
          <GraduationCap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
          <span>Faculty / Instructor</span>
        </span>
      )
    }

    if (role === "student") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30">
          <BookOpen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
          <span>Student / Learner</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 capitalize">
        <Briefcase className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
        <span>{role.replace("_", " ")}</span>
      </span>
    )
  }

  // Access check fallback
  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center text-rose-500 dark:text-rose-400">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          You do not have permission to view or manage institutional user accounts for <strong>{tenant.name}</strong>.
          Only the <strong>Institution Super Admin</strong> and authorized <strong>Delegated Administrators</strong> have access to this portal.
        </p>
        <Button onClick={() => navigate("/app/dashboard")} variant="outline">
          Return to Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 mb-1.5">
            <Building2 className="w-3.5 h-3.5" />
            <span>{tenant.name} ({tenant.code})</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Institution User Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete institutional control: Onboard staff, assign roles, configure granular permissions, and manage credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              setIsCreateModalOpen(true)
              setActionError(null)
              setActionSuccess(null)
            }}
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm shadow-indigo-600/20"
          >
            Create User / Staff
          </Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatsCard
          title="Total Users"
          value={totalCount.toString()}
          icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
        />
        <StatsCard
          title="Active Users"
          value={activeCount.toString()}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
        />
        <StatsCard
          title="Super Admins"
          value={superAdminsCount.toString()}
          icon={<Crown className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
        />
        <StatsCard
          title="Delegated Admins"
          value={delegatedAdminsCount.toString()}
          icon={<Shield className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
        />
        <StatsCard
          title="Staff & Faculty"
          value={educatorsCount.toString()}
          icon={<GraduationCap className="w-5 h-5 text-sky-600 dark:text-sky-400" />}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
        />
        <StatsCard
          title="Students & Parents"
          value={studentsCount.toString()}
          icon={<BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />}
          className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, or role..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Institution Super Admins</option>
              <option value="admin">Institution Admins</option>
              <option value="faculty">Faculty / Instructors</option>
              <option value="accountant">Accountants</option>
              <option value="registrar">Registrars</option>
              <option value="staff">Staff Members</option>
              <option value="student">Students</option>
              <option value="parent">Parents</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended / Deactivated</option>
            </select>

            {(searchQuery || roleFilter !== "all" || statusFilter !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setRoleFilter("all")
                  setStatusFilter("all")
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">User & Identity</th>
                <th className="py-3 px-4">Institution Role</th>
                <th className="py-3 px-4">Custom Permissions</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading institutional user directory...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No institutional accounts found</p>
                    <p className="text-[11px] mt-1 text-slate-400">Try adjusting your search criteria or add a new user account.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const email = u.email || "No Email"
                  const firstName = u.first_name || ""
                  const lastName = u.last_name || ""
                  const fullName = `${firstName} ${lastName}`.trim() || email.split("@")[0]
                  const phone = u.phone_number
                  const isActive = u.status === "active" || u.is_active
                  const roleCode = getUserRoleCode(u)
                  const isTargetSuper = u.is_institution_superadmin || roleCode === "institution_super_admin" || roleCode === "super_admin"
                  const permsCount = u.permissions ? u.permissions.length : 0

                  return (
                    <tr
                      key={u.id || u.membership_id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                              isTargetSuper
                                ? "bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40"
                                : "bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30"
                            }`}
                          >
                            {firstName ? firstName[0] : email[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100">{fullName}</span>
                              {isTargetSuper && (
                                <Crown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {email}
                              </span>
                              {phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {renderRoleBadge(u)}
                          {u.staff_profile?.designation && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{u.staff_profile.designation}</p>
                          )}
                        </div>
                      </td>

                      {/* Custom Permissions */}
                      <td className="py-3.5 px-4">
                        {isTargetSuper ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                            <Sparkles className="w-3 h-3 text-amber-500" /> Full Root Bypass
                          </span>
                        ) : permsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20">
                            {permsCount} Custom Overrides
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Inherited standard role</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
                            <XCircle className="w-3 h-3" /> SUSPENDED
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                        {u.joined_at
                          ? new Date(u.joined_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Active"}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Suspend */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isActive
                                ? "bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                            }`}
                            title={isActive ? "Deactivate / Suspend User" : "Activate User"}
                          >
                            {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenPasswordReset(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
                            title="Reset User Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* View Dossier */}
                          <button
                            onClick={() => handleOpenDossier(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-sky-800 transition-colors"
                            title="Inspect User Dossier & Permissions"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details & Permissions */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                            title="Edit User Profile & Permissions"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                            title="Remove User from Institution"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE INSTITUTION USER / ADMIN                                    */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Create New Institution Account</span>
          </div>
        }
        description="Onboard an administrator, educator, or staff member with designated roles and permissions."
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="staff.name@institution.edu"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={createUserForm.first_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Jane"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={createUserForm.last_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={createUserForm.phone_number}
                onChange={(e) => setCreateUserForm({ ...createUserForm, phone_number: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="+1 (555) 234-5678"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Institutional Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={createUserForm.role_code}
                onChange={(e) => setCreateUserForm({ ...createUserForm, role_code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {(isInstitutionSuperAdmin || isSuperAdmin) && (
                  <option value="institution_super_admin">Institution Super Admin (Tenant Owner)</option>
                )}
                <option value="institution_admin">Institution Administrator</option>
                <option value="faculty">Faculty / Instructor</option>
                <option value="accountant">Accountant / Bursar</option>
                <option value="registrar">Registrar</option>
                <option value="staff">Staff Member</option>
                <option value="student">Student / Learner</option>
                <option value="parent">Parent</option>
              </select>
            </div>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Title / Designation (Optional)</label>
            <input
              type="text"
              value={createUserForm.designation}
              onChange={(e) => setCreateUserForm({ ...createUserForm, designation: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Head of Mathematics, Assistant Registrar, Senior Accountant..."
            />
          </div>

          {/* Granular Permission Checklist */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
              Granular Permission Overrides (Optional)
            </span>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {Object.entries(PERMISSION_GROUPS).map(([catKey, cat]) => (
                <div key={catKey} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {cat.label}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.permissions.map((perm) => {
                      const isChecked = createUserForm.permissions.includes(perm.code)
                      return (
                        <label
                          key={perm.code}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-slate-200"
                              : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission("create", perm.code)}
                            className="mt-0.5 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{perm.label}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{perm.desc}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
              {actionLoading ? "Creating User..." : "Create Account"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDIT INSTITUTION USER                                              */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Edit Account: {selectedUser?.email}</span>
          </div>
        }
        description="Modify personal details, role assignment, and granular permission overrides."
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={editUserForm.first_name}
                onChange={(e) => setEditUserForm({ ...editUserForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={editUserForm.last_name}
                onChange={(e) => setEditUserForm({ ...editUserForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={editUserForm.phone_number}
                onChange={(e) => setEditUserForm({ ...editUserForm, phone_number: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Institutional Role</label>
              <select
                value={editUserForm.role_code}
                onChange={(e) => setEditUserForm({ ...editUserForm, role_code: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {(isInstitutionSuperAdmin || isSuperAdmin) && (
                  <option value="institution_super_admin">Institution Super Admin (Tenant Owner)</option>
                )}
                <option value="institution_admin">Institution Administrator</option>
                <option value="faculty">Faculty / Instructor</option>
                <option value="accountant">Accountant / Bursar</option>
                <option value="registrar">Registrar</option>
                <option value="staff">Staff Member</option>
                <option value="student">Student / Learner</option>
                <option value="parent">Parent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
              <select
                value={editUserForm.status}
                onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="active">Active (Full Access)</option>
                <option value="suspended">Suspended / Deactivated</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Professional Title / Designation</label>
              <input
                type="text"
                value={editUserForm.designation}
                onChange={(e) => setEditUserForm({ ...editUserForm, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Granular Permission Checklist */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-2">
              Granular Permission Overrides
            </span>
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {Object.entries(PERMISSION_GROUPS).map(([catKey, cat]) => (
                <div key={catKey} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                    {cat.label}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.permissions.map((perm) => {
                      const isChecked = editUserForm.permissions.includes(perm.code)
                      return (
                        <label
                          key={perm.code}
                          className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-500/50 text-indigo-900 dark:text-slate-200"
                              : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission("edit", perm.code)}
                            className="mt-0.5 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{perm.label}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">{perm.desc}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
              {actionLoading ? "Saving Changes..." : "Update Account"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: RESET PASSWORD                                                     */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Reset Password: {selectedUser?.email}</span>
          </div>
        }
        description="Directly assign a new credentials password for this user without email verification links."
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
      >
        <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Secure Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              placeholder="Minimum 8 characters"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPasswordModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={actionLoading || newPassword.length < 8}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {actionLoading ? "Applying..." : "Set New Password"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: USER DOSSIER & PERMISSION AUDIT                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Eye className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            <span>User Dossier: {selectedUser?.email}</span>
          </div>
        }
        description="Complete security identity, assigned institutional privileges, and resolved capabilities."
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {selectedUser && (
          <div className="space-y-4 pt-2">
            {/* Identity Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/40 flex items-center justify-center text-lg font-bold">
                  {(selectedUser.first_name || selectedUser.email || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedUser.first_name || ""} {selectedUser.last_name || ""}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUser.email}</p>
                  {selectedUser.phone_number && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{selectedUser.phone_number}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {renderRoleBadge(selectedUser)}
              </div>
            </div>

            {/* Resolved Permissions Matrix */}
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2">
                Resolved Institutional Permissions
              </span>
              {selectedUser.is_institution_superadmin || getUserRoleCode(selectedUser) === "institution_super_admin" || getUserRoleCode(selectedUser) === "super_admin" ? (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-amber-800 dark:text-amber-300">
                    <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Full Institutional Super Admin Privileges
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400/80">
                    This account possesses unrestricted root authority over all academic, financial, personnel, and governance modules for <strong>{tenant.name}</strong>.
                  </p>
                </div>
              ) : selectedUser.permissions && selectedUser.permissions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {selectedUser.permissions.map((pCode) => (
                    <div
                      key={pCode}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs"
                    >
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-slate-700 dark:text-slate-200 font-mono text-[11px]">{pCode}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                  <p>Standard role capabilities apply without custom granular overrides.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDossierModalOpen(false)}
              >
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
