import { BaseApiClient, unwrapList } from "./client"

export class ExaminationsService {
  constructor(private client: BaseApiClient) {}

  public async getExams(): Promise<any[]> {
    const res = await this.client.request<any>("/exams/exams/")
    return unwrapList(res)
  }

  public async createExam(payload: any): Promise<any> {
    return this.client.request("/exams/exams/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateExam(id: string, payload: any): Promise<any> {
    return this.client.request(`/exams/exams/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async publishExam(id: string): Promise<any> {
    return this.client.request(`/exams/exams/${id}/publish/`, {
      method: "POST",
    })
  }

  public async deleteExam(id: string): Promise<any> {
    return this.client.request(`/exams/exams/${id}/`, {
      method: "DELETE",
    })
  }

  public async getMarks(params: { exam_id?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.exam_id) query.set("exam", params.exam_id)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/exams/marks/${qStr}`)
    return unwrapList(res)
  }

  public async createMark(payload: any): Promise<any> {
    return this.client.request("/exams/marks/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateMark(id: string, marksObtained: number, feedback?: string): Promise<any> {
    const body: any = { marks_obtained: marksObtained }
    if (feedback !== undefined) body.feedback = feedback
    return this.client.request(`/exams/marks/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(body),
    })
  }

  public async deleteMark(id: string): Promise<any> {
    return this.client.request(`/exams/marks/${id}/`, {
      method: "DELETE",
    })
  }
}
