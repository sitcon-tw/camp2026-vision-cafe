import { NextResponse, type NextRequest } from "next/server"

import { requireAdminSession } from "@/shared/server/auth"
import { jsonError } from "@/shared/server/http"
import {
  getFlowControls,
  updateFlowControls,
} from "@/shared/server/repositories"
import { flowControlsSchema } from "@/shared/server/validation"

export async function GET() {
  if (!(await requireAdminSession())) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json(await getFlowControls())
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdminSession())) {
    return jsonError("Unauthorized", 401)
  }

  const parsedBody = flowControlsSchema.safeParse(await request.json())

  if (!parsedBody.success) {
    return jsonError("Invalid flow controls payload", 400)
  }

  return NextResponse.json(await updateFlowControls(parsedBody.data))
}
