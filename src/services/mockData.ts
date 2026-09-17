import { Tenant, User, Student, Staff, CourseClass, TimetableSlot, Exam, MarkRecord, Invoice, Announcement, Assignment } from "../types"

export const DEFAULT_TENANTS: Tenant[] = [
  {
    id: "oxford-crest",
    name: "Oxford Crest University",
    code: "OCU",
    type: "university_college",
    tagline: "Empowering Next-Generation Innovators & Leaders",
    primaryColor: "#4f46e5",
    currency: "USD",
    timezone: "America/New_York",
    address: "420 Academic Way, Cambridge, MA",
    subscriptionPlan: "Enterprise",
    subscriptionStatus: "active",
    subscriptionExpiry: "2027-12-31",
    maxLearners: 5000,
    currentLearners: 3420,
    terminology: {
      learnerSingular: "Student",
      learnerPlural: "Students",
      educatorSingular: "Professor",
      educatorPlural: "Faculty",
      classSingular: "Course",
      classPlural: "Courses",
      programSingular: "Degree Program",
      programPlural: "Degree Programs",
      termSingular: "Semester",
      termPlural: "Semesters"
    },
    features: {
      onlineExams: true,
      financeModule: true,
      timetableGenerator: true,
      bulkSms: true,
      parentPortal: true
    }
  },
  {
    id: "horizon-stem",
    name: "Horizon International STEM School",
    code: "HISS",
    type: "k12_school",
    tagline: "Nurturing Curious Minds & Future Thinkers",
    primaryColor: "#059669",
    currency: "EUR",
    timezone: "Europe/Berlin",
    address: "18 Kepler Strasse, Munich, Germany",
    subscriptionPlan: "Professional",
    subscriptionStatus: "active",
    subscriptionExpiry: "2027-06-30",
    maxLearners: 1200,
    currentLearners: 840,
    terminology: {
      learnerSingular: "Pupil",
      learnerPlural: "Pupils",
      educatorSingular: "Teacher",
      educatorPlural: "Teachers",
      classSingular: "Class",
      classPlural: "Classes",
      programSingular: "Grade Level",
      programPlural: "Grade Levels",
      termSingular: "Term",
      termPlural: "Terms"
    },
    features: {
      onlineExams: true,
      financeModule: true,
      timetableGenerator: true,
      bulkSms: true,
      parentPortal: true
    }
  },
  {
    id: "apex-coaching",
    name: "Apex Elite Prep & Coaching",
    code: "APEX",
    type: "coaching_institute",
    tagline: "Top Rank Accelerators for Competitive Exams",
    primaryColor: "#d97706",
    currency: "INR",
    timezone: "Asia/Kolkata",
    address: "704 Innovation Towers, Bengaluru, India",
    subscriptionPlan: "Professional",
    subscriptionStatus: "active",
    subscriptionExpiry: "2026-11-15",
    maxLearners: 2500,
    currentLearners: 1850,
    terminology: {
      learnerSingular: "Aspirant",
      learnerPlural: "Aspirants",
      educatorSingular: "Mentor",
      educatorPlural: "Mentors",
      classSingular: "Batch",
      classPlural: "Batches",
      programSingular: "Target Track",
      programPlural: "Target Tracks",
      termSingular: "Phase",
      termPlural: "Phases"
    },
    features: {
      onlineExams: true,
      financeModule: true,
      timetableGenerator: true,
      bulkSms: true,
      parentPortal: false
    }
  }
]

export const DEMO_USERS: User[] = [
  {
    id: "u-admin",
    name: "Dr. Eleanor Vance",
    email: "eleanor.vance@omni-edu.org",
    role: "institute_admin",
    tenantId: "oxford-crest",
    department: "Executive Administration",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    permissions: ["*"]
  },
  {
    id: "u-faculty",
    name: "Prof. Arthur Pendelton",
    email: "arthur.pendelton@omni-edu.org",
    role: "faculty",
    tenantId: "oxford-crest",
    department: "Computer Science & AI",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    assignedClasses: ["CS-101", "CS-304"],
    permissions: ["view:all", "edit:attendance", "edit:marks", "create:announcements"]
  },
  {
    id: "u-student",
    name: "Sophia Martinez",
    email: "sophia.martinez@student.omni-edu.org",
    role: "student",
    tenantId: "oxford-crest",
    department: "Computer Science",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    permissions: ["view:enrolled", "view:grades", "submit:assignments"]
  },
  {
    id: "u-accountant",
    name: "Marcus Sterling",
    email: "marcus.sterling@omni-edu.org",
    role: "accountant",
    tenantId: "oxford-crest",
    department: "Bursar's Office",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    permissions: ["view:finance", "edit:invoices", "create:payments", "export:reports"]
  }
]

