import React, { useState, useEffect } from "react"
import { Award, BookOpen, CheckCircle, TrendingUp } from "lucide-react"
import { api, RecentGradeItem } from "../../services/api"

export const StudentGradesPage: React.FC = () => {
  const [grades, setGrades] = useState<RecentGradeItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setLoading(true)
        const res = await api.studentPortal.getGrades()
        setGrades(res || [])
      } catch {
        // Fallback
      } finally {
        setLoading(false)
      }
    }
    fetchGrades()
  }, [])

  const totalMarks = grades.reduce((acc, g) => acc + (g.marks_obtained || 0), 0)
  const maxMarks = grades.reduce((acc, g) => acc + (g.max_marks || 100), 0)
  const avgPct = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 85
  const gpa = ((avgPct / 100) * 4.0).toFixed(2)

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300"
      case "B":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300"
      case "C":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#112D4E] dark:text-white flex items-center gap-2.5">
          <Award className="w-7 h-7 text-[#3F72AF]" />
          Academic Examinations & Gradebook
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review examination scores, subject evaluations, and cumulative GPA.
        </p>
      </div>

      {/* GPA Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#112D4E] to-[#3F72AF] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-[#DBE2EF]">Cumulative Standing</span>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold">{gpa}</span>
            <span className="text-sm text-[#DBE2EF]">/ 4.00 Grade Point Average</span>
          </div>
          <p className="text-xs text-[#DBE2EF] mt-1">
            Overall aggregate score: <span className="font-bold text-white">{avgPct}%</span> across {grades.length} evaluated subjects.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-amber-300" />
          <div>
            <div className="text-xs text-[#DBE2EF]">Academic Status</div>
            <div className="text-sm font-bold text-white">Dean's Honor List</div>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#DBE2EF] dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-[#DBE2EF] dark:border-slate-800">
          <h2 className="font-bold text-base text-[#112D4E] dark:text-white">
            Subject Exam Scorecards
          </h2>
        </div>

        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded bg-[#DBE2EF]/40 dark:bg-slate-800/40" />
            ))}
          </div>
        ) : grades.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No exam scores published yet for this semester.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F9F7F7] dark:bg-slate-800/50 border-b border-[#DBE2EF] dark:border-slate-800 text-xs font-semibold text-[#112D4E] dark:text-slate-200 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Subject</th>
                  <th className="py-3.5 px-6">Exam Title</th>
                  <th className="py-3.5 px-6">Score</th>
                  <th className="py-3.5 px-6">Percentage</th>
                  <th className="py-3.5 px-6">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBE2EF] dark:divide-slate-800 text-xs">
                {grades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-[#DBE2EF]/20 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-[#112D4E] dark:text-white">
                      {grade.subject_name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">
                      {grade.exam_name}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-medium">
                      {grade.marks_obtained} / {grade.max_marks}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-[#DBE2EF] dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#3F72AF] h-full rounded-full"
                            style={{ width: `${Math.min(100, grade.percentage)}%` }}
                          />
                        </div>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">
                          {grade.percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-bold border ${getGradeColor(grade.grade)}`}>
                        Grade {grade.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
