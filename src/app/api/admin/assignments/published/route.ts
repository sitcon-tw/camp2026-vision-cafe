import { NextResponse, type NextRequest } from "next/server"

import { requireAdminSession } from "@/lib/server/admin-auth"
import { jsonError } from "@/lib/server/http"
import { getPublishedAssignmentPlans } from "@/lib/server/repositories"

export async function GET(request: NextRequest) {
  if (!(await requireAdminSession(request))) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json({
    assignmentPlans: await getPublishedAssignmentPlans(),
  })
}
