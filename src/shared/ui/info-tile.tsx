import type { ComponentType, ReactNode } from "react"

type InfoTileProps = {
  label: string
  value: ReactNode
  icon?: ComponentType<{ className?: string }>
}

export function InfoTile({ label, value, icon: Icon }: InfoTileProps) {
  return (
    <div className="bg-muted/40 rounded-md border p-3">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium break-words">{value}</div>
    </div>
  )
}
