import { redirect } from "next/navigation"

import { getAppSession, getStudentFromSession } from "@/shared/server/auth"
import { getStudentSelectionPayload } from "@/shared/server/repositories"

import { SelectClient } from "./select-client"

export const dynamic = "force-dynamic"

export default async function SelectPage() {
  const session = await getAppSession()
  const student = getStudentFromSession(session)

  if (!student) {
    redirect(
      `/api/auth/signin/github?callbackUrl=${encodeURIComponent("/select")}`,
    )
  }

  return (
    <SelectClient initialData={await getStudentSelectionPayload(student)} />
  )
}
