import { NextResponse, type NextRequest } from "next/server"

import { requireAdminSession } from "@/shared/server/auth"
import { jsonError } from "@/shared/server/http"
import { saveStudentPreference } from "@/shared/server/repositories"
import { findRosterStudentById } from "@/shared/server/roster"
import {
  preferenceUpdateSchema,
  validateSpeakerPreferenceOrder,
} from "@/shared/server/validation"

type RouteContext = {
  params: Promise<{
    studentId: string
  }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!(await requireAdminSession())) {
    return jsonError("Unauthorized", 401)
  }

  const { studentId } = await context.params
  const student = await findRosterStudentById(decodeURIComponent(studentId))

  if (!student) {
    return jsonError("Student not found in roster", 404)
  }

  const parsedBody = preferenceUpdateSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return jsonError("Invalid preference payload", 400)
  }

  if (!validateSpeakerPreferenceOrder(parsedBody.data.preferenceOrder)) {
    return jsonError("Invalid speaker preference order", 400)
  }

  await saveStudentPreference(student, parsedBody.data)

  return NextResponse.json({
    ok: true,
  })
}
