import React, { useState, useEffect } from "react"
import { CalendarDays, Clock, MapPin, User, BookOpen } from "lucide-react"
import { api, TimetablePeriodItem } from "../../services/api"

export const StudentTimetablePage: React.FC = () => {
  const [periods, setPeriods] = useState<TimetablePeriodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number>(1) // 1 = Monday

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        setLoading(true)
        const res = await api.studentPortal.getTimetable()
        setPeriods(res || [])
      } catch {
        // Fallback
      } finally {
        setLoading(false)
      }
    }
    fetchTimetable()
  }, [])

  const days = [
    { idx: 1, name: "Monday", code: "Mon" },
    { idx: 2, name: "Tuesday", code: "Tue" },
    { idx: 3, name: "Wednesday", code: "Wed" },
    { idx: 4, name: "Thursday", code: "Thu" },
    { idx: 5, name: "Friday", code: "Fri" },
  ]

  const filteredPeriods = periods.filter((p) => p.day_of_week === selectedDay)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#112D4E] dark:text-white flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-[#3F72AF]" />
            Weekly Academic Schedule
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View lecture periods, assigned instructors, and classroom assignments.
          </p>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#DBE2EF]/60 dark:bg-slate-800 rounded-xl">
          {days.map((d) => (
            <button
              key={d.idx}
              onClick={() => setSelectedDay(d.idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedDay === d.idx
                  ? "bg-[#3F72AF] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-[#112D4E] dark:hover:text-white"
              }`}
            >
              {d.code}
            </button>
          ))}
        </div>
      </div>

      {/* Timetable Period Cards */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[#DBE2EF]/40 dark:bg-slate-800/40" />
          ))}
        </div>
      ) : filteredPeriods.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 text-slate-500">
          No scheduled classes for this day.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPeriods.map((period, index) => (
            <div
              key={period.id || index}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-[#DBE2EF] dark:border-slate-800 hover:border-[#3F72AF] shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#DBE2EF]/60 dark:bg-slate-800 flex flex-col items-center justify-center text-[#112D4E] dark:text-white font-bold flex-shrink-0">
                  <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400">Period</span>
                  <span className="text-lg leading-tight">{index + 1}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#112D4E] dark:text-white">
                      {period.subject_name}
                    </h3>
                    {period.subject_code && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#DBE2EF] dark:bg-slate-800 text-[#112D4E] dark:text-slate-200">
                        {period.subject_code}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#3F72AF]" />
                      {period.teacher_name}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {period.room_number}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F9F7F7] dark:bg-slate-800 border border-[#DBE2EF] dark:border-slate-700 text-xs font-semibold text-[#112D4E] dark:text-slate-200">
                  <Clock className="w-4 h-4 text-[#3F72AF]" />
                  <span>{period.start_time} – {period.end_time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
