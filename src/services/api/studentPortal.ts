import { BaseApiClient } from "./client"

export interface StudentProfileData {
  id: string
  admission_number: string
  first_name: string
  last_name: string
  full_name: string
  email: string
  gender: string
  blood_group: string
  status: string
  institution_name: string
  currency: string
}

export interface AcademicPlacement {
  academic_year: string
  class_cohort: string
  section: string
  roll_number: string
}

export interface StudentMetrics {
  attendance_pct: number
  present_count: number
  absent_count: number
  total_days: number
  gpa: number
  avg_percentage: number
  balance_due: number
  total_invoiced: number
  total_paid: number
}

export interface TimetablePeriodItem {
  id: string
  day_of_week: number
  day_name: string
  day_code?: string
  period_label?: string
  start_time: string
  end_time: string
  subject_name: string
  subject_code?: string
  teacher_name: string
  room_number: string
}

export interface RecentGradeItem {
  id: string
  exam_id?: string
  exam_name: string
  subject_name: string
  marks_obtained: number
  max_marks: number
  percentage: number
  grade: string
  is_absent: boolean
  status?: string
}

export interface PortalAnnouncement {
  id: string
  title: string
  content: string
  published_at: string
  target_audience: string
}

export interface StudentDashboardResponse {
  student: StudentProfileData
  academic_placement: AcademicPlacement
  metrics: StudentMetrics
  timetable: TimetablePeriodItem[]
  recent_grades: RecentGradeItem[]
  announcements: PortalAnnouncement[]
}

export interface AttendanceRecordItem {
  id: string
  date: string
  formatted_date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  subject_name: string
  remarks?: string
}

export interface InvoiceLineItem {
  description: string
  amount: number
}

export interface PortalInvoiceItem {
  id: string
  invoice_number: string
  status: string
  total_amount: number
  paid_amount: number
  balance: number
  issue_date: string
  due_date: string
  lines: InvoiceLineItem[]
}

export class StudentPortalService {
  constructor(private client: BaseApiClient) {}

  public async getDashboard(): Promise<StudentDashboardResponse> {
    const res = await this.client.request<any>("/students/portal/dashboard/")
    return res.data || res
  }

  public async getTimetable(): Promise<TimetablePeriodItem[]> {
    const res = await this.client.request<any>("/students/portal/timetable/")
    return res.data || []
  }

  public async getAttendance(): Promise<AttendanceRecordItem[]> {
    const res = await this.client.request<any>("/students/portal/attendance/")
    return res.data || []
  }

  public async getGrades(): Promise<RecentGradeItem[]> {
    const res = await this.client.request<any>("/students/portal/grades/")
    return res.data || []
  }

  public async getInvoices(): Promise<PortalInvoiceItem[]> {
    const res = await this.client.request<any>("/students/portal/invoices/")
    return res.data || []
  }
}
