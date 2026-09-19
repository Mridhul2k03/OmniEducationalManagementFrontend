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
import { DEFAULT_TENANTS } from "./mockData"
import { api } from "./api"

class AppStorageService {
  private tenants: Tenant[] = DEFAULT_TENANTS
  private users: User[] = []
  private students: Student[] = []
  private staff: Staff[] = []
  private courses: CourseClass[] = []
  private timetable: TimetableSlot[] = []
  private exams: Exam[] = []
  private marks: MarkRecord[] = []
  private invoices: Invoice[] = []
  private announcements: Announcement[] = []
  private assignments: Assignment[] = []
  private attendanceRecords: AttendanceRecord[] = []

  private listeners: Set<() => void> = new Set()
  private isSyncing: boolean = false

  constructor() {
    this.syncWithBackend()
  }

  private notify() {
    this.listeners.forEach(cb => cb())
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  /**
   * Syncs local storage data with live Django backend endpoints
   */
  public async syncWithBackend(): Promise<void> {
    if (this.isSyncing) return
    this.isSyncing = true

    try {
      // 0. Fetch live tenants
      try {
        const backendTenants = await api.tenants.list()
        if (Array.isArray(backendTenants) && backendTenants.length > 0) {
          this.updateTenantsFromBackend(backendTenants)
        }
      } catch {
        // Continue if tenants endpoint fails
      }

      // 1. Fetch live students
      const backendStudents = await api.students.list()
      if (Array.isArray(backendStudents)) {
        this.students = backendStudents.map((s: any) => ({
          id: s.id,
          admissionNumber: s.admission_number,
          firstName: s.first_name,
          lastName: s.last_name,
          email: s.user?.email || `${s.first_name.toLowerCase()}.${s.last_name.toLowerCase()}@student.omni-edu.org`,
          avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
          gender: s.gender === "F" ? "female" : (s.gender === "M" ? "male" : "other"),
          dateOfBirth: s.date_of_birth,
          gradeOrProgram: s.current_class_name || "Academic Program",
          sectionOrBatch: s.current_section_name || "Section A",
          enrollmentDate: s.admission_date,
          status: (s.status === "enrolled" ? "active" : s.status) as any,
          guardianName: s.guardian_links?.[0]?.guardian_name || "Legal Guardian",
          guardianRelationship: s.guardian_links?.[0]?.relationship || "Guardian",
          guardianContact: s.guardian_links?.[0]?.phone_number || "+1 (555) 000-0000",
          outstandingBalance: 0,
          attendanceRate: 95,
          gpa: 3.8,
        }))
      }

      // 2. Fetch live staff
      const backendStaff = await api.staff.list()
      if (Array.isArray(backendStaff)) {
        this.staff = backendStaff.map((st: any) => ({
          id: st.id,
          staffNumber: st.employee_id || `FAC-${st.id.substring(0, 6)}`,
          firstName: st.full_name?.split(" ")[0] || "Staff",
          lastName: st.full_name?.split(" ").slice(1).join(" ") || "Member",
          email: st.email || "",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
          roleTitle: st.designation || "Faculty Member",
          department: st.department_name || "Academics",
          designation: st.designation || "Faculty",
          joiningDate: st.joined_date || new Date().toISOString().split("T")[0],
          status: st.status === "active" ? "active" : "on_leave",
          subjects: ["Core Curriculum"],
          phone: st.phone_number || "+1 (555) 000-0000",
          weeklyHours: 16,
        }))
      }

      // 3. Fetch live announcements
      const backendAnnouncements = await api.communications.getAnnouncements()
      if (Array.isArray(backendAnnouncements)) {
        this.announcements = backendAnnouncements.map((a: any) => ({
          id: a.id,
          title: a.title,
          content: a.content,
          author: a.author?.full_name || a.author?.email || "Administration",
          authorRole: "Administrator",
          date: a.published_at ? a.published_at.split("T")[0] : new Date().toISOString().split("T")[0],
          audience: (a.target_audience === "teachers" ? "faculty" : (a.target_audience || "all")) as any,
          priority: (a.priority === "urgent" ? "urgent" : (a.priority === "high" ? "high" : "normal")) as any,
          category: "Academic" as const,
          isRead: false,
        }))
      }

      // 4. Fetch live invoices
      const backendInvoices = await api.finance.getInvoices()
      if (Array.isArray(backendInvoices)) {
        this.invoices = backendInvoices.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          studentId: inv.student?.id || (typeof inv.student === "string" ? inv.student : ""),
          studentName: inv.student?.full_name || "Enrolled Student",
          admissionNumber: inv.student?.admission_number || "ADM",
          title: inv.lines?.[0]?.description || "Institutional Fee",
          amount: parseFloat(inv.total_amount || 0),
          paidAmount: parseFloat(inv.paid_amount || 0),
          dueDate: inv.due_date,
          issueDate: inv.created_at ? inv.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
          status: (inv.status === "paid" ? "paid" : (inv.status === "partially_paid" ? "partially_paid" : (inv.status === "overdue" ? "overdue" : "pending"))) as any,
          category: "Tuition" as const,
        }))
      }

