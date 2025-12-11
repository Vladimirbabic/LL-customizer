import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-xl border border-white/10 bg-[#2a2a2a] px-4 py-2 text-sm text-white transition-colors focus-visible:outline-none focus-visible:border-[#f5d5d5]/50 focus-visible:ring-1 focus-visible:ring-[#f5d5d5]/50 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-red-500 focus-visible:ring-red-500',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

export { Select }
