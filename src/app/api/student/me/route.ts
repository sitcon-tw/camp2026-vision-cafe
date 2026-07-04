import { NextResponse } from "next/server"

import { getAppSession, getStudentFromSession } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/http"
import { getStudentSelectionPayload } from "@/lib/server/repositories"

export async function GET() {
  const session = await getAppSession()
  const student = getStudentFromSession(session)

  if (!student) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json(await getStudentSelectionPayload(student))
}
