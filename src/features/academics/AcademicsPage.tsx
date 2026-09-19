import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { api } from "../../services/api"
import { DataTable, Column } from "../../components/tables/DataTable"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { Card, CardContent } from "../../components/ui/Card"
import { 
  BookOpen, 
  Layers, 
  Users, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Calendar,
  Grid
} from "lucide-react"

export const AcademicsPage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can, user } = useAuth()
  
  const [activeTab, setActiveTab] = useState<"courses" | "classes" | "sections" | "subjects" | "years">("classes")
  const [courses, setCourses] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [itemToEdit, setItemToEdit] = useState<any | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    credits: 4,
    subject_type: "theory",
    academic_year_id: "",
    course_id: "",
    class_cohort_id: "",
    room_number: "",
    capacity: 40,
    start_date: "2026-09-01",
    end_date: "2027-06-30",
    is_current: true,
  })

  const canManage = can("institute_admin") || can("academics.manage") || user?.is_superuser

  const loadAllAcademics = async () => {
    setIsLoading(true)
    try {
      const [coursesRes, classesRes, sectionsRes, subjectsRes, yearsRes] = await Promise.all([
        api.academics.getCourses(),
        api.academics.getClasses(),
        api.academics.getSections(),
        api.academics.getSubjects(),
        api.academics.getYears(),
      ])

      setCourses(Array.isArray(coursesRes) ? coursesRes : [])
      setClasses(Array.isArray(classesRes) ? classesRes : [])
      setSections(Array.isArray(sectionsRes) ? sectionsRes : [])
      setSubjects(Array.isArray(subjectsRes) ? subjectsRes : [])
      setAcademicYears(Array.isArray(yearsRes) ? yearsRes : [])
    } catch (err) {
      console.warn("Could not load academics:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAllAcademics()
  }, [tenant.id, tenant.slug])

  const handleOpenCreate = () => {
    setFormError("")
    setFormSuccess("")
    setFormData({
      name: "",
      code: "",
      credits: 4,
      subject_type: "theory",
      academic_year_id: academicYears[0]?.id || "",
      course_id: courses[0]?.id || "",
      class_cohort_id: classes[0]?.id || "",
      room_number: "",
      capacity: 40,
      start_date: "2026-09-01",
      end_date: "2027-06-30",
      is_current: true,
    })
    setIsCreateModalOpen(true)
  }

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setFormError("Name field is required.")
      return
    }

    setIsSubmitting(true)
    setFormError("")
    try {
      if (activeTab === "courses") {
        await api.academics.createCourse({
          name: formData.name.trim(),
          code: formData.code.trim() || `CRS-${Date.now().toString().slice(-4)}`,
          credits: Number(formData.credits) || 4,
        })
      } else if (activeTab === "classes") {
        await api.academics.createClass({
          name: formData.name.trim(),
          academic_year: formData.academic_year_id || academicYears[0]?.id,
          course: formData.course_id || undefined,
        })
      } else if (activeTab === "sections") {
        await api.academics.createSection({
          name: formData.name.trim(),
          class_cohort: formData.class_cohort_id || classes[0]?.id,
          room_number: formData.room_number.trim(),
          capacity: Number(formData.capacity) || 40,
        })
      } else if (activeTab === "subjects") {
        await api.academics.createSubject({
          name: formData.name.trim(),
          code: formData.code.trim() || `SUBJ-${Date.now().toString().slice(-4)}`,
          subject_type: formData.subject_type,
        })
      } else if (activeTab === "years") {
        await api.academics.createYear({
          name: formData.name.trim(),
          start_date: formData.start_date,
          end_date: formData.end_date,
          is_current: formData.is_current,
        })
      }

      setFormSuccess("Record created successfully!")
      await loadAllAcademics()
      setTimeout(() => {
        setIsCreateModalOpen(false)
        setFormSuccess("")
      }, 1000)
    } catch (err: any) {
      setFormError(err.message || "Failed to create record.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (item: any) => {
    setItemToEdit(item)
    setFormError("")
    setFormSuccess("")
    setFormData({
      name: item.name || "",
      code: item.code || "",
      credits: item.credits || 4,
      subject_type: item.subject_type || "theory",
      academic_year_id: item.academic_year || "",
      course_id: item.course || "",
      class_cohort_id: item.class_cohort || "",
      room_number: item.room_number || "",
      capacity: item.capacity || 40,
      start_date: item.start_date || "2026-09-01",
      end_date: item.end_date || "2027-06-30",
      is_current: item.is_current ?? true,
    })
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemToEdit) return

    setIsSubmitting(true)
    setFormError("")
    try {
      if (activeTab === "courses") {
        await api.academics.updateCourse(itemToEdit.id, {
          name: formData.name.trim(),
          credits: Number(formData.credits) || 4,
        })
      } else if (activeTab === "classes") {
        await api.academics.updateClass(itemToEdit.id, {
          name: formData.name.trim(),
        })
      } else if (activeTab === "sections") {
        await api.academics.updateSection(itemToEdit.id, {
          name: formData.name.trim(),
          room_number: formData.room_number.trim(),
          capacity: Number(formData.capacity) || 40,
        })
      } else if (activeTab === "subjects") {
        await api.academics.updateSubject(itemToEdit.id, {
          name: formData.name.trim(),
          subject_type: formData.subject_type,
        })
      } else if (activeTab === "years") {
        await api.academics.updateYear(itemToEdit.id, {
          name: formData.name.trim(),
          is_current: formData.is_current,
        })
      }

      setFormSuccess("Record updated successfully!")
      await loadAllAcademics()
      setTimeout(() => {
        setIsEditModalOpen(false)
        setItemToEdit(null)
        setFormSuccess("")
      }, 1000)
    } catch (err: any) {
      setFormError(err.message || "Failed to update record.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this curriculum record?")) {
      try {
        if (activeTab === "courses") await api.academics.deleteCourse(id)
        else if (activeTab === "classes") await api.academics.deleteClass(id)
        else if (activeTab === "sections") await api.academics.deleteSection(id)
        else if (activeTab === "subjects") await api.academics.deleteSubject(id)
        else if (activeTab === "years") await api.academics.deleteYear(id)
        await loadAllAcademics()
      } catch (err: any) {
        alert(err.message || "Failed to delete record.")
      }
    }
  }

  // Active Year Summary
  const activeYearName = academicYears.find(y => y.is_current)?.name || "Current Academic Year"

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Academic Programs & Curriculum Structure
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Configure academic years, semester terms, departments, degree tracks, and class cohorts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAllAcademics}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          {canManage && (
            <Button
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add {activeTab === "courses" ? "Program / Track" : activeTab === "classes" ? "Class Cohort" : activeTab === "sections" ? "Section / Batch" : activeTab === "subjects" ? "Subject" : "Academic Year"}
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Academic Year</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{activeYearName}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Class Cohorts</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{classes.length} Active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Grid className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Sections & Rooms</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{sections.length} Sections</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Subject Curricula</p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{subjects.length} Subjects</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("classes")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "classes"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Class Cohorts & Batches ({classes.length})
        </button>

        <button
          onClick={() => setActiveTab("courses")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "courses"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Degree Tracks & Programs ({courses.length})
        </button>

        <button
          onClick={() => setActiveTab("sections")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "sections"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Sections & Capacity ({sections.length})
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "subjects"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Subjects & Labs ({subjects.length})
        </button>

        <button
          onClick={() => setActiveTab("years")}
          className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all ${
            activeTab === "years"
              ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Academic Years ({academicYears.length})
        </button>
      </div>

      {/* Tab Content Tables */}
      {activeTab === "classes" && (
        <DataTable
          data={classes}
          columns={[
            {
              key: "name",
              header: "Cohort / Class Name",
              sortable: true,
              render: (c) => (
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                  <p className="text-[11px] text-slate-400">{c.course_name || "General Academic Cohort"}</p>
                </div>
              )
            },
            {
              key: "academic_year_name",
              header: "Academic Year",
              sortable: true,
              render: (c) => <Badge variant="secondary">{c.academic_year_name || activeYearName}</Badge>
            },
            {
              key: "sections_count",
              header: "Sections",
              align: "center",
              render: (c) => <span className="font-semibold text-xs">{c.sections?.length || 0} Sections</span>
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (c) => canManage ? (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)} className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : null
            }
          ]}
          searchPlaceholder="Search class cohorts..."
          searchKeys={["name", "academic_year_name", "course_name"]}
          exportFileName="class-cohorts"
        />
      )}

      {activeTab === "courses" && (
        <DataTable
          data={courses}
          columns={[
            {
              key: "code",
              header: "Course Code",
              sortable: true,
              render: (c) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{c.code}</span>
            },
            {
              key: "name",
              header: "Program / Course Title",
              sortable: true,
              render: (c) => <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
            },
            {
              key: "credits",
              header: "Credits",
              align: "center",
              sortable: true,
              render: (c) => <Badge variant="primary">{c.credits} Credits</Badge>
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (c) => canManage ? (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(c)} className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : null
            }
          ]}
          searchPlaceholder="Search programs & courses..."
          searchKeys={["name", "code"]}
          exportFileName="academic-courses"
        />
      )}

      {activeTab === "sections" && (
        <DataTable
          data={sections}
          columns={[
            {
              key: "name",
              header: "Section Name",
              sortable: true,
              render: (s) => <span className="font-bold text-slate-900 dark:text-slate-100">Section {s.name}</span>
            },
            {
              key: "class_cohort_name",
              header: "Cohort / Class",
              sortable: true,
              render: (s) => <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{s.class_cohort_name || "General"}</span>
            },
            {
              key: "room_number",
              header: "Room #",
              sortable: true,
              render: (s) => <span className="font-mono text-xs">{s.room_number || "Room 101"}</span>
            },
            {
              key: "capacity",
              header: "Max Capacity",
              align: "center",
              sortable: true,
              render: (s) => <span className="text-xs font-semibold">{s.capacity} Students</span>
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (s) => canManage ? (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(s)} className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : null
            }
          ]}
          searchPlaceholder="Search sections..."
          searchKeys={["name", "class_cohort_name", "room_number"]}
          exportFileName="academic-sections"
        />
      )}

      {activeTab === "subjects" && (
        <DataTable
          data={subjects}
          columns={[
            {
              key: "code",
              header: "Subject Code",
              sortable: true,
              render: (s) => <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{s.code}</span>
            },
            {
              key: "name",
              header: "Subject Title",
              sortable: true,
              render: (s) => <span className="font-semibold text-slate-900 dark:text-slate-100">{s.name}</span>
            },
            {
              key: "subject_type",
              header: "Type",
              align: "center",
              sortable: true,
              render: (s) => <Badge variant={s.subject_type === "lab" ? "warning" : "primary"} className="capitalize">{s.subject_type}</Badge>
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (s) => canManage ? (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(s)} className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : null
            }
          ]}
          searchPlaceholder="Search subjects & labs..."
          searchKeys={["name", "code", "subject_type"]}
          exportFileName="academic-subjects"
        />
      )}

      {activeTab === "years" && (
        <DataTable
          data={academicYears}
          columns={[
            {
              key: "name",
              header: "Academic Year",
              sortable: true,
              render: (y) => <span className="font-bold text-slate-900 dark:text-slate-100">{y.name}</span>
            },
            {
              key: "start_date",
              header: "Timeline",
              render: (y) => <span className="text-xs text-slate-500">{y.start_date} to {y.end_date}</span>
            },
            {
              key: "is_current",
              header: "Status",
              align: "center",
              render: (y) => (
                <Badge variant={y.is_current ? "success" : "secondary"}>
                  {y.is_current ? "Active Academic Year" : "Archived"}
                </Badge>
              )
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (y) => canManage ? (
                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(y)} className="h-8 w-8 p-0 text-indigo-600 hover:bg-indigo-50">
                    <Edit3 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(y.id)} className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : null
            }
          ]}
          searchPlaceholder="Search academic years..."
          searchKeys={["name"]}
          exportFileName="academic-years"
        />
      )}

      {/* Modal: Create Item */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={`Add New ${activeTab === "courses" ? "Program / Degree Track" : activeTab === "classes" ? "Class Cohort" : activeTab === "sections" ? "Section" : activeTab === "subjects" ? "Subject" : "Academic Year"}`}
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {formSuccess && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{formSuccess}</span>
            </div>
          )}

          <Input
            label="Name / Title *"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={activeTab === "courses" ? "e.g. B.Sc. Computer Science" : activeTab === "classes" ? "e.g. Grade 10 - Batch 2026" : activeTab === "sections" ? "e.g. Section A" : activeTab === "subjects" ? "e.g. Artificial Intelligence" : "e.g. 2026-2027"}
          />

          {(activeTab === "courses" || activeTab === "subjects") && (
            <Input
              label="Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder={activeTab === "courses" ? "e.g. CS-101" : "e.g. AI-301"}
            />
          )}

          {activeTab === "courses" && (
            <Input
              label="Credits"
              type="number"
              value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
            />
          )}

          {activeTab === "subjects" && (
            <Select
              label="Subject Type"
              value={formData.subject_type}
              onChange={(e) => setFormData({ ...formData, subject_type: e.target.value })}
              options={[
                { value: "theory", label: "Theory" },
                { value: "practical", label: "Practical" },
                { value: "lab", label: "Laboratory" },
              ]}
            />
          )}

          {activeTab === "classes" && academicYears.length > 0 && (
            <Select
              label="Academic Year"
              value={formData.academic_year_id}
              onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
              options={academicYears.map(y => ({ value: y.id, label: y.name }))}
            />
          )}

          {activeTab === "sections" && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Room Number"
                value={formData.room_number}
                onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                placeholder="e.g. Room 204"
              />
              <Input
                label="Capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
            </div>
          )}

          {activeTab === "years" && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
              <Input
                label="End Date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
              {isSubmitting ? "Creating..." : "Save Record"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Item */}
      {isEditModalOpen && itemToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Curriculum Record"
          size="md"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-600 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            <Input
              label="Name / Title *"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            {activeTab === "courses" && (
              <Input
                label="Credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
              />
            )}

            {activeTab === "subjects" && (
              <Select
                label="Subject Type"
                value={formData.subject_type}
                onChange={(e) => setFormData({ ...formData, subject_type: e.target.value })}
                options={[
                  { value: "theory", label: "Theory" },
                  { value: "practical", label: "Practical" },
                  { value: "lab", label: "Laboratory" },
                ]}
              />
            )}

            {activeTab === "sections" && (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Room Number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                />
                <Input
                  label="Capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
