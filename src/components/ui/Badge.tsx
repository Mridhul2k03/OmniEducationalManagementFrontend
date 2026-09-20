import React from "react"
import { cn } from "../../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info" | "outline"
  size?: "sm" | "md"
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "secondary",
  size = "md",
  className,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-[#DBE2EF] text-[#112D4E] border-[#3F72AF]/30 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60",
    secondary: "bg-[#DBE2EF]/60 text-[#112D4E] border-[#DBE2EF] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60",
    danger: "bg-rose-50 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60",
    info: "bg-[#DBE2EF] text-[#3F72AF] border-[#3F72AF]/20 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60",
    outline: "bg-transparent text-[#112D4E] border-[#DBE2EF] dark:text-slate-400 dark:border-slate-700"
  }

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs font-medium rounded-full",
    md: "px-2.5 py-1 text-xs font-medium rounded-full"
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border transition-colors shadow-2xs",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
