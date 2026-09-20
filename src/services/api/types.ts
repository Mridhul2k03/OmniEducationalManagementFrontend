/**
 * API Type Definitions for OmniEducationalManagement API Client.
 */

export interface ApiUser {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone_number?: string
  avatar_url?: string
  is_staff: boolean
  is_superuser: boolean
}

export interface ApiTenant {
  id: string
  name: string
  slug: string
  institution_type: string
  currency?: string
  timezone?: string
  is_default?: boolean
}

export interface LoginResponse {
  access: string
  refresh: string
  user: ApiUser
  accessible_tenants: ApiTenant[]
  active_tenant?: ApiTenant
  role?: string
  profile_type?: 'student' | 'staff' | 'admin'
  student_profile?: {
    id: string
    admission_number: string
    class_cohort_name?: string
    section_name?: string
  }
  staff_profile?: {
    id: string
    employee_id: string
    designation?: string
    department_name?: string
  }
  subscription_plan?: string
}

export interface MeResponse {
  success: boolean
  data: {
    user: ApiUser
    active_tenant: ApiTenant | null
    active_permissions: string[]
    memberships: Array<{
      id: string
      tenant: ApiTenant
      status: string
      is_default: boolean
      roles: Array<{ id: string; code: string; name: string }>
      permissions: string[]
    }>
  }
}

export interface AuthCheckResponse {
  success: boolean
  authenticated: boolean
  data?: {
    user: ApiUser
    role: string
    is_institution_superadmin?: boolean
    profile_type?: 'student' | 'staff' | 'admin'
    student_profile?: {
      id: string
      admission_number: string
      class_cohort_name?: string
      section_name?: string
    }
    staff_profile?: {
      id: string
      employee_id: string
      designation?: string
      department_name?: string
    }
    subscription_plan?: string
    active_tenant: ApiTenant | null
    permissions: string[]
  }
  message?: string
}

export interface CreateInstitutionUserRequest {
  email: string
  first_name: string
  last_name: string
  password?: string
  phone_number?: string
  role_code?: string
  permissions?: string[]
  designation?: string
  department_id?: string
  employment_type?: string
}

export interface UpdateInstitutionUserRequest {
  first_name?: string
  last_name?: string
  phone_number?: string
  status?: 'active' | 'suspended' | 'invited' | 'inactive'
  role_code?: string
  permissions?: string[]
  designation?: string
  department_id?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data: T
  error?: {
    code: string
    message: string
    details?: any
  }
}
