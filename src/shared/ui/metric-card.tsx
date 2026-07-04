import type { ComponentType } from "react"

import {
  statusToneClassNames,
  type StatusTone,
} from "@/shared/config/color-palette"
import { Card, CardContent } from "@/shared/ui/card"
import { StatusDot } from "@/shared/ui/status-dot"
import { cn } from "@/shared/utils/cn"

type MetricCardProps = {
  label: string
  value: string
  tone: StatusTone
  icon: ComponentType<{ className?: string }>
}

export function MetricCard({
  label,
  value,
  tone,
  icon: Icon,
}: MetricCardProps) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("size-4", statusToneClassNames[tone].icon)} />
          <span className="text-muted-foreground text-xs">{label}</span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xl font-semibold">
          <StatusDot tone={tone} />
          {value}
        </div>
      </CardContent>
    </Card>
  )
}
