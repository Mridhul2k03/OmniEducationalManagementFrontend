import React from "react"
import { cn } from "../../lib/utils"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  error?: string
  helperText?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, helperText, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            "flex h-9.5 w-full rounded-lg border border-[#DBE2EF] bg-white px-3 py-2 text-sm text-[#112D4E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F72AF] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100",
            error && "border-rose-500 focus-visible:ring-rose-500",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="text-xs text-rose-500 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

Select.displayName = "Select"
