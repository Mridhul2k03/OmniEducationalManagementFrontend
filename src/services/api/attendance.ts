import { BaseApiClient, unwrapList } from "./client"

export class AttendanceService {
  constructor(private client: BaseApiClient) {}

  public async getRecords(params: { date?: string; section_id?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.date) query.set("date", params.date)
    if (params.section_id) query.set("section", params.section_id)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/attendance/records/${qStr}`)
    return unwrapList(res)
  }

  public async createRecord(payload: any): Promise<any> {
    return this.client.request("/attendance/records/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateRecord(id: string, payload: any): Promise<any> {
    return this.client.request(`/attendance/records/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async bulkMark(payload: {
    section_id: string
    date: string
    subject_id?: string
    entries: Array<{ student_id: string; status: string; remarks?: string }>
  }): Promise<any> {
    return this.client.request("/attendance/records/bulk-mark/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }
}
