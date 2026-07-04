import type { ReactNode } from "react"

import { cn } from "@/shared/utils"

type AppPageShellProps = {
  action?: ReactNode
  children: ReactNode
  title: string
  element?: "main" | "div"
  label?: string
  contentPlacement?: "start" | "center"
  contentWidth?: "standard" | "admin"
  topAction?: ReactNode
  bottomNavInset?: boolean
}

export function AppPageShell({
  action,
  children,
  title,
  element: Element = "main",
  label = "視界咖啡館",
  contentPlacement = "start",
  contentWidth = "standard",
  topAction,
  bottomNavInset = false,
}: AppPageShellProps) {
  return (
    <Element className="bg-background text-foreground min-h-dvh">
      <section
        className={cn(
          "mx-auto flex min-h-dvh w-full flex-col gap-5 px-4 py-5",
          contentWidth === "standard" && "max-w-md",
          contentWidth === "admin" &&
            "max-w-none px-4 py-4 sm:px-6 lg:px-8 lg:py-6",
          contentPlacement === "center" && "justify-center",
          bottomNavInset && "pb-[calc(7.25rem+env(safe-area-inset-bottom))]",
        )}
      >
        {topAction ? <div className="flex shrink-0">{topAction}</div> : null}

        <header className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-muted-foreground text-sm leading-6">{label}</p>
            <h1 className="text-3xl leading-tight font-black tracking-tight">
              {title}
            </h1>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>

        {children}
      </section>
    </Element>
  )
}
