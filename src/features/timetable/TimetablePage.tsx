import React, { useState } from "react"
import { useTenant } from "../../app/providers/TenantProvider"
import { TimetableSlot } from "../../types"
import { appStorage } from "../../services/storage"
import { Button } from "../../components/ui/Button"
import { Badge } from "../../components/ui/Badge"
import { Select } from "../../components/ui/Select"
import { Printer, Calendar, Clock, MapPin, UserCheck, AlertTriangle } from "lucide-react"

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
  const timetable = appStorage.getTimetable()
  const [selectedCohort, setSelectedCohort] = useState("Cohort A - Year 3")

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

        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              options={[
                { value: "Cohort A - Year 3", label: "Cohort A - Year 3" },
                { value: "Cohort B - Year 2", label: "Cohort B - Year 2" },
                { value: "Cohort C - Year 1", label: "Cohort C - Year 1" }
              ]}
            />
          </div>
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

                {/* Day Cells */}
                {DAYS.map((day) => {
                  const matched = timetable.find(
                    (item) => item.dayOfWeek === day && item.startTime === slotStart
                  )

                  return (
                    <div
                      key={day}
                      className="p-2 border-r last:border-r-0 border-slate-100 dark:border-slate-800/70 flex flex-col justify-center"
                    >
                      {matched ? (
                        <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1 hover:shadow-xs transition-shadow">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-[10px]">
                              {matched.courseCode}
                            </span>
                            <span className="text-[10px] text-indigo-500 font-semibold">
                              {matched.room}
                            </span>
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-[11px]">
                            {matched.courseName}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {matched.instructorName}
                          </p>
                        </div>
                      ) : (
                        <div className="h-full w-full rounded-lg border border-dashed border-slate-100 dark:border-slate-800/60 flex items-center justify-center text-[10px] text-slate-300 dark:text-slate-600">
                          Free Slot
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
