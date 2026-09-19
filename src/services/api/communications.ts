import { BaseApiClient, unwrapList } from "./client"

export class CommunicationsService {
  constructor(private client: BaseApiClient) {}

  public async getAnnouncements(): Promise<any[]> {
    const res = await this.client.request<any>("/communications/announcements/")
    return unwrapList(res)
  }

  public async createAnnouncement(payload: {
    title: string
    content: string
    target_audience?: string
  }): Promise<any> {
    return this.client.request("/communications/announcements/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async deleteAnnouncement(id: string): Promise<any> {
    return this.client.request(`/communications/announcements/${id}/`, {
      method: "DELETE",
    })
  }
}