export const INITIAL_STUDENTS: Student[] = [
  {
    id: "std-001",
    admissionNumber: "ADM-2024-001",
    firstName: "Sophia",
    lastName: "Martinez",
    email: "sophia.martinez@student.omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    gender: "female",
    dateOfBirth: "2003-05-14",
    gradeOrProgram: "B.Sc. Computer Science",
    sectionOrBatch: "Cohort A - Year 3",
    enrollmentDate: "2022-09-01",
    status: "active",
    guardianName: "Carlos Martinez",
    guardianRelationship: "Father",
    guardianContact: "+1 (555) 234-5678",
    outstandingBalance: 0,
    attendanceRate: 96.4,
    gpa: 3.85
  },
  {
    id: "std-002",
    admissionNumber: "ADM-2024-002",
    firstName: "Liam",
    lastName: "Chen",
    email: "liam.chen@student.omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80",
    gender: "male",
    dateOfBirth: "2002-11-20",
    gradeOrProgram: "B.Sc. Computer Science",
    sectionOrBatch: "Cohort A - Year 3",
    enrollmentDate: "2022-09-01",
    status: "active",
    guardianName: "Mei Chen",
    guardianRelationship: "Mother",
    guardianContact: "+1 (555) 345-6789",
    outstandingBalance: 450,
    attendanceRate: 92.1,
    gpa: 3.72
  },
  {
    id: "std-003",
    admissionNumber: "ADM-2024-003",
    firstName: "Amara",
    lastName: "Okafor",
    email: "amara.okafor@student.omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    gender: "female",
    dateOfBirth: "2003-02-10",
    gradeOrProgram: "B.Eng. Robotics & Automation",
    sectionOrBatch: "Cohort B - Year 2",
    enrollmentDate: "2023-09-01",
    status: "active",
    guardianName: "Emeka Okafor",
    guardianRelationship: "Father",
    guardianContact: "+1 (555) 456-7890",
    outstandingBalance: 1200,
    attendanceRate: 88.5,
    gpa: 3.91
  },
  {
    id: "std-004",
    admissionNumber: "ADM-2024-004",
    firstName: "Lucas",
    lastName: "Dubois",
    email: "lucas.dubois@student.omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    gender: "male",
    dateOfBirth: "2004-08-25",
    gradeOrProgram: "B.A. Economics & Finance",
    sectionOrBatch: "Cohort C - Year 1",
    enrollmentDate: "2024-09-01",
    status: "active",
    guardianName: "Claire Dubois",
    guardianRelationship: "Mother",
    guardianContact: "+1 (555) 567-8901",
    outstandingBalance: 0,
    attendanceRate: 98.0,
    gpa: 3.65
  },
  {
    id: "std-005",
    admissionNumber: "ADM-2024-005",
    firstName: "Zara",
    lastName: "Al-Mansoor",
    email: "zara.almansoor@student.omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    gender: "female",
    dateOfBirth: "2003-07-03",
    gradeOrProgram: "B.Sc. Data Science",
    sectionOrBatch: "Cohort A - Year 3",
    enrollmentDate: "2022-09-01",
    status: "active",
    guardianName: "Tariq Al-Mansoor",
    guardianRelationship: "Father",
    guardianContact: "+1 (555) 678-9012",
    outstandingBalance: 0,
    attendanceRate: 94.8,
    gpa: 3.96
  },
  {
    id: "std-006",
    admissionNumber: "ADM-2024-006",
    firstName: "Ethan",
    lastName: "Hawkins",
    email: "ethan.hawkins@student.omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80",
    gender: "male",
    dateOfBirth: "2002-04-18",
    gradeOrProgram: "B.Sc. Computer Science",
    sectionOrBatch: "Cohort A - Year 3",
    enrollmentDate: "2022-09-01",
    status: "suspended",
    guardianName: "Patricia Hawkins",
    guardianRelationship: "Mother",
    guardianContact: "+1 (555) 789-0123",
    outstandingBalance: 2400,
    attendanceRate: 64.2,
    gpa: 2.30
  }
]

