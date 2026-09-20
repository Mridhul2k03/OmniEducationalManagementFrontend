/**
 * Base HTTP Client for OmniEducationalManagement API.
 * Configured with HttpOnly cookie credentials, X-Tenant-ID headers, and automatic token refresh.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1"
const ACTIVE_TENANT_ID_KEY = "omni-active-tenant-id"

export const unwrapList = <T = any>(res: any): T[] => {
  if (Array.isArray(res)) return res
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.results)) return res.results
  return []
}

export class BaseApiClient {
  protected baseURL: string

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL
  }

  public getActiveTenantId(): string | null {
    const val = localStorage.getItem(ACTIVE_TENANT_ID_KEY) || localStorage.getItem("omni-active-tenant")
    if (val && val !== "undefined" && val !== "null" && val.trim() !== "") {
      return val.trim()
    }
    return null
  }

  public setActiveTenantId(tenantId: string): void {
    if (tenantId && tenantId !== "undefined" && tenantId !== "null") {
      localStorage.setItem(ACTIVE_TENANT_ID_KEY, tenantId)
      localStorage.setItem("omni-active-tenant", tenantId)
    }
  }

  public clearAuth(): void {
    localStorage.removeItem(ACTIVE_TENANT_ID_KEY)
    localStorage.removeItem("omni-active-tenant")
    localStorage.removeItem("omni-access-token")
    localStorage.removeItem("omni-refresh-token")
  }

  public getAccessToken(): string | null {
    return localStorage.getItem("omni-access-token")
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem("omni-refresh-token")
  }

  public setTokens(access: string, refresh?: string): void {
    localStorage.setItem("omni-access-token", access)
    if (refresh) {
      localStorage.setItem("omni-refresh-token", refresh)
    }
  }

  /**
   * Main request method with automatic Cookie credentials and X-Tenant-ID header.
   */
  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuthFailure: boolean = true
  ): Promise<T> {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    const url = `${this.baseURL}${cleanEndpoint}`

    const headers = new Headers(options.headers || {})

    // Set JSON content-type if body is JSON string
    if (options.body && typeof options.body === "string" && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json")
    }

    // Attach active Tenant ID header
    const tenantId = this.getActiveTenantId()
    if (tenantId && tenantId !== "undefined" && tenantId !== "null" && tenantId.trim() !== "" && !headers.has("X-Tenant-ID")) {
      headers.set("X-Tenant-ID", tenantId.trim())
    }

    // Attach Authorization Bearer token as dual-layer defense alongside HttpOnly cookies
    const token = this.getAccessToken()
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Always pass HttpOnly auth cookies
      })

      // Auto-refresh token on 401
      if (response.status === 401 && retryOnAuthFailure) {
        const refreshed = await this.refreshToken()
        if (refreshed) {
          return this.request<T>(endpoint, options, false)
        } else {
          this.clearAuth()
        }
      }

      if (!response.ok) {
        let errorData: any
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
   * Refreshes access token via HttpOnly refresh cookie and bearer fallback.
   */
  public async refreshToken(): Promise<boolean> {
    try {
      const storedRefresh = this.getRefreshToken()
      const body = storedRefresh ? JSON.stringify({ refresh: storedRefresh }) : JSON.stringify({})
      const res = await fetch(`${this.baseURL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body,
      })

      if (res.ok) {
        const data = await res.json()
        if (data?.access) {
          this.setTokens(data.access, data.refresh)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  public async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" })
  }

  public async post<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async patch<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async put<T = any>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  public async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" })
  }
}
