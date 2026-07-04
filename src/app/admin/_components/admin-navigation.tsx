"use client"

import {
  ClipboardListIcon,
  CoffeeIcon,
  Settings2Icon,
  SlidersHorizontalIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/ui/sidebar"

const adminNavigationItems = [
  {
    href: "/admin/flow",
    label: "流程",
    description: "開放狀態",
    icon: Settings2Icon,
  },
  {
    href: "/admin/preferences",
    label: "志願",
    description: "學員志願序",
    icon: SlidersHorizontalIcon,
  },
  {
    href: "/admin/assignments",
    label: "分配",
    description: "分配 dry run",
    icon: ClipboardListIcon,
  },
]

export function AdminNavigation() {
  const pathname = usePathname()

  return (
    <Sidebar
      aria-label="Admin 導覽"
      collapsible="icon"
      className="border-ink bg-card border-r-2"
    >
      <SidebarHeader className="gap-3 p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent"
            >
              <Link href="/admin/flow">
                <CoffeeIcon aria-hidden="true" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-black">視界咖啡館</span>
                  <span className="text-sidebar-foreground/65 truncate text-xs font-bold">
                    Admin Console
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>管理介面</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavigationItems.map((item) => {
                const Icon = item.icon
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      size="lg"
                      tooltip={item.label}
                      className="relative font-black before:absolute before:top-1/2 before:left-2 before:h-7 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary before:opacity-0 before:transition-opacity data-[active=true]:before:opacity-100 group-data-[collapsible=icon]:before:hidden"
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                      >
                        <Icon aria-hidden="true" />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate">{item.label}</span>
                          <span className="text-sidebar-foreground/65 truncate text-xs font-bold">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}
