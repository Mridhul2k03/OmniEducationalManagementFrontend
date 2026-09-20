import React from "react"
import { cn } from "../../lib/utils"

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn("flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-all whitespace-nowrap",
              isActive
                ? "border-[#3F72AF] text-[#3F72AF] dark:border-indigo-400 dark:text-indigo-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-[#112D4E] hover:border-[#DBE2EF] dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold",
                  isActive
                    ? "bg-[#DBE2EF] text-[#112D4E] dark:bg-indigo-950/60 dark:text-indigo-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
