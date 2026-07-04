import { NextResponse } from "next/server"

import { getAppSession, getStudentFromSession } from "@/shared/server/auth"
import { jsonError } from "@/shared/server/http"
import { getStudentSelectionPayload } from "@/shared/server/repositories"

export async function GET() {
  const session = await getAppSession()
  const student = getStudentFromSession(session)

  if (!student) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json(await getStudentSelectionPayload(student))
}
