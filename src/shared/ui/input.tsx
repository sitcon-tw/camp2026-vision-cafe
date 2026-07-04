import * as React from "react"

import { cn } from "@/shared/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-ink bg-card selection:bg-primary selection:text-primary-foreground file:text-foreground placeholder:text-muted-foreground h-10 w-full min-w-0 rounded-[0.875rem] border-2 px-3 py-1 text-base font-semibold shadow-[2px_2px_0_rgba(23,35,58,0.12)] transition-[color,box-shadow,transform] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-bold disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-power/45 focus-visible:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/25",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
