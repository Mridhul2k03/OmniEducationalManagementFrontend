import { BaseApiClient, unwrapList } from "./client"
import { ApiTenant } from "./types"

export class TenantsService {
  constructor(private client: BaseApiClient) {}

  public async list(): Promise<ApiTenant[]> {
    const res = await this.client.request<any>("/tenants/")
    return unwrapList<ApiTenant>(res)
  }

  public async current(): Promise<ApiTenant> {
    const res = await this.client.request<any>("/tenants/current/")
    return res.data || res
  }
}
