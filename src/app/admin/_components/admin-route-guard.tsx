"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"

import { fetchAdmin } from "./admin-api"

type AdminRouteGuardProps = {
  children: ReactNode
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const pathname = usePathname()
  const [authorizedPathname, setAuthorizedPathname] = useState<string | null>(
    null,
  )
  const isLoginPage = pathname === "/admin/login"

  useEffect(() => {
    let isCurrent = true

    if (isLoginPage) {
      return
    }

    async function checkAdminSession() {
      const response = await fetchAdmin("/api/admin/session", {
        cache: "no-store",
      })

      if (isCurrent && response.ok) {
        setAuthorizedPathname(pathname)
      }
    }

    void checkAdminSession()

    return () => {
      isCurrent = false
    }
  }, [isLoginPage, pathname])

  if (isLoginPage) {
    return children
  }

  if (authorizedPathname !== pathname) {
    return null
  }

  return children
}
