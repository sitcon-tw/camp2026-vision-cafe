import type { ReactNode } from "react"

import {
  pebbleToneClassNames,
  type PebbleTone,
} from "@/shared/config/color-palette"
import { Badge } from "@/shared/ui/badge"
import { cn } from "@/shared/utils/cn"

type IconBadgeProps = {
  label: string
  tone: PebbleTone
  icon?: ReactNode
  className?: string
}

export function IconBadge({ label, tone, icon, className }: IconBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", pebbleToneClassNames[tone].badge, className)}
    >
      {icon}
      {label}
    </Badge>
  )
}
