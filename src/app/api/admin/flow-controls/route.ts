import { NextResponse, type NextRequest } from "next/server"

import { requireAdminSession } from "@/lib/server/admin-auth"
import { jsonError } from "@/lib/server/http"
import {
  getFlowControls,
  updateFlowControls,
} from "@/lib/server/repositories"
import { flowControlsSchema } from "@/lib/server/validation"

export async function GET() {
  if (!(await requireAdminSession())) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json(await getFlowControls())
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdminSession(request))) {
    return jsonError("Unauthorized", 401)
  }

  const parsedBody = flowControlsSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return jsonError("Invalid flow controls payload", 400)
  }

  return NextResponse.json(await updateFlowControls(parsedBody.data))
}
