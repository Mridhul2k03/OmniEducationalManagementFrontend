import { BaseApiClient, unwrapList } from "./client"

export class StaffService {
  constructor(private client: BaseApiClient) {}

  public async list(params: { search?: string; department?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.search) query.set("search", params.search)
    if (params.department) query.set("department", params.department)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/staff/${qStr}`)
    return unwrapList(res)
  }

  public async create(payload: any): Promise<any> {
    return this.client.request("/staff/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async update(id: string, payload: any): Promise<any> {
    return this.client.request(`/staff/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async delete(id: string): Promise<any> {
    return this.client.request(`/staff/${id}/`, {
      method: "DELETE",
    })
  }
}
