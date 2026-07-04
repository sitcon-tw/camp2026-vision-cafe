import { getAppSession, getStudentFromSession } from "@/lib/server/auth"
import { getStudentSelectionPayload } from "@/lib/server/repositories"
import { StudentLoginGate } from "./_components/student-login-gate"

import { SelectClient } from "./_components/select-client"

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
