import { NextResponse } from "next/server"

import { getLookupPayload } from "@/shared/server/repositories"

export async function GET() {
  return NextResponse.json(await getLookupPayload())
}
