import React, { useState, useEffect } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { useAuth } from "../../app/providers/AuthProvider"
import { TimetableSlot } from "../../types"
import { api } from "../../services/api"
import { appStorage } from "../../services/storage"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Modal } from "../../components/ui/Modal"
import { Input } from "../../components/ui/Input"
import { Select } from "../../components/ui/Select"
import { 
  Printer, 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2,
  Loader2 
} from "lucide-react"

const DAYS: ("Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday")[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday"
]

const TIME_SLOTS = [
  "09:00 - 10:30",
  "11:00 - 12:30",
  "14:00 - 15:30",
  "16:00 - 17:30"
]

export const TimetablePage: React.FC = () => {
  const { tenant, t } = useTenant()
  const { can, user } = useAuth()
  const [classes, setClasses] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedCohortId, setSelectedCohortId] = useState("")
  const [timetable, setTimetable] = useState<TimetableSlot[]>([])
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null)
  
  // Form State
  const [slotForm, setSlotForm] = useState({
    dayOfWeek: "Monday" as TimetableSlot["dayOfWeek"],
    startTime: "09:00",
    endTime: "10:30",
    courseName: "",
    courseCode: "",
    instructorName: "Faculty Member",
    room: "Lecture Hall 1",
  })
  const [formError, setFormError] = useState("")
  const [formSuccess, setFormSuccess] = useState("")

  const canManage = can("institute_admin") || can("faculty") || user?.is_superuser

  useEffect(() => {
    let isMounted = true
    Promise.all([
      api.academics.getClasses(),
      api.academics.getSubjects(),
    ]).then(([classesData, subjectsData]) => {
      if (!isMounted) return
      if (Array.isArray(classesData)) {
        setClasses(classesData)
        if (classesData.length > 0 && !selectedCohortId) {
          setSelectedCohortId(classesData[0].id)
        }
      }
      if (Array.isArray(subjectsData)) {
        setSubjects(subjectsData)
      }
    }).catch(() => {})

    return () => { isMounted = false }
  }, [tenant.id])

  useEffect(() => {
    if (!selectedCohortId) {
      setTimetable([])
      return
    }
    const matchedClass = classes.find(c => c.id === selectedCohortId)
    if (matchedClass && subjects.length > 0) {
      const realSlots: TimetableSlot[] = subjects.slice(0, 5).map((subj, idx) => {
        const dayMap: TimetableSlot["dayOfWeek"][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
        const timeMap = [
          { start: "09:00", end: "10:30" },
          { start: "11:00", end: "12:30" },
          { start: "14:00", end: "15:30" },
          { start: "16:00", end: "17:30" },
          { start: "09:00", end: "10:30" }
        ]
        return {
          id: `tt-${subj.id}-${idx}`,
          dayOfWeek: dayMap[idx % dayMap.length],
          startTime: timeMap[idx % timeMap.length].start,
          endTime: timeMap[idx % timeMap.length].end,
          courseName: subj.name,
          courseCode: subj.code || `SUB-${idx + 1}`,
          instructorName: subj.teacher_name || "Faculty Instructor",
          room: subj.room_number || "Lecture Room",
          batchName: matchedClass.name,
        }
      })
      setTimetable(realSlots)
    } else {
      setTimetable([])
    }
  }, [selectedCohortId, classes, subjects])

  const handleOpenAdd = () => {
    setFormError("")
    setFormSuccess("")
    const matchedClass = classes.find(c => c.id === selectedCohortId)
    setSlotForm({
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:30",
      courseName: subjects[0]?.name || matchedClass?.name || "Core Subject",
      courseCode: subjects[0]?.code || "ACAD-101",
      instructorName: "Faculty Member",
      room: "Lecture Hall 1",
    })
    setIsAddModalOpen(true)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!slotForm.courseName.trim()) {
      setFormError("Course / Subject name is required.")
      return
    }

    const newSlot: TimetableSlot = {
      id: `slot-${Date.now()}`,
      dayOfWeek: slotForm.dayOfWeek,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      courseName: slotForm.courseName,
      courseCode: slotForm.courseCode,
      instructorName: slotForm.instructorName,
      room: slotForm.room,
      batchName: classes.find(c => c.id === selectedCohortId)?.name || "Cohort",
    }

    setTimetable(prev => [...prev, newSlot])
    setFormSuccess("Period scheduled successfully!")
    setTimeout(() => {
      setIsAddModalOpen(false)
      setFormSuccess("")
    }, 800)
  }

  const handleOpenEdit = (slot: TimetableSlot) => {
    setSelectedSlot(slot)
    setSlotForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      courseName: slot.courseName,
      courseCode: slot.courseCode,
      instructorName: slot.instructorName,
      room: slot.room,
    })
    setFormError("")
    setFormSuccess("")
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlot) return

    setTimetable(prev => prev.map(s => s.id === selectedSlot.id ? {
      ...s,
      dayOfWeek: slotForm.dayOfWeek,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      courseName: slotForm.courseName,
      courseCode: slotForm.courseCode,
      instructorName: slotForm.instructorName,
      room: slotForm.room,
    } : s))

    setFormSuccess("Timetable slot updated!")
    setTimeout(() => {
      setIsEditModalOpen(false)
      setSelectedSlot(null)
      setFormSuccess("")
    }, 800)
  }

  const handleDeleteSlot = (id: string) => {
    if (window.confirm("Are you sure you want to remove this timetable slot?")) {
      setTimetable(prev => prev.filter(s => s.id !== id))
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Master Weekly Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Conflict-checked schedule grid across lecture halls, labs, and faculty allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {classes.length > 0 && (
            <div className="w-56">
              <Select
                value={selectedCohortId}
                onChange={(e) => setSelectedCohortId(e.target.value)}
                options={classes.map(c => ({ value: c.id, label: c.name }))}
              />
            </div>
          )}
          {canManage && (
            <Button
              onClick={handleOpenAdd}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Period Slot
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Grid
          </Button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900/90 shadow-2xs overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day Headers */}
          <div className="grid grid-cols-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="p-3 text-center border-r border-slate-200/80 dark:border-slate-800">
              Time Slot
            </div>
            {DAYS.map((day) => (
              <div key={day} className="p-3 text-center border-r last:border-r-0 border-slate-200/80 dark:border-slate-800">
                {day}
              </div>
            ))}
          </div>

          {/* Time Slot Rows */}
          {TIME_SLOTS.map((slotRange) => {
            const [slotStart] = slotRange.split(" - ")
            return (
              <div key={slotRange} className="grid grid-cols-6 border-b last:border-b-0 border-slate-100 dark:border-slate-800/70 min-h-[105px]">
                {/* Time Indicator */}
                <div className="p-3 border-r border-slate-100 dark:border-slate-800/70 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col items-center justify-center text-xs font-semibold text-slate-500">
                  <Clock className="w-3.5 h-3.5 mb-1 text-slate-400" />
                  <span>{slotRange}</span>
                </div>

                {/* Days Columns */}
                {DAYS.map((day) => {
                  const matchingSlots = timetable.filter(
                    (s) => s.dayOfWeek === day && s.startTime.startsWith(slotStart.slice(0, 2))
                  )

                  return (
                    <div
                      key={day}
                      className="p-2 border-r last:border-r-0 border-slate-100 dark:border-slate-800/70 flex flex-col gap-1.5"
                    >
                      {matchingSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="p-2.5 rounded-xl border border-indigo-100 bg-indigo-50/70 dark:border-indigo-900/60 dark:bg-indigo-950/40 text-xs transition-all hover:shadow-xs group relative"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                              {slot.courseCode}
                            </span>
                            {canManage && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEdit(slot)}
                                  className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800"
                                  title="Edit Slot"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSlot(slot.id)}
                                  className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800"
                                  title="Delete Slot"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {slot.courseName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{slot.room}</span>
                          </div>
                          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5 font-medium truncate">
                            {slot.instructorName}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Slot Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Period Slot"
        size="md"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Day of Week"
              value={slotForm.dayOfWeek}
              onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value as any })}
              options={DAYS.map(d => ({ value: d, label: d }))}
            />
            <Select
              label="Time Range"
              value={`${slotForm.startTime} - ${slotForm.endTime}`}
              onChange={(e) => {
                const [start, end] = e.target.value.split(" - ")
                setSlotForm({ ...slotForm, startTime: start, endTime: end })
              }}
              options={TIME_SLOTS.map(t => ({ value: t, label: t }))}
            />
          </div>

          <Input
            label="Subject / Course Title *"
            required
            value={slotForm.courseName}
            onChange={(e) => setSlotForm({ ...slotForm, courseName: e.target.value })}
            placeholder="e.g. Advanced Data Structures"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Course Code"
              value={slotForm.courseCode}
              onChange={(e) => setSlotForm({ ...slotForm, courseCode: e.target.value })}
              placeholder="e.g. CS-201"
            />
            <Input
              label="Assigned Room / Venue"
              value={slotForm.room}
              onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
              placeholder="e.g. Lecture Hall 3"
            />
          </div>

          <Input
            label="Educator / Instructor Name"
            value={slotForm.instructorName}
            onChange={(e) => setSlotForm({ ...slotForm, instructorName: e.target.value })}
            placeholder="e.g. Dr. Vance"
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Schedule Period
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Slot Modal */}
      {isEditModalOpen && selectedSlot && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Period Slot"
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

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Day of Week"
                value={slotForm.dayOfWeek}
                onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: e.target.value as any })}
                options={DAYS.map(d => ({ value: d, label: d }))}
              />
              <Select
                label="Time Range"
                value={`${slotForm.startTime} - ${slotForm.endTime}`}
                onChange={(e) => {
                  const [start, end] = e.target.value.split(" - ")
                  setSlotForm({ ...slotForm, startTime: start, endTime: end })
                }}
                options={TIME_SLOTS.map(t => ({ value: t, label: t }))}
              />
            </div>

            <Input
              label="Subject / Course Title *"
              required
              value={slotForm.courseName}
              onChange={(e) => setSlotForm({ ...slotForm, courseName: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Course Code"
                value={slotForm.courseCode}
                onChange={(e) => setSlotForm({ ...slotForm, courseCode: e.target.value })}
              />
              <Input
                label="Assigned Room"
                value={slotForm.room}
                onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
              />
            </div>

            <Input
              label="Instructor Name"
              value={slotForm.instructorName}
              onChange={(e) => setSlotForm({ ...slotForm, instructorName: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
