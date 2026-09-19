import { BaseApiClient, unwrapList } from "./client"

export class PlatformAdminService {
  constructor(private client: BaseApiClient) {}

  public async getStats(): Promise<any> {
    const res = await this.client.request<any>("/platform-admin/stats/")
    return res.data || res
  }

  public async getUsers(params: {
    search?: string
    is_active?: boolean
    is_staff?: boolean
    tenant_id?: string
    role?: string
  } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.search) query.set("search", params.search)
    if (params.is_active !== undefined) query.set("is_active", String(params.is_active))
    if (params.is_staff !== undefined) query.set("is_staff", String(params.is_staff))
    if (params.tenant_id) query.set("tenant_id", params.tenant_id)
    if (params.role) query.set("role", params.role)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/platform-admin/users/${qStr}`)
    return unwrapList(res)
  }

  public async createUser(payload: any): Promise<any> {
    return this.client.request("/platform-admin/users/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateUser(id: string, payload: any): Promise<any> {
    return this.client.request(`/platform-admin/users/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async resetUserPassword(id: string, newPassword: string): Promise<any> {
    return this.client.request(`/platform-admin/users/${id}/reset-password/`, {
      method: "POST",
      body: JSON.stringify({ new_password: newPassword }),
    })
  }

  public async toggleUserStatus(id: string): Promise<any> {
    return this.client.request(`/platform-admin/users/${id}/toggle-status/`, {
      method: "POST",
    })
  }

  public async assignUserTenant(
    id: string,
    payload: { tenant_id: string; role_code?: string; is_default?: boolean }
  ): Promise<any> {
    return this.client.request(`/platform-admin/users/${id}/assign-tenant/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async deleteUser(id: string): Promise<any> {
    return this.client.request(`/platform-admin/users/${id}/`, {
      method: "DELETE",
    })
  }

  public async getTenants(params: { search?: string; status?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.search) query.set("search", params.search)
    if (params.status) query.set("status", params.status)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/platform-admin/tenants/${qStr}`)
    return unwrapList(res)
  }

  public async createTenant(payload: any): Promise<any> {
    return this.client.request("/platform-admin/tenants/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateTenant(id: string, payload: any): Promise<any> {
    return this.client.request(`/platform-admin/tenants/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async toggleTenantStatus(id: string): Promise<any> {
    return this.client.request(`/platform-admin/tenants/${id}/toggle-status/`, {
      method: "POST",
    })
  }

  public async deleteTenant(id: string): Promise<any> {
    return this.client.request(`/platform-admin/tenants/${id}/`, {
      method: "DELETE",
    })
  }

  public async getAuditLogs(params: { tenant_id?: string; action?: string; search?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.tenant_id) query.set("tenant_id", params.tenant_id)
    if (params.action) query.set("action", params.action)
    if (params.search) query.set("search", params.search)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/platform-admin/audit-logs/${qStr}`)
    return unwrapList(res)
  }
}
