import { BaseApiClient } from "./client"
import { InstitutionUser, RoleDefinition, PermissionDefinition } from "../../types"
import { CreateInstitutionUserRequest, UpdateInstitutionUserRequest } from "./types"

export class InstitutionUsersService {
  constructor(private client: BaseApiClient) {}

  public async list(params?: { role?: string; status?: string; search?: string }): Promise<InstitutionUser[]> {
    const query = new URLSearchParams()
    if (params?.role) query.append("role", params.role)
    if (params?.status) query.append("status", params.status)
    if (params?.search) query.append("search", params.search)

    const endpoint = `/institution-users/${query.toString() ? `?${query.toString()}` : ""}`
    const res = await this.client.get<any>(endpoint)
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.results)) return res.results
    return []
  }

  public async get(id: string): Promise<InstitutionUser> {
    const res = await this.client.get<any>(`/institution-users/${id}/`)
    return res?.data || res
  }

  public async create(data: CreateInstitutionUserRequest): Promise<InstitutionUser> {
    const res = await this.client.post<any>("/institution-users/", data)
    return res?.data || res
  }

  public async update(id: string, data: UpdateInstitutionUserRequest): Promise<InstitutionUser> {
    const res = await this.client.patch<any>(`/institution-users/${id}/`, data)
    return res?.data || res
  }

  public async toggleStatus(id: string): Promise<InstitutionUser> {
    const res = await this.client.post<any>(`/institution-users/${id}/toggle-status/`, {})
    return res?.data || res
  }

  public async resetPassword(id: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.client.post<{ success: boolean; message: string }>(`/institution-users/${id}/reset-password/`, {
      new_password: newPassword,
    })
  }

  public async delete(id: string): Promise<{ success: boolean; message: string }> {
    return this.client.delete<{ success: boolean; message: string }>(`/institution-users/${id}/`)
  }
}

export class RolesService {
  constructor(private client: BaseApiClient) {}

  public async list(): Promise<RoleDefinition[]> {
    const res = await this.client.get<any>("/roles/")
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.results)) return res.results
    return []
  }

  public async create(data: { name: string; code: string; description?: string; permission_codes?: string[] }): Promise<RoleDefinition> {
    const res = await this.client.post<any>("/roles/", data)
    return res?.data || res
  }

  public async update(id: string, data: { name?: string; description?: string; permission_codes?: string[] }): Promise<RoleDefinition> {
    const res = await this.client.patch<any>(`/roles/${id}/`, data)
    return res?.data || res
  }

  public async delete(id: string): Promise<void> {
    await this.client.delete(`/roles/${id}/`)
  }
}

export class PermissionsService {
  constructor(private client: BaseApiClient) {}

  public async list(): Promise<PermissionDefinition[]> {
    const res = await this.client.get<any>("/permissions/")
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.results)) return res.results
    return []
  }
}
