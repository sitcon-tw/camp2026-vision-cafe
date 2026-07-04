"use client"

import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  PlayIcon,
  SendIcon,
  UsersIcon,
} from "lucide-react"
import { useState } from "react"

import type { AdminAssignmentPlanPayload } from "@/lib/vision-cafe-api"
import type {
  PlannedSpeakerAssignment,
  SpeakerAssignmentPlan,
} from "@/lib/vision-cafe"
import {
  groupAssignmentsBySession,
  groupAssignmentsByTeam,
} from "@/lib/vision-cafe"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { fetchAdmin } from "@/app/admin/_components/api-client"
import { AdminSectionPage } from "@/app/admin/_components/section-page"
import { formatSubmittedAt } from "@/app/admin/_components/date-time"

export default function AdminAssignmentsPage() {
  const [assignmentPlan, setAssignmentPlan] =
    useState<SpeakerAssignmentPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)

  async function runDryRun() {
    setGenerating(true)
    setPublished(false)
    setError(null)

    const response = await fetchAdmin("/api/admin/assignments/dry-run", {
      method: "POST",
    })

    if (!response.ok) {
      setError("Dry run 產生失敗。")
      setGenerating(false)
      return
    }

    const payload = (await response.json()) as AdminAssignmentPlanPayload

    setAssignmentPlan(payload.assignmentPlan)
    setGenerating(false)
  }

  async function publishAssignmentPlan() {
    setPublishing(true)
    setError(null)

    const response = await fetchAdmin("/api/admin/assignments/publish", {
      method: "POST",
    })

    if (!response.ok) {
      setError("正式分配發布失敗。")
      setPublishing(false)
      return
    }

    const payload = (await response.json()) as AdminAssignmentPlanPayload

    setAssignmentPlan(payload.assignmentPlan)
    setPublished(true)
    setPublishing(false)
  }

  return (
    <AdminSectionPage title="分配控制">
      <Card className="max-h-[calc(100svh-10rem)] w-full min-w-0 max-w-full overflow-hidden">
        <CardHeader className="gap-3 has-data-[slot=card-action]:grid-cols-1 sm:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
          <Badge variant="outline">
            <ClipboardListIcon aria-hidden="true" data-icon="inline-start" />
            分配控制
          </Badge>
          <CardTitle className="text-2xl font-black tracking-tight">
            一鍵分配場次
          </CardTitle>
          <CardDescription className="text-base leading-7">
            依送出時間、講者志願與場次容量產生分配結果。每位講者 2 個場次，每場
            12 位學員。
          </CardDescription>
          <CardAction className="col-start-1 row-span-1 row-start-auto justify-self-start sm:col-start-2 sm:row-span-2 sm:row-start-1 sm:justify-self-end">
            <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={generating}
                onClick={runDryRun}
              >
                {generating ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <PlayIcon aria-hidden="true" data-icon="inline-start" />
                )}
                {generating ? "產生中" : "產生 dry run"}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!assignmentPlan || publishing}
                onClick={publishAssignmentPlan}
              >
                {publishing ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <SendIcon aria-hidden="true" data-icon="inline-start" />
                )}
                {publishing ? "發布中" : "發布正式分配"}
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex min-h-0 min-w-0 flex-col gap-4 overflow-hidden">
          {assignmentPlan ? (
            <AssignmentPlanPreview assignmentPlan={assignmentPlan} />
          ) : (
            <div className="border-ink bg-background flex min-h-64 flex-col items-center justify-center gap-3 rounded-[1rem] border-2 p-6 text-center">
              <ClipboardListIcon aria-hidden="true" className="size-8" />
              <p className="text-lg font-black">尚未產生分配結果</p>
              <p className="text-muted-foreground max-w-lg text-sm leading-6">
                先產生 dry run，確認場次與小隊分配狀態後再發布正式分配。
              </p>
            </div>
          )}
          {error ? (
            <p className="text-destructive shrink-0 text-sm font-semibold">
              {error}
            </p>
          ) : null}
          {published ? (
            <p className="shrink-0 text-sm font-black">已發布正式分配。</p>
          ) : null}
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
    <Tabs
      defaultValue="overview"
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge variant="secondary">
          <CalendarClockIcon aria-hidden="true" data-icon="inline-start" />
          {formatSubmittedAt(assignmentPlan.generatedAt)}
        </Badge>
        <Badge variant="outline">
          <UsersIcon aria-hidden="true" data-icon="inline-start" />
          {assignmentPlan.assignedCount} / {assignmentPlan.totalCapacity} 已分配
        </Badge>
        <Badge
          variant={
            assignmentPlan.unassignedCount > 0 ? "destructive" : "outline"
          }
        >
          {assignmentPlan.unassignedCount > 0 ? (
            <AlertTriangleIcon aria-hidden="true" data-icon="inline-start" />
          ) : (
            <CheckCircle2Icon aria-hidden="true" data-icon="inline-start" />
          )}
          {assignmentPlan.unassignedCount} 未分配
        </Badge>
      </div>

      <TabsList className="w-full min-w-0 max-w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">總覽</TabsTrigger>
        <TabsTrigger value="sessions">場次視圖</TabsTrigger>
        <TabsTrigger value="teams">小隊視圖</TabsTrigger>
        <TabsTrigger value="students">學員清單</TabsTrigger>
      </TabsList>

      <TabsContent
        value="overview"
        className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1"
      >
        <AssignmentOverview assignmentPlan={assignmentPlan} />
      </TabsContent>
      <TabsContent
        value="sessions"
        className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1"
      >
        <SessionView assignmentPlan={assignmentPlan} />
      </TabsContent>
      <TabsContent
        value="teams"
        className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1"
      >
        <TeamView assignments={assignmentPlan.assignments} />
      </TabsContent>
      <TabsContent
        value="students"
        className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1"
      >
        <StudentAssignmentTable assignments={assignmentPlan.assignments} />
      </TabsContent>
    </Tabs>
  )
}