      // 5. Fetch live exams
      const backendExams = await api.examinations.getExams()
      if (Array.isArray(backendExams)) {
        this.exams = backendExams.map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          courseCode: ex.academic_year_name || "ACAD",
          courseName: ex.name,
          term: ex.term_name || "Current Term",
          date: ex.start_date || new Date().toISOString().split("T")[0],
          time: "09:00 - 12:00",
          venue: "Main Hall",
          maxMarks: 100,
          passingMarks: 50,
          status: (ex.status === "published" ? "published" : (ex.status === "completed" ? "grading" : "upcoming")) as any,
        }))
      }

      this.notify()
    } catch {
      // Backend not running or error
    } finally {
      this.isSyncing = false
    }
  }

  public updateTenantsFromBackend(backendTenants: any[]): void {
    if (!Array.isArray(backendTenants) || backendTenants.length === 0) return

    const currentTenants = [...this.tenants]
    const updated: Tenant[] = currentTenants.map(loc => {
      const match = backendTenants.find(bt => bt.id === loc.id || bt.slug === loc.slug || bt.slug === loc.id)
      if (match) {
        return {
          ...loc,
          id: match.id,
          slug: match.slug || loc.slug,
          name: match.name || loc.name,
          currency: match.currency || loc.currency,
          timezone: match.timezone || loc.timezone,
        }
      }
      return loc
    })

    backendTenants.forEach(bt => {
      const alreadyExists = updated.some(u => u.id === bt.id || u.slug === bt.slug)
      if (!alreadyExists) {
        const instType = bt.institution_type || "university_college"
        const isSchool = instType === "school" || instType === "k12_school"
        const isCoaching = instType === "coaching" || instType === "coaching_institute"

        updated.push({
          id: bt.id,
          slug: bt.slug || bt.id,
          name: bt.name,
          code: bt.slug ? bt.slug.substring(0, 4).toUpperCase() : "INST",
          type: (instType as any) || "university_college",
          tagline: "Educational Excellence",
          primaryColor: isSchool ? "#059669" : (isCoaching ? "#d97706" : "#4f46e5"),
          currency: bt.currency || "USD",
          timezone: bt.timezone || "UTC",
          address: bt.address || "Campus Way",
          subscriptionPlan: bt.subscription_reference || "Enterprise",
          subscriptionStatus: "active",
          subscriptionExpiry: "2027-12-31",
          maxLearners: 5000,
          currentLearners: bt.students_count || 0,
          terminology: isSchool ? {
            learnerSingular: "Student",
            learnerPlural: "Students",
            educatorSingular: "Teacher",
            educatorPlural: "Teachers",
            classSingular: "Class",
            classPlural: "Classes",
            programSingular: "Grade",
            programPlural: "Grades",
            termSingular: "Term",
            termPlural: "Terms"
          } : (isCoaching ? {
            learnerSingular: "Student",
            learnerPlural: "Students",
            educatorSingular: "Mentor",
            educatorPlural: "Mentors",
            classSingular: "Batch",
            classPlural: "Batches",
            programSingular: "Subject",
            programPlural: "Subjects",
            termSingular: "Session",
            termPlural: "Sessions"
          } : {
            learnerSingular: "Student",
            learnerPlural: "Students",
            educatorSingular: "Professor",
            educatorPlural: "Faculty",
            classSingular: "Course",
            classPlural: "Courses",
            programSingular: "Program",
            programPlural: "Programs",
            termSingular: "Semester",
            termPlural: "Semesters"
          }),
          features: {
            onlineExams: true,
            financeModule: true,
            timetableGenerator: true,
            bulkSms: true,
            parentPortal: true
          }
        })
      }
    })

    this.tenants = updated
  }

  // Tenants
  public getTenants(): Tenant[] {
    return this.tenants
  }

  public setTenants(tenants: Tenant[]): void {
    this.tenants = tenants
    this.notify()
  }

  public getTenant(id: string): Tenant | undefined {
    return this.tenants.find(t => t.id === id || t.slug === id) || this.tenants[0]
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

    api.students.update(id, {
      first_name: updates.firstName,
      last_name: updates.lastName,
    }).catch(() => {})
  }

  public deleteStudent(id: string): void {
    this.students = this.students.filter(s => s.id !== id)
    this.notify()

    api.students.delete(id).catch(() => {})
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

  public setCourses(courses: CourseClass[]): void {
    this.courses = courses
    this.notify()
  }

  // Timetable
  public getTimetable(): TimetableSlot[] {
    return this.timetable
  }

  // Exams
  public getExams(): Exam[] {
    return this.exams
  }

  public setExams(exams: Exam[]): void {
    this.exams = exams
    this.notify()
  }

  // Marks
  public getMarks(examId?: string): MarkRecord[] {
    if (examId) return this.marks.filter(m => m.examId === examId)
    return this.marks
  }

  public setMarks(marks: MarkRecord[]): void {
    this.marks = marks
    this.notify()
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

    api.finance.recordPayment({
      invoice_id: invoiceId,
      amount,
      payment_method: "card",
    }).catch(() => {})
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

    api.communications.createAnnouncement({
      title: announcementData.title,
      content: announcementData.content,
      target_audience: announcementData.audience === "faculty" ? "teachers" : (announcementData.audience || "all"),
    }).catch(() => {})

    return newAnc
  }

  // Assignments
  public getAssignments(): Assignment[] {
    return this.assignments
  }

  // Attendance
  public getAttendance(classId: string, date: string): AttendanceRecord[] {
    return this.attendanceRecords.filter(a => a.classId === classId && a.date === date)
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