export const INITIAL_STAFF: Staff[] = [
  {
    id: "stf-001",
    staffNumber: "FAC-101",
    firstName: "Arthur",
    lastName: "Pendelton",
    email: "arthur.pendelton@omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
    roleTitle: "Professor & Chair",
    department: "Computer Science & AI",
    designation: "Senior Faculty",
    joiningDate: "2018-08-15",
    status: "active",
    subjects: ["Distributed Systems", "Artificial Intelligence", "Advanced Algorithms"],
    phone: "+1 (555) 890-1234",
    weeklyHours: 18
  },
  {
    id: "stf-002",
    staffNumber: "FAC-102",
    firstName: "Dr. Brenda",
    lastName: "Vogel",
    email: "brenda.vogel@omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80",
    roleTitle: "Associate Professor",
    department: "Mathematics & Statistics",
    designation: "Department Lead",
    joiningDate: "2019-01-10",
    status: "active",
    subjects: ["Linear Algebra", "Applied Probability", "Discrete Math"],
    phone: "+1 (555) 901-2345",
    weeklyHours: 20
  },
  {
    id: "stf-003",
    staffNumber: "FAC-103",
    firstName: "Gregory",
    lastName: "Nakamura",
    email: "gregory.nakamura@omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    roleTitle: "Assistant Professor",
    department: "Robotics & Hardware",
    designation: "Faculty Mentor",
    joiningDate: "2021-09-01",
    status: "active",
    subjects: ["Embedded Systems", "Sensors & Actuators", "Circuit Design"],
    phone: "+1 (555) 012-3456",
    weeklyHours: 16
  },
  {
    id: "stf-004",
    staffNumber: "FAC-104",
    firstName: "Elena",
    lastName: "Rostova",
    email: "elena.rostova@omni-edu.org",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    roleTitle: "Lecturer",
    department: "Business & Management",
    designation: "Lecturer",
    joiningDate: "2022-02-01",
    status: "on_leave",
    subjects: ["Corporate Finance", "Strategic Leadership", "Macroeconomics"],
    phone: "+1 (555) 123-4567",
    weeklyHours: 14
  }
]

export const INITIAL_COURSES: CourseClass[] = [
  {
    id: "CS-101",
    code: "CS-101",
    name: "Foundations of Computer Science",
    term: "Fall 2026",
    instructorId: "stf-001",
    instructorName: "Prof. Arthur Pendelton",
    room: "Turing Hall 204",
    schedule: "Mon, Wed 09:00 - 10:30",
    enrolledCount: 65,
    capacity: 70,
    credits: 4
  },
  {
    id: "CS-304",
    code: "CS-304",
    name: "Machine Learning & Neural Nets",
    term: "Fall 2026",
    instructorId: "stf-001",
    instructorName: "Prof. Arthur Pendelton",
    room: "Lovelace Lab 102",
    schedule: "Tue, Thu 11:00 - 12:30",
    enrolledCount: 42,
    capacity: 45,
    credits: 4
  },
  {
    id: "MATH-202",
    code: "MATH-202",
    name: "Applied Linear Algebra & Optimization",
    term: "Fall 2026",
    instructorId: "stf-002",
    instructorName: "Dr. Brenda Vogel",
    room: "Euler Complex 310",
    schedule: "Mon, Wed, Fri 14:00 - 15:00",
    enrolledCount: 58,
    capacity: 60,
    credits: 3
  },
  {
    id: "ENG-210",
    code: "ENG-210",
    name: "Robotics Micro-controllers & Firmware",
    term: "Fall 2026",
    instructorId: "stf-003",
    instructorName: "Prof. Gregory Nakamura",
    room: "MakerSpace Lab A",
    schedule: "Fri 10:00 - 13:00",
    enrolledCount: 28,
    capacity: 30,
    credits: 4
  }
]