type AssignmentOverviewProps = {
  assignmentPlan: SpeakerAssignmentPlan
}

function AssignmentOverview({ assignmentPlan }: AssignmentOverviewProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusTile
          label="總容量"
          value={`${assignmentPlan.totalCapacity} 位`}
        />
        <StatusTile
          label="已分配"
          value={`${assignmentPlan.assignedCount} 位`}
        />
        <StatusTile
          label="未分配"
          value={`${assignmentPlan.unassignedCount} 位`}
          tone={assignmentPlan.unassignedCount > 0 ? "destructive" : "default"}
        />
        <StatusTile
          label="場次容量"
          value={`${assignmentPlan.sessionsPerSpeaker} 場 / 每場 ${assignmentPlan.sessionCapacity} 位`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {assignmentPlan.speakerLoads.map((load) => (
          <Badge key={load.speakerName} variant="outline">
            {load.speakerName}: {load.count} 位
          </Badge>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>講者</TableHead>
            <TableHead>場次</TableHead>
            <TableHead>人數</TableHead>
            <TableHead>狀態</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignmentPlan.sessionLoads.map((sessionLoad) => (
            <TableRow
              key={`${sessionLoad.speakerName}-${sessionLoad.sessionIndex}`}
            >
              <TableCell>{sessionLoad.speakerName}</TableCell>
              <TableCell>{sessionLoad.sessionLabel}</TableCell>
              <TableCell>
                {sessionLoad.count} / {assignmentPlan.sessionCapacity}
              </TableCell>
              <TableCell>
                <CapacityBadge
                  count={sessionLoad.count}
                  capacity={assignmentPlan.sessionCapacity}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {assignmentPlan.unassignedCount > 0 ? (
        <p className="text-destructive text-sm font-semibold">
          有 {assignmentPlan.unassignedCount}{" "}
          位學員未分配，請檢查總容量或志願資料。
        </p>
      ) : null}
    </div>
  )
}

type StatusTileProps = {
  label: string
  value: string
  tone?: "default" | "destructive"
}

function StatusTile({ label, value, tone = "default" }: StatusTileProps) {
  return (
    <div className="border-ink bg-background flex min-h-24 flex-col justify-between gap-3 rounded-[1rem] border-2 p-4">
      <span className="text-muted-foreground text-sm font-semibold">
        {label}
      </span>
      <span
        className={
          tone === "destructive"
            ? "text-destructive text-2xl font-black"
            : "text-2xl font-black"
        }
      >
        {value}
      </span>
    </div>
  )
}

type SessionViewProps = {
  assignmentPlan: SpeakerAssignmentPlan
}

function SessionView({ assignmentPlan }: SessionViewProps) {
  const sessions = groupAssignmentsBySession(
    assignmentPlan.sessionLoads,
    assignmentPlan.assignments,
  )

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {sessions.map((session) => (
        <div
          key={`${session.speakerName}-${session.sessionIndex}`}
          className="border-ink bg-background flex min-w-0 flex-col gap-3 overflow-hidden rounded-[1rem] border-2 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col gap-1">
              <h3 className="text-lg font-black">
                {session.speakerName} / {session.sessionLabel}
              </h3>
              <p className="text-muted-foreground text-sm font-semibold">
                {session.count} / {assignmentPlan.sessionCapacity} 位學員
              </p>
            </div>
            <CapacityBadge
              count={session.count}
              capacity={assignmentPlan.sessionCapacity}
            />
          </div>
          <AssignmentMiniTable assignments={session.assignments} />
        </div>
      ))}
    </div>
  )
}

type TeamViewProps = {
  assignments: PlannedSpeakerAssignment[]
}

function TeamView({ assignments }: TeamViewProps) {
  const teams = groupAssignmentsByTeam(assignments)

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {teams.map((team) => (
        <div
          key={team.teamName}
          className="border-ink bg-background flex min-w-0 flex-col gap-3 overflow-hidden rounded-[1rem] border-2 p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-black">{team.teamName}</h3>
            <Badge variant="outline">{team.assignments.length} 位學員</Badge>
          </div>
          <AssignmentMiniTable assignments={team.assignments} />
        </div>
      ))}
    </div>
  )
}

type AssignmentMiniTableProps = {
  assignments: PlannedSpeakerAssignment[]
}

function AssignmentMiniTable({ assignments }: AssignmentMiniTableProps) {
  if (!assignments.length) {
    return (
      <p className="text-muted-foreground text-sm font-semibold">尚無學員。</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>學員</TableHead>
          <TableHead>小隊</TableHead>
          <TableHead>講者 / 場次</TableHead>
          <TableHead>志願</TableHead>
          <TableHead>優先序</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.studentId}>
            <TableCell>{assignment.studentName}</TableCell>
            <TableCell>{assignment.teamName}</TableCell>
            <TableCell>
              <AssignmentTarget assignment={assignment} />
            </TableCell>
            <TableCell>
              <PreferenceBadge assignment={assignment} />
            </TableCell>
            <TableCell>#{assignment.priorityOrder}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

type StudentAssignmentTableProps = {
  assignments: PlannedSpeakerAssignment[]
}

function StudentAssignmentTable({ assignments }: StudentAssignmentTableProps) {
  return (
    <Table>
      <TableHeader className="sticky top-0 z-10">
        <TableRow>
          <TableHead>學員</TableHead>
          <TableHead>講者 / 場次</TableHead>
          <TableHead>命中志願</TableHead>
          <TableHead>送出時間</TableHead>
          <TableHead>優先序</TableHead>
          <TableHead>狀態</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.studentId}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="font-black">{assignment.studentName}</span>
                <span className="text-muted-foreground text-xs">
                  {assignment.studentId} / {assignment.teamName}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <AssignmentTarget assignment={assignment} />
            </TableCell>
            <TableCell>
              <PreferenceBadge assignment={assignment} />
            </TableCell>
            <TableCell>{formatSubmittedAt(assignment.submittedAt)}</TableCell>
            <TableCell>#{assignment.priorityOrder}</TableCell>
            <TableCell>
              <AssignmentStatusBadge assignment={assignment} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

type AssignmentDisplayProps = {
  assignment: PlannedSpeakerAssignment
}

function AssignmentTarget({ assignment }: AssignmentDisplayProps) {
  if (assignment.status !== "assigned" || !assignment.speakerName) {
    return <Badge variant="destructive">未分配</Badge>
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge>{assignment.speakerName}</Badge>
      <Badge variant="outline">{assignment.sessionLabel ?? "未標示場次"}</Badge>
    </div>
  )
}

function PreferenceBadge({ assignment }: AssignmentDisplayProps) {
  if (!assignment.preferenceRank) {
    return <Badge variant="outline">未命中</Badge>
  }

  return <Badge variant="secondary">第 {assignment.preferenceRank} 志願</Badge>
}

function AssignmentStatusBadge({ assignment }: AssignmentDisplayProps) {
  if (assignment.status === "assigned") {
    return <Badge variant="outline">已分配</Badge>
  }

  return (
    <Badge variant="destructive">
      {assignment.unassignedReason ?? "未分配"}
    </Badge>
  )
}

type CapacityBadgeProps = {
  capacity: number
  count: number
}

function CapacityBadge({ capacity, count }: CapacityBadgeProps) {
  if (count >= capacity) {
    return <Badge variant="secondary">已滿</Badge>
  }

  return <Badge variant="outline">尚餘 {capacity - count} 位</Badge>
}
