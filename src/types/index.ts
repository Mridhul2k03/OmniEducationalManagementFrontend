export type TenantType = 
  | 'university_college' 
  | 'k12_school' 
  | 'coaching_institute' 
  | 'online_academy'

export interface TerminologyConfig {
  learnerSingular: string
  learnerPlural: string
  educatorSingular: string
  educatorPlural: string
  classSingular: string
  classPlural: string
  programSingular: string
  programPlural: string
  termSingular: string
  termPlural: string
}

export interface Tenant {
  id: string
  slug?: string
  name: string
  code: string
  type: TenantType
  tagline: string
  logo?: string
  primaryColor: string
  currency: string
  timezone: string
  address: string
  subscriptionPlan: 'Starter' | 'Professional' | 'Enterprise'
  subscriptionStatus: 'active' | 'trial' | 'past_due'
  subscriptionExpiry: string
  maxLearners: number
  currentLearners: number
  terminology: TerminologyConfig
  features: {
    onlineExams: boolean
    financeModule: boolean
    timetableGenerator: boolean
    bulkSms: boolean
    parentPortal: boolean
  }
}

export type Role = 
  | 'institute_admin' 
  | 'faculty' 
  | 'student' 
  | 'guardian' 
  | 'accountant' 
  | 'super_admin'
  | 'superadmin'

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: Role
  tenantId: string
  department?: string
  assignedClasses?: string[]
  permissions: string[]
  is_superuser?: boolean
  is_staff?: boolean
}

export type StudentStatus = 'active' | 'graduated' | 'suspended' | 'transferred'

export interface Student {
  id: string
  admissionNumber: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  gender: 'male' | 'female' | 'other'
  dateOfBirth: string
  gradeOrProgram: string
  sectionOrBatch: string
  enrollmentDate: string
  status: StudentStatus
  guardianName: string
  guardianRelationship: string
  guardianContact: string
  outstandingBalance: number
  attendanceRate: number
  gpa?: number
}

export interface Staff {
  id: string
  staffNumber: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  roleTitle: string
  department: string
  designation: string
  joiningDate: string
  status: 'active' | 'on_leave'
  subjects: string[]
  phone: string
  weeklyHours: number
}

export interface AcademicProgram {
  id: string
  name: string
  code: string
  department: string
  durationYears: number
  creditsRequired: number
  activeLearners: number
  currentSemester: string
}

export interface CourseClass {
  id: string
  code: string
  name: string
  term: string
  instructorId: string
  instructorName: string
  room: string
  schedule: string
  enrolledCount: number
  capacity: number
  credits: number
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export interface AttendanceRecord {
  id: string
  studentId: string
  studentName: string
  admissionNumber: string
  classId: string
  date: string
  status: AttendanceStatus
  notes?: string
}

export interface TimetableSlot {
  id: string
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  startTime: string
  endTime: string
  courseName: string
  courseCode: string
  instructorName: string
  room: string
  batchName: string
}

export interface Exam {
  id: string
  name: string
  courseCode: string
  courseName: string
  term: string
  date: string
  time: string
  venue: string
  maxMarks: number
  passingMarks: number
  status: 'upcoming' | 'ongoing' | 'grading' | 'published'
}

export interface MarkRecord {
  id: string
  examId: string
  studentId: string
  studentName: string
  admissionNumber: string
  marksObtained: number
  maxMarks: number
  grade: string
  gpa: number
  status: 'draft' | 'submitted' | 'published'
  feedback?: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  studentId: string
  studentName: string
  admissionNumber: string
  title: string
  amount: number
  dueDate: string
  status: 'paid' | 'pending' | 'overdue' | 'partially_paid'
  paidAmount: number
  issueDate: string
  category: 'Tuition' | 'Lab Fee' | 'Library' | 'Examination' | 'Transport'
}

export interface Announcement {
  id: string
  title: string
  content: string
  author: string
  authorRole: string
  date: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  audience: 'all' | 'faculty' | 'students' | 'guardians'
  category: 'Academic' | 'Events' | 'Administrative' | 'Emergency'
  isRead?: boolean
}

export interface Assignment {
  id: string
  title: string
  courseCode: string
  courseName: string
  dueDate: string
  maxPoints: number
  submissionsCount: number
  totalEnrolled: number
  status: 'active' | 'past_due' | 'graded'
  description: string
}
