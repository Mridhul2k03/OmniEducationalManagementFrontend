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
}
