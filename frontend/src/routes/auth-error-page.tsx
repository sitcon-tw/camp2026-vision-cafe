import { Link } from "react-router-dom"

import { AppPageShell } from "@/components/ui/app-page-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function AuthErrorPage() {
  return (
    <AppPageShell title="登入失敗" contentPlacement="center">
      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-black tracking-tight">
            無法使用此 GitHub 帳號登入
          </CardTitle>
          <CardDescription className="text-base leading-7">
            請確認你的 GitHub username 已填入小隊名單，並重新登入。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg" className="w-full">
            <Link to="/select">重新登入</Link>
          </Button>
        </CardContent>
      </Card>
    </AppPageShell>
  )
}
