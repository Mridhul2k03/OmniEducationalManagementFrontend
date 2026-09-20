import React from "react"
import { cn } from "../../lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

export interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number | string
    isPositive: boolean
    label?: string
  }
  icon: React.ReactNode
  description?: string
  colorVariant?: "indigo" | "emerald" | "amber" | "violet" | "sky"
  className?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  colorVariant = "indigo",
  className,
}) => {
  const colorMap = {
    indigo: "bg-[#DBE2EF] text-[#3F72AF] dark:bg-indigo-950/50 dark:text-indigo-400 border-[#DBE2EF] dark:border-indigo-900/50",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    violet: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/50",
    sky: "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400 border-sky-100 dark:border-sky-900/50"
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[#DBE2EF]/80 bg-white p-5 shadow-xs transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 dark:border-slate-800/80 dark:bg-slate-900/90",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <h4 className="mt-1.5 text-2xl font-bold tracking-tight text-[#112D4E] dark:text-slate-100">
            {value}
          </h4>
        </div>
        <div className={cn("rounded-xl p-2.5 border", colorMap[colorVariant])}>
          {icon}
        </div>
      </div>

      {(change || description) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={cn(
                "inline-flex items-center font-semibold rounded-md px-1.5 py-0.5",
                change.isPositive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              )}
            >
              {change.isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {change.value}
            </span>
          )}
          <span className="text-slate-500 dark:text-slate-400">
            {change?.label || description}
          </span>
        </div>
      )}
    </div>
  )
}
