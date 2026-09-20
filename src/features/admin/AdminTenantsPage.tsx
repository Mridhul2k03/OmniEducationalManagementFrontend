import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { api } from "../../services/api"
import { useTenant } from "../../app/providers/TenantProvider"
import { 
  Building2, 
  Search, 
  Plus, 
  Users, 
  GraduationCap, 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  Globe, 
  MapPin, 
  Mail, 
  Phone,
  LayoutGrid,
  List,
  Shield,
  ArrowRight
} from "lucide-react"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"

export const AdminTenantsPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setTenantId, refreshTenants } = useTenant()

  const [tenants, setTenants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modals state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState<boolean>(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null)
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  // Forms
  const [onboardForm, setOnboardForm] = useState({
    name: "",
    legal_name: "",
    slug: "",
    institution_type: "school",
    currency: "USD",
    timezone: "UTC",
    contact_email: "",
    contact_phone: "",
    subscription_plan: "Enterprise",
    admin_email: "",
    admin_password: "",
    admin_first_name: "",
    admin_last_name: "",
  })

  const [editForm, setEditForm] = useState({
    name: "",
    legal_name: "",
    institution_type: "school",
    currency: "USD",
    timezone: "UTC",
    contact_email: "",
    contact_phone: "",
    subscription_reference: "Enterprise",
    status: "active",
  })

  const loadTenants = async () => {
    setIsLoading(true)
    try {
      const data = await api.platformAdmin.getTenants()
      setTenants(data)
    } catch (err: any) {
      console.error("Failed to load tenants:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTenants()
    if (searchParams.get("new") === "true") {
      setIsOnboardModalOpen(true)
    }
  }, [searchParams])

  // Filtered tenants
  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.legal_name && t.legal_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.contact_email && t.contact_email.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = typeFilter === "all" || t.institution_type === typeFilter
    const matchesStatus = statusFilter === "all" || t.status === statusFilter

    return matchesSearch && matchesType && matchesStatus
  })

  // Handlers
  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    setActionError(null)
    try {
      const payload: any = {
        name: onboardForm.name.trim(),
        legal_name: onboardForm.legal_name?.trim() || onboardForm.name.trim(),
        institution_type: onboardForm.institution_type,
        currency: onboardForm.currency,
        timezone: onboardForm.timezone,
        contact_email: onboardForm.contact_email?.trim() || undefined,
        contact_phone: onboardForm.contact_phone?.trim() || undefined,
        subscription_plan: onboardForm.subscription_plan,
      }
      if (onboardForm.slug && onboardForm.slug.trim()) {
        payload.slug = onboardForm.slug.trim()
      }
      if (onboardForm.admin_email && onboardForm.admin_email.trim()) {
        payload.admin_email = onboardForm.admin_email.trim()
        payload.admin_password = onboardForm.admin_password
        payload.admin_first_name = onboardForm.admin_first_name || "Admin"
        payload.admin_last_name = onboardForm.admin_last_name || "User"
      }

      await api.platformAdmin.createTenant(payload)
      setActionSuccess("Institution onboarded and provisioned successfully!")
      await refreshTenants()
      setTimeout(() => {
        setIsOnboardModalOpen(false)
        setActionSuccess(null)
        setOnboardForm({
          name: "",
          legal_name: "",
          slug: "",
          institution_type: "school",
          currency: "USD",
          timezone: "UTC",
          contact_email: "",
          contact_phone: "",
          subscription_plan: "Enterprise",
          admin_email: "",
          admin_password: "",
          admin_first_name: "",
          admin_last_name: "",
        })
      }, 1000)
      await loadTenants()
    } catch (err: any) {
      setActionError(err.message || "Failed to onboard institution.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenEdit = (tenant: any) => {
    setSelectedTenant(tenant)
    setEditForm({
      name: tenant.name,
      legal_name: tenant.legal_name || "",
      institution_type: tenant.institution_type || "school",
      currency: tenant.currency || "USD",
      timezone: tenant.timezone || "UTC",
      contact_email: tenant.contact_email || "",
      contact_phone: tenant.contact_phone || "",
      subscription_reference: tenant.subscription_reference || "Enterprise",
      status: tenant.status || "active",
    })
    setIsEditModalOpen(true)
    setActionError(null)
    setActionSuccess(null)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTenant) return
    setActionLoading(true)
    setActionError(null)
    try {
      await api.platformAdmin.updateTenant(selectedTenant.id, editForm)
      setActionSuccess("Institution configuration updated!")
      await refreshTenants()
      setTimeout(() => {
        setIsEditModalOpen(false)
        setActionSuccess(null)
      }, 1000)
      await loadTenants()
    } catch (err: any) {
      setActionError(err.message || "Failed to update institution.")
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStatus = async (tenant: any) => {
    try {
      await api.platformAdmin.toggleTenantStatus(tenant.id)
      await refreshTenants()
      await loadTenants()
    } catch (err: any) {
      alert(err.message || "Failed to toggle status.")
    }
  }

  const handleDeleteTenant = async (tenant: any) => {
    if (
      window.confirm(
        `Are you sure you want to delete the institution "${tenant.name}"? All associated data will be soft-deleted.`
      )
    ) {
      try {
        await api.platformAdmin.deleteTenant(tenant.id)
        await refreshTenants()
        await loadTenants()
      } catch (err: any) {
        alert(err.message || "Failed to delete tenant.")
      }
    }
  }

  const handleEnterWorkspace = (tenant: any) => {
    setTenantId(tenant.id)
    navigate("/app/dashboard")
  }

  // Aggregates
  const totalInstitutions = tenants.length
  const activeCount = tenants.filter((t) => t.status === "active").length
  const totalStudents = tenants.reduce((acc, t) => acc + (t.students_count || 0), 0)
  const totalStaff = tenants.reduce((acc, t) => acc + (t.staff_count || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 mb-1.5">
            <Building2 className="w-3.5 h-3.5" /> Multi-Tenant Provisioning
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Client Institutions & Organizations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage educational tenants, create isolated databases/domains, adjust capacity quotas, and configure subscription plans.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTenants}
            disabled={isLoading}
            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
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
              setIsOnboardModalOpen(true)
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Onboard Institution
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Institutions</span>
            <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">{totalInstitutions}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Multi-tenant instances</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Tenants</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2">{activeCount}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">100% operational</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Enrolled Learners</span>
            <Users className="w-4 h-4 text-violet-500 dark:text-violet-400" />
          </div>
          <p className="text-2xl font-black text-violet-600 dark:text-violet-400 mt-2">{totalStudents}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across all organizations</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Active Faculty & Staff</span>
            <GraduationCap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">{totalStaff}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Registered educators</p>
        </div>
      </div>

      {/* Filter and View Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search institutions by name, legal title, slug, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="school">K-12 School</option>
            <option value="university">University</option>
            <option value="coaching">Coaching / Tutoring</option>
            <option value="college">College / Institute</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="onboarding">Onboarding</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table Display */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" />
          <p className="font-semibold text-slate-700 dark:text-slate-300">Loading institutions...</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="font-bold text-slate-800 dark:text-slate-200">No institutions match your filters</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting search query or onboard a new tenant.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTenants.map((t) => (
            <div
              key={t.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
            >
              <div className="space-y-4">
                {/* Card Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {t.name}
                      </h3>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        <span>slug: {t.slug}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.status === "active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        t.status === "active" ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500 dark:bg-rose-400"
                      }`}
                    />
                    {t.status}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-950 text-indigo-700 dark:text-indigo-400 border border-slate-200 dark:border-slate-800">
                    {t.institution_type}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                    Tier: {t.subscription_reference || "Enterprise"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    {t.currency} • {t.timezone}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 text-center">
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{t.students_count || 0}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Students</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{t.staff_count || 0}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Staff</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{t.users_count || 0}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Users</p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200">{t.invoices_count || 0}</p>
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Invoices</p>
                  </div>
                </div>

                {/* Contact info */}
                {(t.contact_email || t.contact_phone) && (
                  <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                    {t.contact_email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="truncate">{t.contact_email}</span>
                      </div>
                    )}
                    {t.contact_phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span>{t.contact_phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEnterWorkspace(t)}
                  className="flex-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40 text-xs"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Enter Workspace
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(t)}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      t.status === "active"
                        ? "bg-slate-100 hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/60"
                    }`}
                    title={t.status === "active" ? "Suspend Organization" : "Activate Organization"}
                  >
                    {t.status === "active" ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors"
                    title="Edit Settings"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteTenant(t)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-950 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                    title="Delete Tenant"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4">Institution</th>
                  <th className="py-3.5 px-4">Type & Tier</th>
                  <th className="py-3.5 px-4">Learners & Staff</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Onboarded</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                          {t.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{t.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">slug: {t.slug}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-slate-700 dark:text-slate-200 font-medium uppercase text-[10px]">
                          {t.institution_type}
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold">
                          Tier: {t.subscription_reference || "Enterprise"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-600 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white">{t.students_count || 0}</span> students,{" "}
                        <span className="font-bold text-slate-900 dark:text-white">{t.staff_count || 0}</span> staff
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          t.status === "active"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnterWorkspace(t)}
                          className="h-8 px-2.5 text-[11px] bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40"
                        >
                          Workspace
                        </Button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTenant(t)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Onboard New Institution */}
      <Modal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Building2 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>Onboard New Institution</span>
          </div>
        }
        description="Provision a new isolated SaaS tenant, initialize core roles, and set up the default administrator account."
        size="lg"
      >
        <form onSubmit={handleOnboardSubmit} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Institution Info */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Institution Details
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Institution Display Name *</label>
                <input
                  type="text"
                  required
                  value={onboardForm.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setOnboardForm(prev => ({
                      ...prev,
                      name,
                      slug: prev.slug === "" || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") 
                        ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
                        : prev.slug
                    }))
                  }}
                  placeholder="e.g. Oxford Cambridge Academy"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">URL Subdomain / Slug (Optional)</label>
                <input
                  type="text"
                  value={onboardForm.slug}
                  onChange={(e) => setOnboardForm({ ...onboardForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                  placeholder="e.g. oxford-cambridge"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Legal Organization Name</label>
                <input
                  type="text"
                  value={onboardForm.legal_name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, legal_name: e.target.value })}
                  placeholder="e.g. Oxford Cambridge Education Ltd."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Institution Type</label>
                <select
                  value={onboardForm.institution_type}
                  onChange={(e) => setOnboardForm({ ...onboardForm, institution_type: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="school">K-12 School</option>
                  <option value="university">University</option>
                  <option value="coaching">Coaching / Tutoring</option>
                  <option value="college">College / Institute</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SaaS Plan Tier</label>
                <select
                  value={onboardForm.subscription_plan}
                  onChange={(e) => setOnboardForm({ ...onboardForm, subscription_plan: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Enterprise">Enterprise ($999/mo)</option>
                  <option value="Professional">Professional ($499/mo)</option>
                  <option value="Starter">Starter ($199/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Base Currency</label>
                <select
                  value={onboardForm.currency}
                  onChange={(e) => setOnboardForm({ ...onboardForm, currency: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={onboardForm.contact_email}
                  onChange={(e) => setOnboardForm({ ...onboardForm, contact_email: e.target.value })}
                  placeholder="contact@institution.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={onboardForm.contact_phone}
                  onChange={(e) => setOnboardForm({ ...onboardForm, contact_phone: e.target.value })}
                  placeholder="+1 (800) 234-5678"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Provision Initial Admin User */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Initial Administrator Account (Optional)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Provide credentials to instantly create and bind the primary institution director/admin.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={onboardForm.admin_email}
                  onChange={(e) => setOnboardForm({ ...onboardForm, admin_email: e.target.value })}
                  placeholder="principal@institution.edu"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Admin Password</label>
                <input
                  type="password"
                  minLength={8}
                  value={onboardForm.admin_password}
                  onChange={(e) => setOnboardForm({ ...onboardForm, admin_password: e.target.value })}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={onboardForm.admin_first_name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, admin_first_name: e.target.value })}
                  placeholder="e.g. Principal"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={onboardForm.admin_last_name}
                  onChange={(e) => setOnboardForm({ ...onboardForm, admin_last_name: e.target.value })}
                  placeholder="e.g. Director"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOnboardModalOpen(false)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
              {actionLoading ? "Provisioning..." : "Provision Institution"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Institution */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Edit3 className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span>Configure Institution: {selectedTenant?.name}</span>
          </div>
        }
        description="Update operational settings, currency parameters, and subscription plan tier."
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
              <span>{actionSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Legal Title</label>
            <input
              type="text"
              value={editForm.legal_name}
              onChange={(e) => setEditForm({ ...editForm, legal_name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SaaS Plan Tier</label>
              <select
                value={editForm.subscription_reference}
                onChange={(e) => setEditForm({ ...editForm, subscription_reference: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Enterprise">Enterprise</option>
                <option value="Professional">Professional</option>
                <option value="Starter">Starter</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="onboarding">Onboarding</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={editForm.contact_email}
                onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={editForm.contact_phone}
                onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
              {actionLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
