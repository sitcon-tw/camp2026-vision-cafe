import { useEffect, useState } from "react"

import type { LookupPayload } from "@/lib/vision-cafe-api"
import {
  RouteErrorPage,
  RouteLoadingPage,
} from "@/routes/components/page-state"

import { LookupClient } from "./lookup-client"

type LookupPageState =
  | {
      status: "loading"
    }
  | {
      data: LookupPayload
      status: "ready"
    }
  | {
      message: string
      status: "error"
    }

export function LookupPage() {
  const [pageState, setPageState] = useState<LookupPageState>({
    status: "loading",
  })

  useEffect(() => {
    let ignore = false

    async function loadLookup() {
      try {
        const response = await fetch("/api/lookup")

        if (ignore) {
          return
        }

        if (!response.ok) {
          setPageState({
            message: "無法載入講者分配查詢資料。",
            status: "error",
          })
          return
        }

        setPageState({
          data: (await response.json()) as LookupPayload,
          status: "ready",
        })
      } catch {
        if (!ignore) {
          setPageState({
            message: "無法連線到講者分配查詢服務。",
            status: "error",
          })
        }
      }
    }

    void loadLookup()

    return () => {
      ignore = true
    }
  }, [])

  if (pageState.status === "loading") {
    return <RouteLoadingPage title="分配講者查詢" backHref="/" />
  }

  if (pageState.status === "error") {
    return (
      <RouteErrorPage
        title="分配講者查詢"
        backHref="/"
        message={pageState.message}
      />
    )
  }

  return <LookupClient initialLookup={pageState.data} />
}
