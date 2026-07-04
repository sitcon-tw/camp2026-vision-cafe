import type { ReactNode } from "react"

type AppPageShellProps = {
  children: ReactNode
  title: string
  label?: string
  contentPlacement?: "start" | "center"
}

export function AppPageShell({
  children,
  title,
  label = "視界咖啡館",
  contentPlacement = "start",
}: AppPageShellProps) {
  return (
    <main className="bg-background text-foreground min-h-dvh">
      <section
        className={
          contentPlacement === "center"
            ? "mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 px-4 py-5"
            : "mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-5"
        }
      >
        <header className="flex flex-col gap-2 pt-1">
          <p className="text-muted-foreground text-sm leading-6">{label}</p>
          <h1 className="text-3xl leading-tight font-black tracking-tight">
            {title}
          </h1>
        </header>

        {children}
      </section>
    </main>
  )
}
