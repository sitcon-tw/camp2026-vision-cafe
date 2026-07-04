import { NextResponse, type NextRequest } from "next/server"

import {
  adminPasswordMatches,
  setAdminSessionCookie,
} from "@/lib/server/admin-auth"
import { jsonError } from "@/lib/server/http"

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return jsonError("Unauthorized", 401)
  }

  const body = (await request.json()) as { password?: unknown }

  if (typeof body.password !== "string" || !adminPasswordMatches(body.password)) {
    return jsonError("Unauthorized", 401)
  }

  const response = NextResponse.json({ ok: true })

  setAdminSessionCookie(response)

  return response
}
