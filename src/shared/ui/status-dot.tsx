import {
  statusToneClassNames,
  type StatusTone,
} from "@/shared/config/color-palette"
import { cn } from "@/shared/utils/cn"

type StatusDotProps = {
  tone: StatusTone
  className?: string
}

export function StatusDot({ tone, className }: StatusDotProps) {
  return (
    <div
      className={cn(
        "size-2 rounded-full",
        statusToneClassNames[tone].dot,
        className,
      )}
      aria-hidden="true"
    />
  )
}
