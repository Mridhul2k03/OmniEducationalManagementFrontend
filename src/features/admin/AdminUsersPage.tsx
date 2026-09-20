import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { api } from "../../services/api"
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  ShieldCheck, 
  ShieldAlert, 
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
  ChevronRight
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { StatsCard } from "../../components/ui/StatsCard"

export const AdminUsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [users, setUsers] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all")

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false)
  const [isAssignTenantModalOpen, setIsAssignTenantModalOpen] = useState<boolean>(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
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
    is_staff: false,
    is_superuser: false,
    tenant_id: "",
    role_code: "institution_super_admin",
  })

  const [editUserForm, setEditUserForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    is_active: true,
    is_staff: false,
    is_superuser: false,
  })

  const [newPassword, setNewPassword] = useState<string>("")
  const [assignTenantForm, setAssignTenantForm] = useState({
    tenant_id: "",
    role_code: "institution_super_admin",
    is_default: true,
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [usersData, tenantsData] = await Promise.all([
        api.platformAdmin.getUsers(),
        api.platformAdmin.getTenants(),
      ])
      setUsers(usersData)
      setTenants(tenantsData)
    } catch (err: any) {
      console.error("Failed to load users:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    if (searchParams.get("new") === "true") {
      setIsCreateModalOpen(true)
    }
  }, [searchParams])

  // Filter logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.first_name && u.first_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.last_name && u.last_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone_number && u.phone_number.includes(searchQuery))

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.is_active) ||
      (statusFilter === "inactive" && !u.is_active)

    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "superuser" && u.is_superuser) ||
      (roleFilter === "staff" && u.is_staff && !u.is_superuser) ||
      (roleFilter === "client" && !u.is_staff && !u.is_superuser)

    const matchesTenant =
      selectedTenantFilter === "all" ||
      u.memberships?.some((m: any) => m.tenant_id === selectedTenantFilter)

    return matchesSearch && matchesStatus && matchesRole && matchesTenant
  })

  // Handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setActionError(null)
    try {
      await api.platformAdmin.createUser({
        email: createUserForm.email,
        password: createUserForm.password,
        first_name: createUserForm.first_name,
        last_name: createUserForm.last_name,
        phone_number: createUserForm.phone_number,
        is_staff: createUserForm.is_staff,
        is_superuser: createUserForm.is_superuser,
        tenant_id: createUserForm.tenant_id || undefined,
        role_code: createUserForm.role_code || undefined,
      })
      setActionSuccess("User created successfully!")
      setTimeout(() => {
        setIsCreateModalOpen(false)
        setActionSuccess(null)
        setCreateUserForm({
          email: "",
          password: "",
          first_name: "",
          last_name: "",
          phone_number: "",
          is_staff: false,
          is_superuser: false,
          tenant_id: "",
          role_code: "institution_super_admin",
        })
      }, 1000)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || "Failed to create user.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user)
    setEditUserForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      is_active: user.is_active,
      is_staff: user.is_staff,
      is_superuser: user.is_superuser,
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
      await api.platformAdmin.updateUser(selectedUser.id, editUserForm)
      setActionSuccess("User profile updated successfully!")
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

  const handleToggleStatus = async (user: any) => {
    try {
      await api.platformAdmin.toggleUserStatus(user.id)
      await loadData()
    } catch (err: any) {
      alert(err.message || "Failed to toggle status.")
    }
  }

  const handleOpenPasswordReset = (user: any) => {
    setSelectedUser(user)
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
      await api.platformAdmin.resetUserPassword(selectedUser.id, newPassword)
      setActionSuccess(`Password successfully reset for ${selectedUser.email}!`)
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

  const handleOpenAssignTenant = (user: any) => {
    setSelectedUser(user)
    setAssignTenantForm({
      tenant_id: tenants[0]?.id || "",
      role_code: "institution_super_admin",
      is_default: true,
    })
    setIsAssignTenantModalOpen(true)
    setActionError(null)
    setActionSuccess(null)
  }

  const handleAssignTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.platformAdmin.assignUserTenant(selectedUser.id, assignTenantForm)
      setActionSuccess(`Successfully assigned tenant membership!`)
      setTimeout(() => {
        setIsAssignTenantModalOpen(false)
        setActionSuccess(null)
      }, 1000)
      await loadData()
    } catch (err: any) {
      setActionError(err.message || "Failed to assign tenant.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async (user: any) => {
    if (window.confirm(`Are you sure you want to permanently delete user "${user.email}"? This action cannot be undone.`)) {
      try {
        await api.platformAdmin.deleteUser(user.id)
        await loadData()
      } catch (err: any) {
        alert(err.message || "Failed to delete user.")
      }
    }
  }

  // Metric counts
  const totalUsersCount = users.length
  const activeUsersCount = users.filter((u) => u.is_active).length
  const superadminsCount = users.filter((u) => u.is_superuser).length
  const staffCount = users.filter((u) => u.is_staff).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 mb-1.5">
            <Users className="w-3.5 h-3.5" /> Identity & Access Management
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            User Control Center
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage global authentication accounts, superuser privileges, password resets, and multi-tenant memberships.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={isLoading}
            className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setActionError(null)
              setActionSuccess(null)
              setIsCreateModalOpen(true)
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs"
          >
            Create User
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalUsersCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across all client tenants</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Users</span>
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{activeUsersCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">{totalUsersCount - activeUsersCount} suspended</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>SuperAdmins</span>
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{superadminsCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Full root privileges</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Staff & Support</span>
            <ShieldAlert className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-2">{staffCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Internal operators</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Suspended Only</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Role: All</option>
            <option value="superuser">SuperAdmins</option>
            <option value="staff">Staff Members</option>
            <option value="client">Client Users</option>
          </select>

          {/* Tenant Filter */}
          <select
            value={selectedTenantFilter}
            onChange={(e) => setSelectedTenantFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tenant: All</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Privileges</th>
                <th className="py-3.5 px-4">Assigned Tenant(s)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <span>Loading platform users...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No users match your criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-1">Try adjusting search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const initial = (u.first_name?.[0] || u.email?.[0] || "U").toUpperCase()
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                      {/* User details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            {initial}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              {u.full_name || "Unnamed User"}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400" /> {u.email}
                            </div>
                            {u.phone_number && (
                              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" /> {u.phone_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Privileges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {u.is_superuser && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                              <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" /> SUPERADMIN
                            </span>
                          )}
                          {u.is_staff && !u.is_superuser && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-500/30">
                              STAFF
                            </span>
                          )}
                          {!u.is_staff && !u.is_superuser && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                              Standard User
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Memberships */}
                      <td className="py-3.5 px-4">
                        {u.memberships && u.memberships.length > 0 ? (
                          <div className="space-y-1">
                            {u.memberships.map((m: any) => (
                              <div
                                key={m.id}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 mr-1"
                              >
                                <Building2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                <span>{m.tenant_name}</span>
                                {m.roles && m.roles.length > 0 && (
                                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                    ({m.roles.map((r: any) => r.name || r.code).join(", ")})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No tenant assigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30">
                            <XCircle className="w-3 h-3" /> SUSPENDED
                          </span>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active Switch */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              u.is_active
                                ? "bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800"
                                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                            }`}
                            title={u.is_active ? "Suspend User" : "Activate User"}
                          >
                            {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenPasswordReset(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
                            title="Reset User Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Assign Tenant */}
                          <button
                            onClick={() => handleOpenAssignTenant(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-800 transition-colors"
                            title="Assign to Institution Tenant"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-indigo-300 transition-colors"
                            title="Edit User Info"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                            title="Permanently Delete"
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

      {/* Modal: Create User */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Create Platform User</span>
          </div>
        }
        description="Provision a new user account with root or tenant-level administrative roles."
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                required
                value={createUserForm.first_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, first_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. John"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                required
                value={createUserForm.last_name}
                onChange={(e) => setCreateUserForm({ ...createUserForm, last_name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email Address (Login ID)</label>
              <input
                type="email"
                required
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({ ...createUserForm, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="user@institution.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm({ ...createUserForm, password: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="Minimum 8 characters"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number (Optional)</label>
            <input
              type="tel"
              value={createUserForm.phone_number}
              onChange={(e) => setCreateUserForm({ ...createUserForm, phone_number: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="+1 (555) 019-2834"
            />
          </div>

          {/* Tenant & Role Link */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Institution Membership (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Assign to Tenant</label>
                <select
                  value={createUserForm.tenant_id}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, tenant_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- No Initial Tenant --</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Assigned Role</label>
                <select
                  value={createUserForm.role_code}
                  onChange={(e) => setCreateUserForm({ ...createUserForm, role_code: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="institution_super_admin">Institution Super Admin (Tenant Owner)</option>
                  <option value="institute_admin">Institution Administrator</option>
                  <option value="faculty">Faculty / Instructor</option>
                  <option value="accountant">Accountant / Bursar</option>
                  <option value="registrar">Registrar</option>
                  <option value="staff">Staff Member</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
          </div>

          {/* Global Privileges Switches */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={createUserForm.is_superuser}
                onChange={(e) => setCreateUserForm({ ...createUserForm, is_superuser: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Grant SuperUser (Root) Access</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Allows global control over all platform tenants, data, and users.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={createUserForm.is_staff}
                onChange={(e) => setCreateUserForm({ ...createUserForm, is_staff: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Grant Staff Status</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Designates internal operator or support staff member.</p>
              </div>
            </label>
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
              {actionLoading ? "Creating..." : "Create Platform User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Edit User: {selectedUser?.email}</span>
          </div>
        }
        description="Update contact profile details and administrative privilege flags."
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={editUserForm.phone_number}
              onChange={(e) => setEditUserForm({ ...editUserForm, phone_number: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={editUserForm.is_active}
                onChange={(e) => setEditUserForm({ ...editUserForm, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Active Account</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Uncheck to prevent this user from signing in.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={editUserForm.is_superuser}
                onChange={(e) => setEditUserForm({ ...editUserForm, is_superuser: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">SuperAdmin Role</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Grants full root access across the SaaS platform.</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={editUserForm.is_staff}
                onChange={(e) => setEditUserForm({ ...editUserForm, is_staff: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
              />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Staff Member</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Designates internal operations or support personnel.</p>
              </div>
            </label>
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
              {actionLoading ? "Saving Changes..." : "Update User"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Reset Password */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Reset Password: {selectedUser?.email}</span>
          </div>
        }
        description="Directly assign a new secure password for this user without requiring email reset links."
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
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
              {actionLoading ? "Resetting..." : "Apply New Password"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Assign Tenant */}
      <Modal
        isOpen={isAssignTenantModalOpen}
        onClose={() => setIsAssignTenantModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Assign Tenant: {selectedUser?.email}</span>
          </div>
        }
        description="Link this user to an institution workspace and grant a contextual role."
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
      >
        <form onSubmit={handleAssignTenant} className="space-y-4 pt-2">
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
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Institution</label>
            <select
              value={assignTenantForm.tenant_id}
              onChange={(e) => setAssignTenantForm({ ...assignTenantForm, tenant_id: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role in Institution</label>
            <select
              value={assignTenantForm.role_code}
              onChange={(e) => setAssignTenantForm({ ...assignTenantForm, role_code: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="institution_super_admin">Institution Super Admin (Tenant Owner)</option>
              <option value="institute_admin">Institution Administrator</option>
              <option value="faculty">Faculty / Instructor</option>
              <option value="accountant">Accountant / Bursar</option>
              <option value="registrar">Registrar</option>
              <option value="staff">Staff Member</option>
              <option value="student">Student</option>
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={assignTenantForm.is_default}
              onChange={(e) => setAssignTenantForm({ ...assignTenantForm, is_default: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
            />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Set as Default Workspace</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">User will automatically open this workspace on login.</p>
            </div>
          </label>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignTenantModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
              {actionLoading ? "Assigning..." : "Assign Membership"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
