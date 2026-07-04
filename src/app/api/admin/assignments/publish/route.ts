import { NextResponse, type NextRequest } from "next/server"

import { requireAdminSession } from "@/lib/server/admin-auth"
import { jsonError } from "@/lib/server/http"
import { publishCurrentAssignmentPlan } from "@/lib/server/repositories"

export async function POST(request: NextRequest) {
  if (!(await requireAdminSession(request))) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json({
    assignmentPlan: await publishCurrentAssignmentPlan(),
  })
}
