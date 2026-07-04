import { NextResponse } from "next/server"

import { getLookupPayload } from "@/lib/server/repositories"

export async function GET() {
  return NextResponse.json(await getLookupPayload())
}
