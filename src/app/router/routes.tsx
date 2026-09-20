import React from "react"
import { createBrowserRouter, Navigate } from "react-router-dom"
import { PublicLayout } from "../layouts/PublicLayout"
import { AuthLayout } from "../layouts/AuthLayout"
import { TenantLayout } from "../layouts/TenantLayout"
import { AppLayout } from "../layouts/AppLayout"

import { LandingPage } from "../../features/public/LandingPage"
import { LoginPage } from "../../features/auth/LoginPage"
import { ForgotPasswordPage } from "../../features/auth/ForgotPasswordPage"
import { DashboardPage } from "../../features/dashboard/DashboardPage"
import { StudentsPage } from "../../features/students/StudentsPage"
import { StaffPage } from "../../features/staff/StaffPage"
import { AcademicsPage } from "../../features/academics/AcademicsPage"
import { TimetablePage } from "../../features/timetable/TimetablePage"
import { AttendancePage } from "../../features/attendance/AttendancePage"
import { ExaminationsPage } from "../../features/examinations/ExaminationsPage"
import { FinancePage } from "../../features/finance/FinancePage"
import { CommunicationsPage } from "../../features/communications/CommunicationsPage"
import { LearningPage } from "../../features/learning/LearningPage"
import { ReportsPage } from "../../features/reports/ReportsPage"
import { SettingsPage } from "../../features/settings/SettingsPage"
import { AuditLogsPage } from "../../features/audit/AuditLogsPage"
import { InstitutionUsersPage } from "../../features/users/InstitutionUsersPage"

// Platform SuperAdmin Console Pages
import { AdminRoute } from "../../features/admin/AdminRoute"
import { AdminLayout } from "../../features/admin/AdminLayout"
import { AdminDashboardPage } from "../../features/admin/AdminDashboardPage"
import { AdminUsersPage } from "../../features/admin/AdminUsersPage"
import { AdminTenantsPage } from "../../features/admin/AdminTenantsPage"
import { AdminSubscriptionsPage } from "../../features/admin/AdminSubscriptionsPage"
import { AdminAuditLogsPage } from "../../features/admin/AdminAuditLogsPage"
import { AdminSystemPage } from "../../features/admin/AdminSystemPage"

// Student Academic Portal Pages
import { StudentLayout } from "../../features/student-portal/StudentLayout"
import { StudentDashboardPage } from "../../features/student-portal/StudentDashboardPage"
import { StudentTimetablePage } from "../../features/student-portal/StudentTimetablePage"
import { StudentAttendancePage } from "../../features/student-portal/StudentAttendancePage"
import { StudentGradesPage } from "../../features/student-portal/StudentGradesPage"
import { StudentFeesPage } from "../../features/student-portal/StudentFeesPage"
import { StudentAITutorPage } from "../../features/student-portal/StudentAITutorPage"

import { Button } from "../../components/ui/Button"
import { AlertTriangle, Home } from "lucide-react"

// 404 Not Found Page Component
const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
    <div className="p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 mb-4">
      <AlertTriangle className="w-12 h-12" />
    </div>
    <h1 className="text-3xl font-extrabold tracking-tight">404 — Page Not Found</h1>
    <p className="mt-2 text-sm text-slate-500 max-w-md">
      The requested educational module or page could not be located in this tenant workspace.
    </p>
    <a href="/app/dashboard" className="mt-6">
      <Button leftIcon={<Home className="w-4 h-4" />}>
        Return to Dashboard
      </Button>
    </a>
  </div>
)

export const router = createBrowserRouter([
  // Public Landing Layout
  {
    path: "/",
    element: <PublicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <LandingPage /> }
    ]
  },

  // Auth Layout (Login, Password Reset)
  {
    path: "/auth",
    element: <AuthLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> }
    ]
  },

  // Platform SuperAdmin Console (Protected for SuperUser / Root Admins)
  {
    path: "/admin",
    element: <AdminRoute />,
    errorElement: <NotFoundPage />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="/admin/dashboard" replace /> },
          { path: "dashboard", element: <AdminDashboardPage /> },
          { path: "users", element: <AdminUsersPage /> },
          { path: "tenants", element: <AdminTenantsPage /> },
          { path: "subscriptions", element: <AdminSubscriptionsPage /> },
          { path: "audit-logs", element: <AdminAuditLogsPage /> },
          { path: "system", element: <AdminSystemPage /> },
        ]
      }
    ]
  },

  // Authenticated Tenant App Layout
  {
    path: "/app",
    element: <TenantLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="/app/dashboard" replace /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "students", element: <StudentsPage /> },
          { path: "staff", element: <StaffPage /> },
          { path: "academics", element: <AcademicsPage /> },
          { path: "timetable", element: <TimetablePage /> },
          { path: "attendance", element: <AttendancePage /> },
          { path: "examinations", element: <ExaminationsPage /> },
          { path: "finance", element: <FinancePage /> },
          { path: "communications", element: <CommunicationsPage /> },
          { path: "learning", element: <LearningPage /> },
          { path: "reports", element: <ReportsPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "users", element: <InstitutionUsersPage /> },
          { path: "audit-logs", element: <AuditLogsPage /> },
        ]
      }
    ]
  },

  // Student Academic Portal (Dedicated Portal for Learners)
  {
    path: "/student",
    element: <StudentLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/student/dashboard" replace /> },
      { path: "dashboard", element: <StudentDashboardPage /> },
      { path: "timetable", element: <StudentTimetablePage /> },
      { path: "attendance", element: <StudentAttendancePage /> },
      { path: "grades", element: <StudentGradesPage /> },
      { path: "fees", element: <StudentFeesPage /> },
      { path: "ai-tutor", element: <StudentAITutorPage /> },
    ]
  },

  // Direct Conveniences & Redirects
  { path: "/login", element: <Navigate to="/auth/login" replace /> },
  { path: "/dashboard", element: <Navigate to="/app/dashboard" replace /> },

  // Catch-all
  {
    path: "*",
    element: <NotFoundPage />
  }
])
