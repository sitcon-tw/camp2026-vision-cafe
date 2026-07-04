import type { ReactNode } from "react"

import { cn } from "@/shared/utils"

type GamePageShellProps = {
  children: ReactNode
  ariaLabel?: string
  className?: string
  contentClassName?: string
}

export function GamePageShell({
  children,
  ariaLabel,
  className,
  contentClassName,
}: GamePageShellProps) {
  return (
    <main
      className={cn(
        "bg-paper text-ink flex min-h-svh justify-center",
        className,
      )}
      aria-label={ariaLabel}
    >
      <div
        className={cn(
          "relative flex min-h-svh w-full max-w-[430px] flex-col px-4 py-[18px] pb-[calc(7.25rem+env(safe-area-inset-bottom))]",
          contentClassName,
        )}
      >
        {children}
      </div>
    </main>
  )
}
