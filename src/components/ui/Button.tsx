import React from "react"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "link"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3F72AF] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer"

    const variantStyles = {
      primary:
        "bg-[#3F72AF] text-white hover:bg-[#2d568c] shadow-sm hover:shadow dark:bg-indigo-500 dark:hover:bg-indigo-600",
      secondary:
        "bg-[#DBE2EF] text-[#112D4E] hover:bg-[#cad5e7] dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
      outline:
        "border border-[#DBE2EF] bg-white hover:bg-[#F9F7F7] text-[#112D4E] shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
      ghost:
        "hover:bg-[#DBE2EF]/60 hover:text-[#112D4E] text-[#112D4E]/80 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow dark:bg-rose-500 dark:hover:bg-rose-600",
      link: "text-[#3F72AF] underline-offset-4 hover:underline dark:text-indigo-400 p-0 h-auto",
    }

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9.5 px-4 text-sm gap-2",
      lg: "h-11 px-6 text-base gap-2.5",
      icon: "h-9.5 w-9.5 p-0",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = "Button"
