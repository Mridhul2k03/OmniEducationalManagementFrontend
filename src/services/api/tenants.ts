import { BaseApiClient, unwrapList } from "./client"
import { ApiTenant } from "./types"

export interface PlanFeatureMatrix {
  students_limit: number
  staff_limit: number
  ai_tutor: boolean
  exams: boolean
  lms: boolean
  finance_advanced: boolean
  audit_logs: boolean
  multi_campus: boolean
  priority_support: boolean
}

export interface SubscriptionPlanItem {
  id: "starter" | "professional" | "enterprise"
  name: string
  monthly_price: number
  annual_price: number
  tagline: string
  features: PlanFeatureMatrix
  highlights: string[]
  is_popular?: boolean
}

export interface CurrentPlanResponse {
  current_plan_id: string
  current_plan: SubscriptionPlanItem
  available_plans: Record<string, SubscriptionPlanItem>
  features: PlanFeatureMatrix
}

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

  public async getCurrentPlan(): Promise<CurrentPlanResponse> {
    const res = await this.client.request<any>("/tenants/current-plan/")
    return res.data || res
  }

  public async upgradePlan(planId: string): Promise<{ success: boolean; message: string; plan_id: string }> {
    const res = await this.client.request<any>("/tenants/upgrade-plan/", {
      method: "POST",
      body: JSON.stringify({ plan_id: planId }),
    })
    return res.data || res
  }
}
