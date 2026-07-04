"use client"

import { CalendarClockIcon, ClipboardListIcon, PlayIcon } from "lucide-react"
import { useState } from "react"

import {
  createSpeakerAssignmentPlan,
  getStudentSpeakerPreferences,
  type SpeakerAssignmentPlan,
} from "@/shared/data/vision-cafe"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table"

import { AdminSectionPage } from "../_components/admin-section-page"
import { formatSubmittedAt } from "../_components/admin-format"

export default function AdminAssignmentsPage() {
  const preferences = getStudentSpeakerPreferences()
  const [assignmentPlan, setAssignmentPlan] =
    useState<SpeakerAssignmentPlan | null>(null)

  function runDryRun() {
    setAssignmentPlan(createSpeakerAssignmentPlan(preferences))
  }

  return (
    <AdminSectionPage title="分配控制">
      <Card className="max-h-[calc(100svh-10rem)] overflow-y-auto">
        <CardHeader className="gap-3">
          <Badge variant="outline">
            <ClipboardListIcon aria-hidden="true" data-icon="inline-start" />
            分配控制
          </Badge>
          <CardTitle className="text-2xl font-black tracking-tight">
            一鍵分配場次
          </CardTitle>
          <CardDescription className="text-base leading-7">
            dry run 與正式分配共用同一個 pure planner；正式分配之後只需要把 plan
            寫入資料庫。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" size="lg" onClick={runDryRun}>
                <PlayIcon aria-hidden="true" data-icon="inline-start" />
                產生 dry run
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-hidden sm:max-w-3xl">
              <DialogHeader>
                <DialogTitle>分配 dry run</DialogTitle>
                <DialogDescription>
                  這次預覽會處理 {preferences.length} 位學員，尚未寫入正式結果。
                </DialogDescription>
              </DialogHeader>

              {assignmentPlan ? (
                <AssignmentPlanPreview assignmentPlan={assignmentPlan} />
              ) : null}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    關閉
                  </Button>
                </DialogClose>
                <Button type="button" disabled>
                  確認分配
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </AdminSectionPage>
  )
}

type AssignmentPlanPreviewProps = {
  assignmentPlan: SpeakerAssignmentPlan
}

function AssignmentPlanPreview({ assignmentPlan }: AssignmentPlanPreviewProps) {
  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap gap-2">
        <Badge variant="secondary">
          <CalendarClockIcon aria-hidden="true" data-icon="inline-start" />
          {formatSubmittedAt(assignmentPlan.generatedAt)}
        </Badge>
        {assignmentPlan.speakerLoads.map((load) => (
          <Badge key={load.speakerName} variant="outline">
            {load.speakerName}: {load.count} 位
          </Badge>
        ))}
      </div>

      <div className="max-h-[min(58dvh,32rem)] min-h-0 overflow-y-auto pr-1">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>學員</TableHead>
              <TableHead>分配講者</TableHead>
              <TableHead>命中志願</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignmentPlan.assignments.map((assignment) => (
              <TableRow key={assignment.studentId}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-black">{assignment.studentName}</span>
                    <span className="text-muted-foreground text-xs">
                      {assignment.teamName}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{assignment.speakerName}</TableCell>
                <TableCell>
                  {assignment.preferenceRank ? (
                    <Badge>第 {assignment.preferenceRank} 志願</Badge>
                  ) : (
                    <Badge variant="outline">未填志願</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
