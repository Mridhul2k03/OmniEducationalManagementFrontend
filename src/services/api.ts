/**
 * Unified API Client for OmniEducationalManagement.
 * Handles JWT bearer authentication, multi-tenant headers, token refresh, and typed domain operations.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1"

// Storage keys
const ACCESS_TOKEN_KEY = "omni-access-token"
const REFRESH_TOKEN_KEY = "omni-refresh-token"
const ACTIVE_TENANT_ID_KEY = "omni-active-tenant-id"

export interface ApiUser {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone_number?: string
  avatar_url?: string
  is_staff: boolean
  is_superuser: boolean
}

export interface ApiTenant {
  id: string
  name: string
  slug: string
  institution_type: string
  currency?: string
  timezone?: string
  is_default?: boolean
}

export interface LoginResponse {
  access: string
  refresh: string
  user: ApiUser
  accessible_tenants: ApiTenant[]
  active_tenant?: ApiTenant
}

export interface MeResponse {
  success: boolean
  data: {
    user: ApiUser
    active_tenant: ApiTenant | null
    active_permissions: string[]
    memberships: Array<{
      id: string
      tenant: ApiTenant
      status: string
      is_default: boolean
      roles: Array<{ id: string; code: string; name: string }>
      permissions: string[]
    }>
  }
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

const unwrapList = <T = any>(res: any): T[] => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.results)) return res.results
  return []
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL
  }

  // Token & Tenant Management
  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  }

  public getActiveTenantId(): string | null {
    const val = localStorage.getItem(ACTIVE_TENANT_ID_KEY) || localStorage.getItem("omni-active-tenant")
    if (val && val !== "undefined" && val !== "null" && val.trim() !== "") {
      return val.trim()
    }
    return null
  }

  public setTokens(access: string, refresh?: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, access)
    if (refresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
    }
  }

  public setActiveTenantId(tenantId: string): void {
    if (tenantId && tenantId !== "undefined" && tenantId !== "null") {
      localStorage.setItem(ACTIVE_TENANT_ID_KEY, tenantId)
      localStorage.setItem("omni-active-tenant", tenantId)
    }
  }

  public clearAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(ACTIVE_TENANT_ID_KEY)
    localStorage.removeItem("omni-active-tenant")
  }

  /**
   * Performs an HTTP request with automatic Authorization and X-Tenant-ID headers,
   * plus auto-retry once after 401 token refresh.
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuthFailure: boolean = true
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    const url = `${this.baseURL}${cleanEndpoint}`

    const headers = new Headers(options.headers || {})

    // Set JSON content-type if body is an object
    if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    // Attach JWT Bearer token
    const token = this.getAccessToken()
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    // Attach X-Tenant-ID header if present and valid
    const tenantId = this.getActiveTenantId()
    if (tenantId && tenantId !== "undefined" && tenantId !== "null" && tenantId.trim() !== "" && !headers.has("X-Tenant-ID")) {
      headers.set("X-Tenant-ID", tenantId.trim())
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      })

      // Handle 401 Unauthorized by attempting a token refresh
      if (response.status === 401 && retryOnAuthFailure) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          // Retry the request with the refreshed token
          return this.request<T>(endpoint, options, false)
        } else {
          this.clearAuth()
        }
      }

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { message: `Request failed with status ${response.status}` }
        }
        throw new Error(errorData?.error?.message || errorData?.detail || errorData?.message || `HTTP ${response.status}`)
      }

      if (response.status === 204) {
        return {} as T
      }

      return await response.json()
    } catch (err: any) {
      throw err
    }
  }

  /**
   * Refreshes the JWT access token using the stored refresh token or HttpOnly cookie.
   */
  public async refreshToken(): Promise<boolean> {
    const refresh = this.getRefreshToken()

    try {
      const res = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(refresh ? { refresh } : {}),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.access) {
          this.setTokens(data.access, data.refresh || refresh || undefined)
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  // ================= DOMAIN APIS ================= //

  public health = {
    check: async (): Promise<{ isConnected: boolean; latencyMs: number; status?: string; database?: string }> => {
      const start = performance.now()
      try {
        const res = await fetch(`${this.baseURL}/health/`, { method: "GET" })
        const latencyMs = Math.round(performance.now() - start)
        if (res.ok) {
          const json = await res.json()
          return {
            isConnected: true,
            latencyMs,
            status: json?.data?.status || "healthy",
          }
        }
        return { isConnected: false, latencyMs }
      } catch {
        return { isConnected: false, latencyMs: Math.round(performance.now() - start) }
      }
    },
  }

  public auth = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
      const res = await this.request<LoginResponse>("/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }, false)

      if (res.access) {
        this.setTokens(res.access, res.refresh)
        if (res.active_tenant?.id) {
          this.setActiveTenantId(res.active_tenant.id)
        }
      }
      return res
    },

    check: async (): Promise<{ authenticated: boolean; data?: any }> => {
      try {
        const res = await this.request<any>("/auth/check/", { method: "GET" }, true)
        return {
          authenticated: !!res?.authenticated,
          data: res?.data,
        }
      } catch {
        return { authenticated: false }
      }
    },

    me: async (): Promise<MeResponse["data"]> => {
      const res = await this.request<MeResponse>("/auth/me/")
      return res.data
    },

    switchTenant: async (tenantId: string): Promise<any> => {
      const res = await this.request("/auth/switch-tenant/", {
        method: "POST",
        body: JSON.stringify({ tenant_id: tenantId }),
      })
      this.setActiveTenantId(tenantId)
      return res
    },

    logout: async (): Promise<void> => {
      try {
        await this.request("/auth/logout/", { method: "POST" })
      } catch {
        // Continue clearing client-side auth
      }
      this.clearAuth()
    },
  }

  public tenants = {
    list: async (): Promise<ApiTenant[]> => {
      const res = await this.request<any>("/tenants/")
      return unwrapList<ApiTenant>(res)
    },
    current: async (): Promise<ApiTenant> => {
      const res = await this.request<any>("/tenants/current/")
      return res.data || res
    },
  }

  public students = {
    list: async (params: { search?: string; status?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.search) query.set("search", params.search)
      if (params.status) query.set("status", params.status)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/students/${qStr}`)
      return unwrapList(res)
    },
    admit: async (studentPayload: any): Promise<any> => {
      return this.request("/students/admit/", {
        method: "POST",
        body: JSON.stringify(studentPayload),
      })
    },
    update: async (id: string, updates: any): Promise<any> => {
      return this.request(`/students/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      })
    },
    delete: async (id: string): Promise<any> => {
      return this.request(`/students/${id}/`, {
        method: "DELETE",
      })
    },
  }

  public staff = {
    list: async (params: { search?: string; department?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.search) query.set("search", params.search)
      if (params.department) query.set("department", params.department)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/staff/${qStr}`)
      return unwrapList(res)
    },
    create: async (payload: any): Promise<any> => {
      return this.request("/staff/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    update: async (id: string, payload: any): Promise<any> => {
      return this.request(`/staff/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    delete: async (id: string): Promise<any> => {
      return this.request(`/staff/${id}/`, {
        method: "DELETE",
      })
    },
  }

  public academics = {
    getYears: async (): Promise<any[]> => {
      const res = await this.request<any>("/academics/years/")
      return unwrapList(res)
    },
    createYear: async (payload: any): Promise<any> => {
      return this.request("/academics/years/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateYear: async (id: string, payload: any): Promise<any> => {
      return this.request(`/academics/years/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    deleteYear: async (id: string): Promise<any> => {
      return this.request(`/academics/years/${id}/`, {
        method: "DELETE",
      })
    },
    getCourses: async (): Promise<any[]> => {
      const res = await this.request<any>("/academics/courses/")
      return unwrapList(res)
    },
    createCourse: async (payload: any): Promise<any> => {
      return this.request("/academics/courses/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateCourse: async (id: string, payload: any): Promise<any> => {
      return this.request(`/academics/courses/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    deleteCourse: async (id: string): Promise<any> => {
      return this.request(`/academics/courses/${id}/`, {
        method: "DELETE",
      })
    },
    getClasses: async (): Promise<any[]> => {
      const res = await this.request<any>("/academics/classes/")
      return unwrapList(res)
    },
    createClass: async (payload: any): Promise<any> => {
      return this.request("/academics/classes/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateClass: async (id: string, payload: any): Promise<any> => {
      return this.request(`/academics/classes/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    deleteClass: async (id: string): Promise<any> => {
      return this.request(`/academics/classes/${id}/`, {
        method: "DELETE",
      })
    },
    getSections: async (): Promise<any[]> => {
      const res = await this.request<any>("/academics/sections/")
      return unwrapList(res)
    },
    createSection: async (payload: any): Promise<any> => {
      return this.request("/academics/sections/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateSection: async (id: string, payload: any): Promise<any> => {
      return this.request(`/academics/sections/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    deleteSection: async (id: string): Promise<any> => {
      return this.request(`/academics/sections/${id}/`, {
        method: "DELETE",
      })
    },
    getSubjects: async (): Promise<any[]> => {
      const res = await this.request<any>("/academics/subjects/")
      return unwrapList(res)
    },
    createSubject: async (payload: any): Promise<any> => {
      return this.request("/academics/subjects/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateSubject: async (id: string, payload: any): Promise<any> => {
      return this.request(`/academics/subjects/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    deleteSubject: async (id: string): Promise<any> => {
      return this.request(`/academics/subjects/${id}/`, {
        method: "DELETE",
      })
    },
  }

  public attendance = {
    getRecords: async (params: { date?: string; section_id?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.date) query.set("date", params.date)
      if (params.section_id) query.set("section", params.section_id)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/attendance/records/${qStr}`)
      return unwrapList(res)
    },
    createRecord: async (payload: any): Promise<any> => {
      return this.request("/attendance/records/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateRecord: async (id: string, payload: any): Promise<any> => {
      return this.request(`/attendance/records/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    bulkMark: async (payload: { section_id: string; date: string; subject_id?: string; entries: Array<{ student_id: string; status: string; remarks?: string }> }): Promise<any> => {
      return this.request("/attendance/records/bulk-mark/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
  }

  public examinations = {
    getExams: async (): Promise<any[]> => {
      const res = await this.request<any>("/exams/exams/")
      return unwrapList(res)
    },
    createExam: async (payload: any): Promise<any> => {
      return this.request("/exams/exams/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateExam: async (id: string, payload: any): Promise<any> => {
      return this.request(`/exams/exams/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    publishExam: async (id: string): Promise<any> => {
      return this.request(`/exams/exams/${id}/publish/`, {
        method: "POST",
      })
    },
    deleteExam: async (id: string): Promise<any> => {
      return this.request(`/exams/exams/${id}/`, {
        method: "DELETE",
      })
    },
    getMarks: async (params: { exam_id?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.exam_id) query.set("exam", params.exam_id)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/exams/marks/${qStr}`)
      return unwrapList(res)
    },
    createMark: async (payload: any): Promise<any> => {
      return this.request("/exams/marks/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateMark: async (id: string, marksObtained: number, feedback?: string): Promise<any> => {
      const body: any = { marks_obtained: marksObtained }
      if (feedback !== undefined) body.feedback = feedback
      return this.request(`/exams/marks/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
    },
    deleteMark: async (id: string): Promise<any> => {
      return this.request(`/exams/marks/${id}/`, {
        method: "DELETE",
      })
    },
  }

  public finance = {
    getInvoices: async (params: { status?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.status) query.set("status", params.status)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/finance/invoices/${qStr}`)
      return unwrapList(res)
    },
    createInvoice: async (payload: any): Promise<any> => {
      return this.request("/finance/invoices/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateInvoice: async (id: string, payload: any): Promise<any> => {
      return this.request(`/finance/invoices/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    deleteInvoice: async (id: string): Promise<any> => {
      return this.request(`/finance/invoices/${id}/`, {
        method: "DELETE",
      })
    },
    recordPayment: async (payload: { invoice_id: string; amount: number; payment_method?: string }): Promise<any> => {
      return this.request("/finance/payments/record/", {
        method: "POST",
        body: JSON.stringify({
          invoice_id: payload.invoice_id,
          amount: payload.amount,
          payment_method: payload.payment_method || "card",
        }),
      })
    },
  }

  public communications = {
    getAnnouncements: async (): Promise<any[]> => {
      const res = await this.request<any>("/communications/announcements/")
      return unwrapList(res)
    },
    createAnnouncement: async (payload: { title: string; content: string; target_audience?: string }): Promise<any> => {
      return this.request("/communications/announcements/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    deleteAnnouncement: async (id: string): Promise<any> => {
      return this.request(`/communications/announcements/${id}/`, {
        method: "DELETE",
      })
    },
  }

  public audit = {
    list: async (params: { action?: string; resource_type?: string; search?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.action) query.set("action", params.action)
      if (params.resource_type) query.set("resource_type", params.resource_type)
      if (params.search) query.set("search", params.search)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/audit/${qStr}`)
      return unwrapList(res)
    },
  }

  public platformAdmin = {
    getStats: async (): Promise<any> => {
      const res = await this.request<any>("/platform-admin/stats/")
      return res.data || res
    },
    getUsers: async (params: { search?: string; is_active?: boolean; is_staff?: boolean; tenant_id?: string; role?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.search) query.set("search", params.search)
      if (params.is_active !== undefined) query.set("is_active", String(params.is_active))
      if (params.is_staff !== undefined) query.set("is_staff", String(params.is_staff))
      if (params.tenant_id) query.set("tenant_id", params.tenant_id)
      if (params.role) query.set("role", params.role)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/platform-admin/users/${qStr}`)
      return unwrapList(res)
    },
    createUser: async (payload: any): Promise<any> => {
      return this.request("/platform-admin/users/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateUser: async (id: string, payload: any): Promise<any> => {
      return this.request(`/platform-admin/users/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    resetUserPassword: async (id: string, newPassword: string): Promise<any> => {
      return this.request(`/platform-admin/users/${id}/reset-password/`, {
        method: "POST",
        body: JSON.stringify({ new_password: newPassword }),
      })
    },
    toggleUserStatus: async (id: string): Promise<any> => {
      return this.request(`/platform-admin/users/${id}/toggle-status/`, {
        method: "POST",
      })
    },
    assignUserTenant: async (id: string, payload: { tenant_id: string; role_code?: string; is_default?: boolean }): Promise<any> => {
      return this.request(`/platform-admin/users/${id}/assign-tenant/`, {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    deleteUser: async (id: string): Promise<any> => {
      return this.request(`/platform-admin/users/${id}/`, {
        method: "DELETE",
      })
    },
    getTenants: async (params: { search?: string; status?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.search) query.set("search", params.search)
      if (params.status) query.set("status", params.status)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/platform-admin/tenants/${qStr}`)
      return unwrapList(res)
    },
    createTenant: async (payload: any): Promise<any> => {
      return this.request("/platform-admin/tenants/", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    },
    updateTenant: async (id: string, payload: any): Promise<any> => {
      return this.request(`/platform-admin/tenants/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      })
    },
    toggleTenantStatus: async (id: string): Promise<any> => {
      return this.request(`/platform-admin/tenants/${id}/toggle-status/`, {
        method: "POST",
      })
    },
    deleteTenant: async (id: string): Promise<any> => {
      return this.request(`/platform-admin/tenants/${id}/`, {
        method: "DELETE",
      })
    },
    getAuditLogs: async (params: { tenant_id?: string; action?: string; search?: string } = {}): Promise<any[]> => {
      const query = new URLSearchParams()
      if (params.tenant_id) query.set("tenant_id", params.tenant_id)
      if (params.action) query.set("action", params.action)
      if (params.search) query.set("search", params.search)
      const qStr = query.toString() ? `?${query.toString()}` : ""
      const res = await this.request<any>(`/platform-admin/audit-logs/${qStr}`)
      return unwrapList(res)
    },
  }
}

export const api = new ApiClient()
