import { NextResponse } from "next/server"

import { requireAdminSession } from "@/lib/server/admin-auth"
import { jsonError } from "@/lib/server/http"
import { getAdminPreferences } from "@/lib/server/repositories"

export async function GET() {
  if (!(await requireAdminSession())) {
    return jsonError("Unauthorized", 401)
  }

  return NextResponse.json({
    preferences: await getAdminPreferences(),
  })
}
