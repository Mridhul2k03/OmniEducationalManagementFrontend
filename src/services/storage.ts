import { 
  Tenant, 
  User, 
  Student, 
  Staff, 
  CourseClass, 
  TimetableSlot, 
  Exam, 
  MarkRecord, 
  Invoice, 
  Announcement, 
  Assignment,
  AttendanceRecord,
  AttendanceStatus 
} from "../types"
import { 
  DEFAULT_TENANTS, 
  DEMO_USERS, 
  INITIAL_STUDENTS, 
  INITIAL_STAFF, 
  INITIAL_COURSES, 
  INITIAL_TIMETABLE, 
  INITIAL_EXAMS, 
  INITIAL_MARKS, 
  INITIAL_INVOICES, 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_ASSIGNMENTS 
} from "./mockData"

class AppStorageService {
  private tenants: Tenant[] = DEFAULT_TENANTS
  private users: User[] = DEMO_USERS
  private students: Student[] = INITIAL_STUDENTS
  private staff: Staff[] = INITIAL_STAFF
  private courses: CourseClass[] = INITIAL_COURSES
  private timetable: TimetableSlot[] = INITIAL_TIMETABLE
  private exams: Exam[] = INITIAL_EXAMS
  private marks: MarkRecord[] = INITIAL_MARKS
  private invoices: Invoice[] = INITIAL_INVOICES
  private announcements: Announcement[] = INITIAL_ANNOUNCEMENTS
  private assignments: Assignment[] = INITIAL_ASSIGNMENTS
  private attendanceRecords: AttendanceRecord[] = [
    { id: "att-1", studentId: "std-001", studentName: "Sophia Martinez", admissionNumber: "ADM-2024-001", classId: "CS-304", date: "2026-09-17", status: "present" },
    { id: "att-2", studentId: "std-002", studentName: "Liam Chen", admissionNumber: "ADM-2024-002", classId: "CS-304", date: "2026-09-17", status: "present" },
    { id: "att-3", studentId: "std-003", studentName: "Amara Okafor", admissionNumber: "ADM-2024-003", classId: "CS-304", date: "2026-09-17", status: "late", notes: "Transit delay" },
    { id: "att-4", studentId: "std-004", studentName: "Lucas Dubois", admissionNumber: "ADM-2024-004", classId: "CS-304", date: "2026-09-17", status: "present" },
    { id: "att-5", studentId: "std-005", studentName: "Zara Al-Mansoor", admissionNumber: "ADM-2024-005", classId: "CS-304", date: "2026-09-17", status: "present" },
    { id: "att-6", studentId: "std-006", studentName: "Ethan Hawkins", admissionNumber: "ADM-2024-006", classId: "CS-304", date: "2026-09-17", status: "absent", notes: "Unexcused" }
  ]

  private listeners: Set<() => void> = new Set()

  private notify() {
    this.listeners.forEach(cb => cb())
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  // Tenants
  public getTenants(): Tenant[] {
    return this.tenants
  }

  public getTenant(id: string): Tenant | undefined {
    return this.tenants.find(t => t.id === id) || this.tenants[0]
  }

  public updateTenant(updated: Tenant): void {
    this.tenants = this.tenants.map(t => t.id === updated.id ? updated : t)
    this.notify()
  }

  // Users
  public getUsers(): User[] {
    return this.users
  }

  // Students
  public getStudents(): Student[] {
    return this.students
  }

  public addStudent(studentData: Omit<Student, "id">): Student {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}`
    }
    this.students = [newStudent, ...this.students]
    this.notify()
    return newStudent
  }

  public updateStudent(id: string, updates: Partial<Student>): void {
    this.students = this.students.map(s => s.id === id ? { ...s, ...updates } : s)
    this.notify()
  }

  public deleteStudent(id: string): void {
    this.students = this.students.filter(s => s.id !== id)
    this.notify()
  }

  // Staff
  public getStaff(): Staff[] {
    return this.staff
  }

  public addStaff(staffData: Omit<Staff, "id">): Staff {
    const newStaff: Staff = {
      ...staffData,
      id: `stf-${Date.now()}`
    }
    this.staff = [newStaff, ...this.staff]
    this.notify()
    return newStaff
  }

  // Courses
  public getCourses(): CourseClass[] {
    return this.courses
  }

  // Timetable
  public getTimetable(): TimetableSlot[] {
    return this.timetable
  }

  // Exams
  public getExams(): Exam[] {
    return this.exams
  }

  // Marks
  public getMarks(examId?: string): MarkRecord[] {
    if (examId) return this.marks.filter(m => m.examId === examId)
    return this.marks
  }

  public updateMark(id: string, marksObtained: number, comments?: string): void {
    this.marks = this.marks.map(m => {
      if (m.id === id) {
        const pct = (marksObtained / m.maxMarks) * 100
        let grade = "F"
        let gpa = 0.0
        if (pct >= 93) { grade = "A+"; gpa = 4.0 }
        else if (pct >= 85) { grade = "A"; gpa = 3.8 }
        else if (pct >= 75) { grade = "B+"; gpa = 3.3 }
        else if (pct >= 65) { grade = "B"; gpa = 3.0 }
        else if (pct >= 50) { grade = "C"; gpa = 2.0 }
        
        return {
          ...m,
          marksObtained,
          grade,
          gpa,
          feedback: comments !== undefined ? comments : m.feedback
        }
      }
      return m
    })
    this.notify()
  }

  // Invoices
  public getInvoices(): Invoice[] {
    return this.invoices
  }

  public recordPayment(invoiceId: string, amount: number): void {
    this.invoices = this.invoices.map(inv => {
      if (inv.id === invoiceId) {
        const newPaid = inv.paidAmount + amount
        const newStatus = newPaid >= inv.amount ? "paid" : "partially_paid"
        return {
          ...inv,
          paidAmount: newPaid,
          status: newStatus
        }
      }
      return inv
    })
    this.notify()
  }

  // Announcements
  public getAnnouncements(): Announcement[] {
    return this.announcements
  }

  public addAnnouncement(announcementData: Omit<Announcement, "id" | "date">): Announcement {
    const newAnc: Announcement = {
      ...announcementData,
      id: `anc-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      isRead: false
    }
    this.announcements = [newAnc, ...this.announcements]
    this.notify()
    return newAnc
  }

  // Assignments
  public getAssignments(): Assignment[] {
    return this.assignments
  }

  // Attendance
  public getAttendance(classId: string, date: string): AttendanceRecord[] {
    const existing = this.attendanceRecords.filter(a => a.classId === classId && a.date === date)
    if (existing.length > 0) return existing

    // Generate for current students
    return this.students.map(std => ({
      id: `att-${std.id}-${date}`,
      studentId: std.id,
      studentName: `${std.firstName} ${std.lastName}`,
      admissionNumber: std.admissionNumber,
      classId,
      date,
      status: "present" as AttendanceStatus
    }))
  }

  public saveAttendance(records: AttendanceRecord[]): void {
    const otherRecords = this.attendanceRecords.filter(
      a => !records.some(r => r.classId === a.classId && r.date === a.date && r.studentId === a.studentId)
    )
    this.attendanceRecords = [...otherRecords, ...records]
    this.notify()
  }
}

export const appStorage = new AppStorageService()
