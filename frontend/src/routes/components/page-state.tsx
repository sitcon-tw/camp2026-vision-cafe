import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AppPageShell } from "@/components/ui/app-page-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

type RouteLoadingPageProps = {
  backHref?: string
  title: string
}

export function RouteLoadingPage({ backHref, title }: RouteLoadingPageProps) {
  return (
    <AppPageShell title={title} backHref={backHref} backLabel="回到首頁">
      <Card>
        <CardContent className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
          <Spinner aria-hidden="true" />
          載入中
        </CardContent>
      </Card>
    </AppPageShell>
  )
}

type RouteErrorPageProps = {
  backHref?: string
  message: string
  title: string
}

export function RouteErrorPage({
  backHref,
  message,
  title,
}: RouteErrorPageProps) {
  return (
    <AppPageShell title={title} backHref={backHref} backLabel="回到首頁">
      <Alert variant="destructive">
        <CircleAlertIcon aria-hidden="true" />
        <AlertTitle>載入失敗</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
        </AlertDescription>
      </Alert>
    </AppPageShell>
  )
}
