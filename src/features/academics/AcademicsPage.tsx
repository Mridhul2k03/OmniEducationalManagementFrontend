import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { CourseClass } from "../../types"
import { appStorage } from "../../services/storage"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card"
import { BookOpen, Layers, Users, Clock, Plus, CheckCircle2 } from "lucide-react"

function mapBackendClass(cls: any, idx: number): CourseClass {
  const sec = cls.sections?.[0]
  return {
    id: cls.id,
    code: `CS-${300 + idx}`,
    name: cls.name,
    term: cls.academic_year_name || "Fall 2026",
    instructorId: "fac-1",
    instructorName: "Dr. Arthur Pendelton",
    room: sec?.room_number || "Hall 402",
    schedule: "Mon/Wed 10:00 - 11:30 AM",
    enrolledCount: 38,
    capacity: sec?.capacity || 40,
    credits: 4,
  }
}

export const AcademicsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can } = useAuth()
  const [courses, setCourses] = useState<CourseClass[]>(() => appStorage.getCourses())

  useEffect(() => {
    api.academics.getClasses().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setCourses(res.map(mapBackendClass))
      }
    }).catch(() => {})
  }, [tenant.id])

  const academicSummary = [
    { title: `Active ${t("terms")}`, count: "Fall 2026", sub: "Aug 2026 - Dec 2026", icon: Clock },
    { title: `Offered ${t("programs")}`, count: "12 Tracks", sub: "Undergraduate & Graduate", icon: Layers },
    { title: `Scheduled ${t("classes")}`, count: `${courses.length} Active`, sub: "Across 4 departments", icon: BookOpen },
    { title: `Enrolled ${t("learners")}`, count: tenant.currentLearners.toLocaleString(), sub: "99.2% capacity", icon: Users },
  ]

  const columns: Column<CourseClass>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (c) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{c.code}</span>
    },
    {
      key: "name",
      header: `${t("class")} Name`,
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
          <p className="text-[11px] text-slate-400">{c.schedule} • {c.room}</p>
        </div>
      )
    },
    {
      key: "instructorName",
      header: `Assigned ${t("educator")}`,
      sortable: true,
      render: (c) => <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{c.instructorName}</span>
    },
    {
      key: "credits",
      header: "Credits / Wt",
      sortable: true,
      align: "center",
      render: (c) => <Badge variant="secondary">{c.credits} Credits</Badge>
    },
    {
      key: "enrolledCount",
      header: "Capacity",
      sortable: true,
      align: "right",
      render: (c) => {
        const pct = Math.round((c.enrolledCount / c.capacity) * 100)
        return (
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{c.enrolledCount}/{c.capacity}</span>
            <span className="block text-[10px] text-slate-400">{pct}% filled</span>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Academic Structure & {t("classes")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure {t("programs").toLowerCase()}, {t("terms").toLowerCase()}, course modules, and room quotas.
          </p>
        </div>

        {can("institute_admin") && (
          <Button leftIcon={<Plus className="w-4 h-4" />}>
            Create New {t("class")}
          </Button>
        )}
      </div>

      {/* Summary Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {academicSummary.map((item, idx) => {
          const Icon = item.icon
          return (
            <Card key={idx} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">{item.title}</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">{item.count}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Course Table */}
      <DataTable
        data={courses}
        columns={columns}
        searchPlaceholder={`Search by ${t("class").toLowerCase()} code or name...`}
        searchKeys={["code", "name", "instructorName", "room"]}
        exportFileName="academic-courses"
      />
    </div>
  )
}