export const INITIAL_TIMETABLE: TimetableSlot[] = [
  {
    id: "tt-1",
    dayOfWeek: "Monday",
    startTime: "09:00",
    endTime: "10:30",
    courseName: "Foundations of Computer Science",
    courseCode: "CS-101",
    instructorName: "Prof. Arthur Pendelton",
    room: "Turing Hall 204",
    batchName: "Cohort A - Year 3"
  },
  {
    id: "tt-2",
    dayOfWeek: "Monday",
    startTime: "14:00",
    endTime: "15:30",
    courseName: "Applied Linear Algebra & Optimization",
    courseCode: "MATH-202",
    instructorName: "Dr. Brenda Vogel",
    room: "Euler Complex 310",
    batchName: "Cohort A - Year 3"
  },
  {
    id: "tt-3",
    dayOfWeek: "Tuesday",
    startTime: "11:00",
    endTime: "12:30",
    courseName: "Machine Learning & Neural Nets",
    courseCode: "CS-304",
    instructorName: "Prof. Arthur Pendelton",
    room: "Lovelace Lab 102",
    batchName: "Cohort A - Year 3"
  },
  {
    id: "tt-4",
    dayOfWeek: "Wednesday",
    startTime: "09:00",
    endTime: "10:30",
    courseName: "Foundations of Computer Science",
    courseCode: "CS-101",
    instructorName: "Prof. Arthur Pendelton",
    room: "Turing Hall 204",
    batchName: "Cohort A - Year 3"
  },
  {
    id: "tt-5",
    dayOfWeek: "Thursday",
    startTime: "11:00",
    endTime: "12:30",
    courseName: "Machine Learning & Neural Nets",
    courseCode: "CS-304",
    instructorName: "Prof. Arthur Pendelton",
    room: "Lovelace Lab 102",
    batchName: "Cohort A - Year 3"
  },
  {
    id: "tt-6",
    dayOfWeek: "Friday",
    startTime: "10:00",
    endTime: "13:00",
    courseName: "Robotics Micro-controllers & Firmware",
    courseCode: "ENG-210",
    instructorName: "Prof. Gregory Nakamura",
    room: "MakerSpace Lab A",
    batchName: "Cohort B - Year 2"
  }
]

export const INITIAL_EXAMS: Exam[] = [
  {
    id: "ex-1",
    name: "Mid-Term Examination 2026",
    courseCode: "CS-304",
    courseName: "Machine Learning & Neural Nets",
    term: "Fall 2026",
    date: "2026-10-15",
    time: "09:00 - 12:00",
    venue: "Main Auditorium Hall A",
    maxMarks: 100,
    passingMarks: 50,
    status: "published"
  },
  {
    id: "ex-2",
    name: "Linear Algebra Assessment II",
    courseCode: "MATH-202",
    courseName: "Applied Linear Algebra",
    term: "Fall 2026",
    date: "2026-10-22",
    time: "14:00 - 16:30",
    venue: "Euler Hall 301",
    maxMarks: 100,
    passingMarks: 50,
    status: "grading"
  },
  {
    id: "ex-3",
    name: "Robotics Practical & Project Viva",
    courseCode: "ENG-210",
    courseName: "Robotics Micro-controllers",
    term: "Fall 2026",
    date: "2026-11-05",
    time: "10:00 - 15:00",
    venue: "Engineering Lab 4",
    maxMarks: 100,
    passingMarks: 50,
    status: "upcoming"
  }
]

