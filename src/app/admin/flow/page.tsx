"use client"

import { CheckCircle2Icon, Settings2Icon, XCircleIcon } from "lucide-react"
import { useEffect, useState } from "react"

import type { AdminFlowControls } from "@/shared/data/vision-cafe"
import { Badge } from "@/shared/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { Label } from "@/shared/ui/label"
import { Spinner } from "@/shared/ui/spinner"
import { Switch } from "@/shared/ui/switch"

import { AdminSectionPage } from "../_components/admin-section-page"

export default function AdminFlowPage() {
  const [flowControls, setFlowControls] = useState<AdminFlowControls | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadFlowControls() {
      const response = await fetch("/api/admin/flow-controls")

      if (!response.ok) {
        setError("無法載入流程控制。")
        return
      }

      setFlowControls(await response.json())
    }

    void loadFlowControls()
  }, [])

  async function updateFlowControl(
    key: keyof AdminFlowControls,
    checked: boolean,
  ) {
    if (!flowControls) {
      return
    }

    const nextFlowControls = { ...flowControls, [key]: checked }

    setFlowControls(nextFlowControls)
    setError(null)

    const response = await fetch("/api/admin/flow-controls", {
      body: JSON.stringify(nextFlowControls),
      headers: {
        "Content-Type": "application/json",
      },
      method: "PUT",
    })

    if (!response.ok) {
      setFlowControls(flowControls)
      setError("流程控制更新失敗。")
    }
  }

  return (
    <AdminSectionPage title="流程控制">
      <Card className="max-h-[calc(100svh-10rem)] overflow-y-auto">
        <CardHeader className="gap-3">
          <Badge variant="outline">
            <Settings2Icon aria-hidden="true" data-icon="inline-start" />
            流程控制
          </Badge>
          <CardTitle className="text-2xl font-black tracking-tight">
            開放狀態
          </CardTitle>
          <CardDescription className="text-base leading-7">
            控制學員端目前可使用的志願選填與結果查詢流程。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {!flowControls ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm font-semibold">
              <Spinner aria-hidden="true" />
              載入中
            </div>
          ) : (
            <>
              <FlowControlSwitch
                id="speaker-preference-selection-open"
                title="講者志願選擇"
                description="開啟後學員可以送出或調整講者志願序。"
                checked={flowControls.speakerPreferenceSelectionOpen}
                onCheckedChange={(checked) =>
                  void updateFlowControl(
                    "speakerPreferenceSelectionOpen",
                    checked,
                  )
                }
              />
              <FlowControlSwitch
                id="assignment-lookup-open"
                title="查詢界面"
                description="開啟後學員可以查詢講者分配結果。"
                checked={flowControls.assignmentLookupOpen}
                onCheckedChange={(checked) =>
                  void updateFlowControl("assignmentLookupOpen", checked)
                }
              />
            </>
          )}
          {error ? (
            <p className="text-destructive text-sm font-semibold">{error}</p>
          ) : null}
        </CardContent>
      </Card>
    </AdminSectionPage>
  )
}

type FlowControlSwitchProps = {
  id: string
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function FlowControlSwitch({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: FlowControlSwitchProps) {
  return (
    <div className="border-ink bg-background flex items-start justify-between gap-4 rounded-[1rem] border-2 p-4">
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor={id} className="text-base">
          {title}
        </Label>
        <p className="text-muted-foreground text-sm leading-6">{description}</p>
        <Badge variant={checked ? "default" : "outline"}>
          {checked ? (
            <CheckCircle2Icon aria-hidden="true" data-icon="inline-start" />
          ) : (
            <XCircleIcon aria-hidden="true" data-icon="inline-start" />
          )}
          {checked ? "已開放" : "已關閉"}
        </Badge>
      </div>
      <Switch
        id={id}
        checked={checked}
        aria-label={title}
        onCheckedChange={onCheckedChange}
      />
    </div>
  )
}
