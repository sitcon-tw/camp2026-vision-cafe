import { NextResponse } from "next/server"

import { requireAdminSession } from "@/shared/server/auth"
import { jsonError } from "@/shared/server/http"
import { getAdminPreferences } from "@/shared/server/repositories"

export async function GET() {
  if (!(await requireAdminSession())) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json({
    preferences: await getAdminPreferences(),
  })
}
