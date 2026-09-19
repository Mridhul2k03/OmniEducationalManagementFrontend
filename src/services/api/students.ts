import { BaseApiClient, unwrapList } from "./client"

export class StudentsService {
  constructor(private client: BaseApiClient) {}

  public async list(params: { search?: string; status?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.search) query.set("search", params.search)
    if (params.status) query.set("status", params.status)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/students/${qStr}`)
    return unwrapList(res)
  }

  public async admit(studentPayload: any): Promise<any> {
    return this.client.request("/students/admit/", {
      method: "POST",
      body: JSON.stringify(studentPayload),
    })
  }

  public async update(id: string, updates: any): Promise<any> {
    return this.client.request(`/students/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    })
  }

  public async delete(id: string): Promise<any> {
    return this.client.request(`/students/${id}/`, {
      method: "DELETE",
    })
  }
}
