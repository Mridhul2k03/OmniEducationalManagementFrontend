import { BaseApiClient } from "./client"
import { LoginResponse, MeResponse, AuthCheckResponse, ApiTenant } from "./types"

export class AuthService {
  constructor(private client: BaseApiClient) {}

  public async login(email: string, password: string): Promise<LoginResponse> {
    const res = await this.client.request<LoginResponse>("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false)

    if (res?.access) {
      this.client.setTokens(res.access, res.refresh)
    }

    if (res.active_tenant?.id) {
      this.client.setActiveTenantId(res.active_tenant.id)
    }
    return res
  }

  public async check(): Promise<{ authenticated: boolean; data?: AuthCheckResponse["data"] }> {
    try {
      const res = await this.client.request<AuthCheckResponse>("/auth/check/", {
        method: "GET",
      }, true)
      return {
        authenticated: !!res?.authenticated,
        data: res?.data,
      }
    } catch {
      return { authenticated: false }
    }
  }

  public async me(): Promise<MeResponse["data"]> {
    const res = await this.client.request<MeResponse>("/auth/me/")
    return res.data
  }

  public async switchTenant(tenantId: string): Promise<any> {
    const res = await this.client.request("/auth/switch-tenant/", {
      method: "POST",
      body: JSON.stringify({ tenant_id: tenantId }),
    })
    this.client.setActiveTenantId(tenantId)
    return res
  }

  public async logout(): Promise<void> {
    try {
      await this.client.request("/auth/logout/", {
        method: "POST",
      }, false)
    } catch (err) {
      console.warn("Backend logout request completed with note:", err)
    } finally {
      this.client.clearAuth()
    }
  }

  public async refreshToken(): Promise<boolean> {
    return this.client.refreshToken()
  }

  public async studentLogin(email: string, password: string, tenantId?: string): Promise<LoginResponse> {
    const headers: Record<string, string> = {}
    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId
    }
    const res = await this.client.request<LoginResponse>("/auth/student-login/", {
      method: "POST",
      headers,
      body: JSON.stringify({ email, password, tenant_id: tenantId }),
    }, false)

    if (res?.access) {
      this.client.setTokens(res.access, res.refresh)
    }

    if (res.active_tenant?.id) {
      this.client.setActiveTenantId(res.active_tenant.id)
    }
    return res
  }

  public async studentRegister(payload: {
    tenant_id: string
    email: string
    password: string
    first_name: string
    last_name: string
    phone_number?: string
    admission_number: string
    grade_or_program?: string
    gender?: string
    date_of_birth?: string | null
    notes?: string
  }): Promise<any> {
    return this.client.request("/auth/student-register/", {
      method: "POST",
      body: JSON.stringify(payload),
    }, false)
  }

  public async studentReRequest(payload: {
    email: string
    tenant_id?: string
    notes?: string
  }): Promise<any> {
    return this.client.request("/auth/student-rerequest/", {
      method: "POST",
      body: JSON.stringify(payload),
    }, false)
  }

  public async studentCheckStatus(email: string, tenantId?: string): Promise<any> {
    return this.client.request("/auth/student-status/", {
      method: "POST",
      body: JSON.stringify({ email, tenant_id: tenantId }),
    }, false)
  }
}
