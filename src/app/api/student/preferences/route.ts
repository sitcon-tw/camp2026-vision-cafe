import { NextResponse, type NextRequest } from "next/server"

import { getAppSession, getStudentFromSession } from "@/lib/server/auth"
import { jsonError } from "@/lib/server/http"
import {
  getFlowControls,
  getStudentPreference,
  saveStudentPreference,
} from "@/lib/server/repositories"
import {
  studentPreferenceSubmitSchema,
  validateSpeakerPreferenceOrder,
} from "@/lib/server/validation"

export async function PUT(request: NextRequest) {
  const session = await getAppSession()
  const student = getStudentFromSession(session)

  if (!student) {
    return jsonError("Unauthorized", 401)
  }

  const flowControls = await getFlowControls()

  if (!flowControls.speakerPreferenceSelectionOpen) {
    return jsonError("Speaker preference selection is closed", 403)
  }

  const parsedBody = studentPreferenceSubmitSchema.safeParse(
    await request.json(),
  )

  if (!parsedBody.success) {
    return jsonError("Invalid preference payload", 400)
  }

  if (!validateSpeakerPreferenceOrder(parsedBody.data.preferenceOrder)) {
    return jsonError("Invalid speaker preference order", 400)
  }

  await saveStudentPreference(student, {
    preferenceOrder: parsedBody.data.preferenceOrder,
    submittedAt: new Date().toISOString(),
  })

  return NextResponse.json({
    preference: await getStudentPreference(student),
  })
}
