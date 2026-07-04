import { NextResponse } from "next/server"

import { requireAdminSession } from "@/shared/server/auth"
import { jsonError } from "@/shared/server/http"
import { publishCurrentAssignmentPlan } from "@/shared/server/repositories"

export async function POST() {
  if (!(await requireAdminSession())) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json({
    assignmentPlan: await publishCurrentAssignmentPlan(),
  })
}
