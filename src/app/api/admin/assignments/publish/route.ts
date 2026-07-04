import { NextResponse, type NextRequest } from "next/server"

import { requireAdminSession } from "@/shared/server/admin-auth"
import { jsonError } from "@/shared/server/http"
import { publishCurrentAssignmentPlan } from "@/shared/server/repositories"

export async function POST(request: NextRequest) {
  if (!(await requireAdminSession(request))) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json({
    assignmentPlan: await publishCurrentAssignmentPlan(),
  })
}
