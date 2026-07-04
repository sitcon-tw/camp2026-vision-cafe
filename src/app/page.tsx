import { ListChecksIcon, SearchIcon } from "lucide-react"
import Link from "next/link"

import { AppPageShell } from "@/shared/ui/app-page-shell"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card"

export default function LoginPage() {
  return (
    <AppPageShell>
      <header className="flex flex-col gap-2 pt-1">
        <p className="text-muted-foreground text-sm leading-6">視界咖啡館</p>
        <h1 className="text-4xl leading-tight font-black tracking-tight">
          講者志願系統
        </h1>
      </header>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-black tracking-tight">
            選擇講者志願
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <a href="/select">
              <ListChecksIcon aria-hidden="true" data-icon="inline-start" />
              選擇講者志願
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-black tracking-tight">
            查詢分配講者
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/lookup">
              <SearchIcon aria-hidden="true" data-icon="inline-start" />
              前往查詢
            </Link>
          </Button>
        </CardContent>
      </Card>
    </AppPageShell>
  )
}
