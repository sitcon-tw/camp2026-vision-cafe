import { NextResponse } from "next/server"

import { requireAdminSession } from "@/shared/server/admin-auth"
import { jsonError } from "@/shared/server/http"

export async function GET() {
  if (!(await requireAdminSession())) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json({ authenticated: true })
}
