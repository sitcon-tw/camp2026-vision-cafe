import { GithubIcon } from "lucide-react"

import { AppPageShell } from "@/components/ui/app-page-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { startGithubLogin } from "@/lib/auth-client"

type StudentLoginGateProps = {
  callbackUrl?: string
}

export function StudentLoginGate({
  callbackUrl = "/select",
}: StudentLoginGateProps) {
  return (
    <AppPageShell
      title="學員登入"
      contentPlacement="center"
      backHref="/"
      backLabel="回到首頁"
    >
      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-black tracking-tight">
            使用 GitHub 進入選填
          </CardTitle>
          <CardDescription className="text-base leading-7">
            請使用名單上的 GitHub 帳號登入。登入成功後會回到講者志願選填頁面。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={() => startGithubLogin(callbackUrl)}
          >
            <GithubIcon aria-hidden="true" />
            使用 GitHub 登入
          </Button>
        </CardContent>
      </Card>
    </AppPageShell>
  )
}
