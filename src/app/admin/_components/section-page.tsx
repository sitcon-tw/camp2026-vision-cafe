import type { ReactNode } from "react"

import { AppPageShell } from "@/components/ui/app-page-shell"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { AdminNavigation } from "./navigation"

type AdminSectionPageProps = {
  children: ReactNode
  title: string
}

export function AdminSectionPage({ children, title }: AdminSectionPageProps) {
  return (
    <SidebarProvider>
      <AdminNavigation />
      <SidebarInset>
        <AppPageShell
          title={title}
          label="視界咖啡館 Admin"
          element="div"
          contentWidth="admin"
          topAction={
            <SidebarTrigger
              aria-label="切換 Admin 導覽"
              className="border-ink bg-card size-9 border-2 shadow-[3px_3px_0_rgba(23,35,58,0.18)]"
            />
          }
        >
          {children}
        </AppPageShell>
      </SidebarInset>
    </SidebarProvider>
  )
}
