"use client"

import * as React from "react"
import { CheckIcon } from "lucide-react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/shared/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-ink bg-card focus-visible:border-ring focus-visible:ring-power/45 aria-invalid:border-destructive aria-invalid:ring-destructive/25 data-[state=checked]:border-ink data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground size-5 shrink-0 rounded-[0.4rem] border-2 shadow-[1.5px_1.5px_0_rgba(23,35,58,0.18)] transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        <CheckIcon className="size-4 stroke-[3]" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