export const INITIAL_MARKS: MarkRecord[] = [
  {
    id: "mrk-1",
    examId: "ex-1",
    studentId: "std-001",
    studentName: "Sophia Martinez",
    admissionNumber: "ADM-2024-001",
    marksObtained: 96,
    maxMarks: 100,
    grade: "A+",
    gpa: 4.0,
    status: "published",
    feedback: "Exceptional mastery of transformer architectures and backprop algorithms."
  },
  {
    id: "mrk-2",
    examId: "ex-1",
    studentId: "std-002",
    studentName: "Liam Chen",
    admissionNumber: "ADM-2024-002",
    marksObtained: 88,
    maxMarks: 100,
    grade: "A-",
    gpa: 3.7,
    status: "published",
    feedback: "Solid practical implementations; review gradient clipping derivations."
  },
  {
    id: "mrk-3",
    examId: "ex-1",
    studentId: "std-003",
    studentName: "Amara Okafor",
    admissionNumber: "ADM-2024-003",
    marksObtained: 92,
    maxMarks: 100,
    grade: "A",
    gpa: 3.9,
    status: "published",
    feedback: "Brilliant insight into recurrent vs attention mechanisms."
  },
  {
    id: "mrk-4",
    examId: "ex-1",
    studentId: "std-005",
    studentName: "Zara Al-Mansoor",
    admissionNumber: "ADM-2024-005",
    marksObtained: 99,
    maxMarks: 100,
    grade: "A+",
    gpa: 4.0,
    status: "published",
    feedback: "Top score in batch. Flawless mathematical proofs."
  }
]

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: "inv-001",
    invoiceNumber: "INV-2026-8801",
    studentId: "std-001",
    studentName: "Sophia Martinez",
    admissionNumber: "ADM-2024-001",
    title: "Semester 5 Tuition & Innovation Lab Fee",
    amount: 3200,
    dueDate: "2026-09-30",
    status: "paid",
    paidAmount: 3200,
    issueDate: "2026-08-15",
    category: "Tuition"
  },
  {
    id: "inv-002",
    invoiceNumber: "INV-2026-8802",
    studentId: "std-002",
    studentName: "Liam Chen",
    admissionNumber: "ADM-2024-002",
    title: "Semester 5 Tuition Fee (Installment 1)",
    amount: 1600,
    dueDate: "2026-10-05",
    status: "partially_paid",
    paidAmount: 1150,
    issueDate: "2026-08-15",
    category: "Tuition"
  },
  {
    id: "inv-003",
    invoiceNumber: "INV-2026-8803",
    studentId: "std-003",
    studentName: "Amara Okafor",
    admissionNumber: "ADM-2024-003",
    title: "Robotics Hardware Lab & Workshop Kit Fee",
    amount: 1200,
    dueDate: "2026-10-10",
    status: "pending",
    paidAmount: 0,
    issueDate: "2026-09-01",
    category: "Lab Fee"
  },
  {
    id: "inv-004",
    invoiceNumber: "INV-2026-8804",
    studentId: "std-006",
    studentName: "Ethan Hawkins",
    admissionNumber: "ADM-2024-006",
    title: "Semester 4 Overdue Balance & Library Fine",
    amount: 2400,
    dueDate: "2026-08-01",
    status: "overdue",
    paidAmount: 0,
    issueDate: "2026-07-01",
    category: "Tuition"
  }
]

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "anc-1",
    title: "Fall Semester 2026 Convocation & Research Symposium",
    content: "We are thrilled to announce keynote speaker Dr. Samantha Hayes from DeepMind for our Annual Research Symposium. Submissions for student project showcases close October 12th.",
    author: "Office of the Vice Chancellor",
    authorRole: "Administration",
    date: "2026-09-15",
    priority: "high",
    audience: "all",
    category: "Academic",
    isRead: false
  },
  {
    id: "anc-2",
    title: "Mid-Term Examination Schedule Released",
    content: "The master timetable for Fall 2026 examinations is now published in the Examinations Portal. Please review your venue and time allocations.",
    author: "Registrar & Examination Board",
    authorRole: "Registrar",
    date: "2026-09-12",
    priority: "urgent",
    audience: "students",
    category: "Academic",
    isRead: true
  },
  {
    id: "anc-3",
    title: "Campus High-Speed WiFi Upgrade Maintenance Window",
    content: "Infrastructure upgrade scheduled for Saturday 02:00 AM - 06:00 AM. Cloud LMS and portal services will remain available without interruption.",
    author: "Campus IT Services",
    authorRole: "IT Dept",
    date: "2026-09-10",
    priority: "normal",
    audience: "all",
    category: "Administrative",
    isRead: true
  }
]

export const INITIAL_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-1",
    title: "Implementing Multi-Head Attention from Scratch",
    courseCode: "CS-304",
    courseName: "Machine Learning & Neural Nets",
    dueDate: "2026-10-02",
    maxPoints: 100,
    submissionsCount: 38,
    totalEnrolled: 42,
    status: "active",
    description: "Write PyTorch vectorized self-attention mechanisms and benchmark vs torch.nn.MultiheadAttention on the IMDb sentiment dataset."
  },
  {
    id: "asg-2",
    title: "Convex Optimization Problem Set #3",
    courseCode: "MATH-202",
    courseName: "Applied Linear Algebra",
    dueDate: "2026-09-28",
    maxPoints: 50,
    submissionsCount: 54,
    totalEnrolled: 58,
    status: "active",
    description: "Derive Karush-Kuhn-Tucker (KKT) conditions for constrained quadratic programming problems."
  },
  {
    id: "asg-3",
    title: "PID Controller Firmware on ARM Cortex-M4",
    courseCode: "ENG-210",
    courseName: "Robotics Micro-controllers",
    dueDate: "2026-09-20",
    maxPoints: 80,
    submissionsCount: 28,
    totalEnrolled: 28,
    status: "graded",
    description: "Calibrate tuning parameters for velocity regulation of brushless DC motor."
  }
]
