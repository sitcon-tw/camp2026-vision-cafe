import { ListChecksIcon, SearchIcon } from "lucide-react"
import Link from "next/link"

import { AppPageShell } from "@/components/ui/app-page-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  return (
    <AppPageShell title="講者志願系統" contentPlacement="center">
      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-black tracking-tight">
            選擇志願
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <a href="/select">
              <ListChecksIcon aria-hidden="true" data-icon="inline-start" />
              前往選擇
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-black tracking-tight">
            查詢分配結果
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
