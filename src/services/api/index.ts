/**
 * Unified modular API client instance for OmniEducationalManagement.
 */
import { BaseApiClient } from "./client"
import { AuthService } from "./auth"
import { TenantsService } from "./tenants"
import { StudentsService } from "./students"
import { StaffService } from "./staff"
import { AcademicsService } from "./academics"
import { AttendanceService } from "./attendance"
import { ExaminationsService } from "./examinations"
import { FinanceService } from "./finance"
import { CommunicationsService } from "./communications"
import { AuditService } from "./audit"
import { PlatformAdminService } from "./platformAdmin"
import { InstitutionUsersService, RolesService, PermissionsService } from "./institutionUsers"
import { StudentPortalService } from "./studentPortal"
import { AIService } from "./ai"

export * from "./types"
export * from "./client"
export * from "./institutionUsers"
export * from "./studentPortal"
export * from "./ai"
export * from "./tenants"

export class ApiService extends BaseApiClient {
  public health = {
    check: async (): Promise<{ isConnected: boolean; latencyMs: number; status?: string; database?: string }> => {
      const start = performance.now()
      try {
        const res = await fetch(`${this.baseURL}/health/`, { method: "GET" })
        const latencyMs = Math.round(performance.now() - start)
        if (res.ok) {
          const json = await res.json()
          return {
            isConnected: true,
            latencyMs,
            status: json?.data?.status || "healthy",
          }
        }
        return { isConnected: false, latencyMs }
      } catch {
        return { isConnected: false, latencyMs: Math.round(performance.now() - start) }
      }
    },
  }

  public auth = new AuthService(this)
  public tenants = new TenantsService(this)
  public students = new StudentsService(this)
  public staff = new StaffService(this)
  public academics = new AcademicsService(this)
  public attendance = new AttendanceService(this)
  public examinations = new ExaminationsService(this)
  public finance = new FinanceService(this)
  public communications = new CommunicationsService(this)
  public audit = new AuditService(this)
  public platformAdmin = new PlatformAdminService(this)
  public institutionUsers = new InstitutionUsersService(this)
  public roles = new RolesService(this)
  public permissions = new PermissionsService(this)
  public studentPortal = new StudentPortalService(this)
  public ai = new AIService(this)
}

export const api = new ApiService()
export default api
