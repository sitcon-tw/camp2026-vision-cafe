import { useEffect, useState } from "react"

import type { StudentSelectionPayload } from "@/lib/vision-cafe-api"
import {
  RouteErrorPage,
  RouteLoadingPage,
} from "@/routes/components/page-state"

import { SelectClient } from "./select-client"
import { StudentLoginGate } from "./student-login-gate"

type SelectPageState =
  | {
      status: "loading"
    }
  | {
      status: "login"
    }
  | {
      data: StudentSelectionPayload
      status: "ready"
    }
  | {
      message: string
      status: "error"
    }

export function SelectPage() {
  const [pageState, setPageState] = useState<SelectPageState>({
    status: "loading",
  })

  useEffect(() => {
    let ignore = false

    async function loadStudentSelection() {
      try {
        const response = await fetch("/api/student/me")

        if (ignore) {
          return
        }

        if (response.status === 401) {
          setPageState({ status: "login" })
          return
        }

        if (!response.ok) {
          setPageState({
            message: "無法載入講者志願選填資料。",
            status: "error",
          })
          return
        }

        setPageState({
          data: (await response.json()) as StudentSelectionPayload,
          status: "ready",
        })
      } catch {
        if (!ignore) {
          setPageState({
            message: "無法連線到講者志願選填服務。",
            status: "error",
          })
        }
      }
    }

    void loadStudentSelection()

    return () => {
      ignore = true
    }
  }, [])

  if (pageState.status === "loading") {
    return <RouteLoadingPage title="講者志願選填" backHref="/" />
  }

  if (pageState.status === "login") {
    return <StudentLoginGate callbackUrl="/select" />
  }

  if (pageState.status === "error") {
    return (
      <RouteErrorPage
        title="講者志願選填"
        backHref="/"
        message={pageState.message}
      />
    )
  }

  return <SelectClient initialData={pageState.data} />
}
