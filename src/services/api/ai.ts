import { BaseApiClient } from "./client"

export interface AIChatMessage {
  role: "user" | "model"
  content: string
}

export interface AITutorResponse {
  answer: string
  subject: string
  model_used: string
  disclaimer?: string
}

export interface StudyPlanDay {
  day: number
  theme: string
  key_concepts: string[]
  recommended_time_minutes: number
  practice_tasks: string[]
}

export interface StudyPlanResponse {
  plan_title: string
  subject: string
  topic: string
  target_days: number
  overview: string
  daily_breakdown: StudyPlanDay[]
  study_tips: string[]
  model_used: string
}

export class AIService {
  constructor(private client: BaseApiClient) {}

  public async askTutor(params: {
    prompt: string
    subject?: string
    chat_history?: AIChatMessage[]
  }): Promise<AITutorResponse> {
    const res = await this.client.request<any>("/ai/tutor/", {
      method: "POST",
      body: JSON.stringify(params),
    })
    return res.data || res
  }

  public async generateStudyPlan(params: {
    subject: string
    topic: string
    target_days?: number
  }): Promise<StudyPlanResponse> {
    const res = await this.client.request<any>("/ai/study-plan/", {
      method: "POST",
      body: JSON.stringify(params),
    })
    return res.data || res
  }

  public async getCapabilities(): Promise<{
    capabilities: string[]
    model_configured: string
    plans_allowed: string[]
  }> {
    const res = await this.client.request<any>("/ai/tutor/", {
      method: "GET",
    })
    return res.data || res
  }
}
