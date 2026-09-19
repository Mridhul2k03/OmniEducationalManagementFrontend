import { BaseApiClient, unwrapList } from "./client"

export class AuditService {
  constructor(private client: BaseApiClient) {}

  public async list(params: { action?: string; resource_type?: string; search?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.action) query.set("action", params.action)
    if (params.resource_type) query.set("resource_type", params.resource_type)
    if (params.search) query.set("search", params.search)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/audit/${qStr}`)
    return unwrapList(res)
  }
}
