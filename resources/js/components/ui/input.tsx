import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-2 border-[#E8E8E8] dark:border-[#2D234A] bg-white dark:bg-[#18122B] text-foreground placeholder:text-muted-foreground selection:bg-[#FF6B35]/20 selection:text-[#FF6B35] flex h-11 w-full min-w-0 rounded-xl px-3.5 py-2.5 text-sm transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[#FF6B35] focus-visible:ring-4 focus-visible:ring-[#FF6B35]/12 dark:focus-visible:border-[#FF6B35] dark:focus-visible:ring-[#FF6B35]/20",
        "aria-invalid:border-[#EF4444] aria-invalid:ring-[#EF4444]/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
