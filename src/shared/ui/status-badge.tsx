import type { ReactNode } from "react"

import {
  statusToneClassNames,
  type StatusTone,
} from "@/shared/config/color-palette"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/utils/cn"

type StatusBadgeProps = {
  tone: StatusTone
  children: ReactNode
  className?: string
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <Badge className={cn("w-fit", statusToneClassNames[tone].badge, className)}>
      {children}
    </Badge>
  )
}
