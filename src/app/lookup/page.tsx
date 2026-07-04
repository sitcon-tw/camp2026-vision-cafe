import { getLookupPayload } from "@/shared/server/repositories"

import { LookupClient } from "./lookup-client"

export const dynamic = "force-dynamic"

export default async function LookupPage() {
  return <LookupClient initialLookup={await getLookupPayload()} />
}
