import * as React from "react"

import { cn } from "@/shared/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-ink bg-card placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-power/45 aria-invalid:border-destructive aria-invalid:ring-destructive/25 flex field-sizing-content min-h-20 w-full rounded-[0.875rem] border-2 px-3 py-2 text-base font-semibold shadow-[2px_2px_0_rgba(23,35,58,0.12)] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
