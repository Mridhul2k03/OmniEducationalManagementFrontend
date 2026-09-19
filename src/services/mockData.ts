import { Tenant, User, Student, Staff, CourseClass, TimetableSlot, Exam, MarkRecord, Invoice, Announcement, Assignment } from "../types"

export const DEFAULT_TENANTS: Tenant[] = [
  {
    id: "7d18388a-872b-4d2b-b42a-f658c03e9e60",
    slug: "oxford-crest",
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
    currentLearners: 0,
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
    id: "eb09a450-291b-4c7b-a5c1-3109c9f0ddd9",
    slug: "horizon-stem",
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
    currentLearners: 0,
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
    id: "e50de766-6536-47e8-8fd0-229678f632fb",
    slug: "apex-coaching",
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
    currentLearners: 0,
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

export const DEMO_USERS: User[] = []
export const INITIAL_STUDENTS: Student[] = []
export const INITIAL_STAFF: Staff[] = []
export const INITIAL_COURSES: CourseClass[] = []
export const INITIAL_TIMETABLE: TimetableSlot[] = []
export const INITIAL_EXAMS: Exam[] = []
export const INITIAL_MARKS: MarkRecord[] = []
export const INITIAL_INVOICES: Invoice[] = []
export const INITIAL_ANNOUNCEMENTS: Announcement[] = []
export const INITIAL_ASSIGNMENTS: Assignment[] = []
