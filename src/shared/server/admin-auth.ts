import { createHmac, timingSafeEqual } from "node:crypto"

import { cookies } from "next/headers"
import type { NextRequest, NextResponse } from "next/server"

import { getRequiredEnv } from "@/shared/server/env"

export const ADMIN_SESSION_COOKIE = "vision_cafe_admin"

const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8

type AdminSessionPayload = {
  exp: number
  iat: number
  sub: "admin"
}

type AdminSession = {
  kind: "admin"
}

function getAdminSigningSecret() {
  return `${getRequiredEnv("AUTH_SECRET")}:${getRequiredEnv("ADMIN_PASSWORD")}`
}

function signValue(value: string) {
  return createHmac("sha256", getAdminSigningSecret())
    .update(value)
    .digest("base64url")
}

function encodePayload(payload: AdminSessionPayload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

function decodePayload(value: string): AdminSessionPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload>

    if (parsed.sub !== "admin" || typeof parsed.exp !== "number") {
      return null
    }

    return {
      exp: parsed.exp,
      iat: typeof parsed.iat === "number" ? parsed.iat : 0,
      sub: "admin",
    }
  } catch {
    return null
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.byteLength !== rightBuffer.byteLength) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function verifyAdminToken(token: string | undefined) {
  if (!token) {
    return false
  }

  const [encodedPayload, signature] = token.split(".")

  if (!encodedPayload || !signature) {
    return false
  }

  if (!safeEqual(signature, signValue(encodedPayload))) {
    return false
  }

  const payload = decodePayload(encodedPayload)

  return Boolean(payload && payload.exp > Math.floor(Date.now() / 1000))
}

function requestIsSameOrigin(request: NextRequest) {
  if (request.method === "GET" || request.method === "HEAD") {
    return true
  }

  const origin = request.headers.get("origin")

  if (!origin) {
    return false
  }

  return origin === request.nextUrl.origin
}

export function adminPasswordMatches(password: string) {
  const submittedHash = createHmac("sha256", getRequiredEnv("AUTH_SECRET"))
    .update(password)
    .digest()
  const expectedHash = createHmac("sha256", getRequiredEnv("AUTH_SECRET"))
    .update(getRequiredEnv("ADMIN_PASSWORD"))
    .digest()

  return timingSafeEqual(submittedHash, expectedHash)
}

export function createAdminSessionToken() {
  const now = Math.floor(Date.now() / 1000)
  const encodedPayload = encodePayload({
    exp: now + ADMIN_SESSION_MAX_AGE_SECONDS,
    iat: now,
    sub: "admin",
  })

  return `${encodedPayload}.${signValue(encodedPayload)}`
}

export function setAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}

export async function requireAdminSession(
  request?: NextRequest,
): Promise<AdminSession | null> {
  if (request && !requestIsSameOrigin(request)) {
    return null
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value

  return verifyAdminToken(token) ? { kind: "admin" } : null
}
