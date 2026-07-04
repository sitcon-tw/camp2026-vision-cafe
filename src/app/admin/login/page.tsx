"use client"

import { LockKeyholeIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AppPageShell } from "@/components/ui/app-page-shell"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    const response = await fetch("/api/admin/login", {
      body: JSON.stringify({ password }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })

    if (response.ok) {
      const callbackUrl = new URLSearchParams(window.location.search).get(
        "callbackUrl",
      )
      const safeCallbackUrl =
        callbackUrl?.startsWith("/admin") && callbackUrl !== "/admin/login"
          ? callbackUrl
          : "/admin/flow"

      router.push(safeCallbackUrl)
      router.refresh()
      return
    }

    setError("密碼不正確。")
    setSubmitting(false)
  }

  return (
    <AppPageShell title="Admin 登入" contentPlacement="center">
      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-black tracking-tight">
            管理員登入
          </CardTitle>
          <CardDescription className="text-base leading-7">
            請輸入後台固定密碼。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="admin-password">密碼</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            {error ? (
              <Alert variant="destructive">
                <LockKeyholeIcon aria-hidden="true" />
                <AlertTitle>登入失敗</AlertTitle>
                <AlertDescription>
                  <p>{error}</p>
                </AlertDescription>
              </Alert>
            ) : null}

            <Button type="submit" size="lg" disabled={submitting || !password}>
              {submitting ? <Spinner aria-hidden="true" /> : null}
              {submitting ? "登入中" : "登入"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppPageShell>
  )
}
