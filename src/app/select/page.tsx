import { getAppSession, getStudentFromSession } from "@/shared/server/auth"
import { getStudentSelectionPayload } from "@/shared/server/repositories"
import { StudentLoginGate } from "@/shared/ui/student-login-gate"

import { SelectClient } from "./select-client"

export const dynamic = "force-dynamic"

export default async function SelectPage() {
  const session = await getAppSession()
  const student = getStudentFromSession(session)

  if (!student) {
    return <StudentLoginGate callbackUrl="/select" />
  }

  return (
    <SelectClient initialData={await getStudentSelectionPayload(student)} />
  )
}
