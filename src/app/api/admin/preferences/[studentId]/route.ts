import { NextResponse, type NextRequest } from "next/server"

import { requireAdminSession } from "@/lib/server/admin-auth"
import { jsonError } from "@/lib/server/http"
import { saveStudentPreference } from "@/lib/server/repositories"
import { findRosterStudentById } from "@/lib/server/roster"
import {
  preferenceUpdateSchema,
  validateSpeakerPreferenceOrder,
} from "@/lib/server/validation"

type RouteContext = {
  params: Promise<{
    studentId: string
  }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!(await requireAdminSession(request))) {
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
