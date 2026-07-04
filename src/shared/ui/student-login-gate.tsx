"use client"

import { GithubIcon } from "lucide-react"
import { signIn } from "next-auth/react"

import { AppPageShell } from "@/shared/ui/app-page-shell"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"

type StudentLoginGateProps = {
  callbackUrl?: string
}

export function StudentLoginGate({
  callbackUrl = "/select",
}: StudentLoginGateProps) {
  return (
    <AppPageShell title="學員登入" contentPlacement="center">
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
            onClick={() => void signIn("github", { callbackUrl })}
          >
            <GithubIcon aria-hidden="true" />
            使用 GitHub 登入
          </Button>
        </CardContent>
      </Card>
    </AppPageShell>
  )
}
