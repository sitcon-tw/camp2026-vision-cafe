import type { ReactNode } from "react"

type AppPageShellProps = {
  children: ReactNode
}

export function AppPageShell({ children }: AppPageShellProps) {
  return (
    <main className="bg-background text-foreground min-h-dvh">
      <section className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 py-5">
        {children}
      </section>
    </main>
  )
}
