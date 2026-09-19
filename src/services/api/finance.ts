import { BaseApiClient, unwrapList } from "./client"

export class FinanceService {
  constructor(private client: BaseApiClient) {}

  public async getInvoices(params: { status?: string } = {}): Promise<any[]> {
    const query = new URLSearchParams()
    if (params.status) query.set("status", params.status)
    const qStr = query.toString() ? `?${query.toString()}` : ""
    const res = await this.client.request<any>(`/finance/invoices/${qStr}`)
    return unwrapList(res)
  }

  public async createInvoice(payload: any): Promise<any> {
    return this.client.request("/finance/invoices/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  }

  public async updateInvoice(id: string, payload: any): Promise<any> {
    return this.client.request(`/finance/invoices/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  }

  public async deleteInvoice(id: string): Promise<any> {
    return this.client.request(`/finance/invoices/${id}/`, {
      method: "DELETE",
    })
  }

  public async recordPayment(payload: {
    invoice_id: string
    amount: number
    payment_method?: string
  }): Promise<any> {
    return this.client.request("/finance/payments/record/", {
      method: "POST",
      body: JSON.stringify({
        invoice_id: payload.invoice_id,
        amount: payload.amount,
        payment_method: payload.payment_method || "card",
      }),
    })
  }
}
