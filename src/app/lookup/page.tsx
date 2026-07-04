import { getLookupPayload } from "@/lib/server/repositories"

import { LookupClient } from "./_components/lookup-client"

export const dynamic = "force-dynamic"

export default async function LookupPage() {
  return <LookupClient initialLookup={await getLookupPayload()} />
}
