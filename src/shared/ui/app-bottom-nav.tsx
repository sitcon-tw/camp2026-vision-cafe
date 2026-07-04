"use client"

import type { ComponentType, SVGProps } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/shared/utils"

type AppBottomNavIcon = ComponentType<SVGProps<SVGSVGElement>>

export type AppBottomNavItem = {
  href: string
  label: string
  exact?: boolean
} & (
  | {
      icon: AppBottomNavIcon
      iconSrc?: never
    }
  | {
      icon?: never
      iconSrc: string
    }
)

type AppBottomNavProps = {
  "aria-label"?: string
  hiddenPathPrefixes?: readonly string[]
  items?: readonly AppBottomNavItem[]
}

const defaultHiddenPathPrefixes = ["/login", "/codex", "/admin"] as const

const defaultNavItems = [
  {
    label: "首頁",
    href: "/",
    iconSrc: "/game-icons/nav/nav-home.png",
    exact: true,
  },
  {
    label: "戰鬥",
    href: "/battle",
    iconSrc: "/game-icons/nav/nav-battle.png",
  },
  {
    label: "小石",
    href: "/stones",
    iconSrc: "/game-icons/nav/nav-stones.png",
  },
  {
    label: "商店",
    href: "/shop",
    iconSrc: "/game-icons/nav/nav-shop.png",
  },
  {
    label: "通行證",
    href: "/profile/qr",
    iconSrc: "/game-icons/nav/nav-profile.png",
  },
] satisfies readonly AppBottomNavItem[]

function isHiddenPath(pathname: string, hiddenPathPrefixes: readonly string[]) {
  return hiddenPathPrefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
}

function isActivePath(pathname: string, item: AppBottomNavItem) {
  if (item.exact || item.href === "/") return pathname === item.href

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

export function AppBottomNav({
  "aria-label": ariaLabel = "主要導覽",
  hiddenPathPrefixes,
  items: providedItems,
}: AppBottomNavProps) {
  const pathname = usePathname()
  const items = providedItems ?? defaultNavItems
  const resolvedHiddenPathPrefixes =
    hiddenPathPrefixes ?? (providedItems ? [] : defaultHiddenPathPrefixes)

  if (
    items.length === 0 ||
    isHiddenPath(pathname, resolvedHiddenPathPrefixes)
  ) {
    return null
  }

  return (
    <nav
      className="bg-surface-raised border-ink fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t-2 px-3 pt-2 pb-[calc(0.65rem+env(safe-area-inset-bottom))] shadow-[0_-4px_0_rgba(23,35,58,0.12)]"
      aria-label={ariaLabel}
    >
      <ul
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => {
          const active = isActivePath(pathname, item)
          const Icon = "icon" in item ? item.icon : null

          return (
            <li key={item.href} className="min-w-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:outline-power relative flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 pt-0.5 pb-1 text-[11px] leading-none font-black no-underline transition-transform focus-visible:rounded-[14px] focus-visible:outline-3 focus-visible:outline-offset-2 active:translate-y-px",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-ink",
                )}
              >
                {Icon ? (
                  <Icon
                    aria-hidden="true"
                    className={cn("my-2 size-7 transition-transform", {
                      "scale-110": active,
                    })}
                  />
                ) : (
                  <img
                    src={item.iconSrc}
                    alt=""
                    className={cn(
                      "size-11 object-contain transition-transform",
                      {
                        "scale-110": active,
                      },
                    )}
                    draggable={false}
                    decoding="async"
                    aria-hidden
                  />
                )}
                <span className="block max-w-full truncate">{item.label}</span>
                <span
                  className={cn(
                    "mt-1 h-1 rounded-full transition-opacity",
                    active ? "bg-primary w-5 opacity-100" : "w-2 opacity-0",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
