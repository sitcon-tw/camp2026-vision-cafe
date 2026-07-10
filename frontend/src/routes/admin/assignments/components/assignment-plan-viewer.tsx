import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  UsersIcon,
} from "lucide-react"

import type {
  PlannedSpeakerAssignment,
  SpeakerAssignmentPlan,
} from "@/lib/vision-cafe"
import {
  groupAssignmentsBySession,
  groupAssignmentsByTeam,
} from "@/lib/vision-cafe"
import { Badge } from "@/components/ui/badge"
import { ParticipantRoleBadge } from "@/components/participant-role-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { formatSubmittedAt } from "@/routes/admin/components/date-time"

type AssignmentPlanViewerProps = {
  assignmentPlan: SpeakerAssignmentPlan
}

export function AssignmentPlanViewer({
  assignmentPlan,
}: AssignmentPlanViewerProps) {
  const unassignedCount =
    assignmentPlan.unassignedStudentCount +
    assignmentPlan.unassignedCounselorCount

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
          {assignmentPlan.assignedStudentCount} /{" "}
          {assignmentPlan.studentCapacity} 位學員
        </Badge>
        <Badge variant="outline">
          {assignmentPlan.assignedCounselorCount} 位隊輔
        </Badge>
        <Badge variant={unassignedCount > 0 ? "destructive" : "outline"}>
          {unassignedCount > 0 ? (
            <AlertTriangleIcon aria-hidden="true" data-icon="inline-start" />
          ) : (
            <CheckCircle2Icon aria-hidden="true" data-icon="inline-start" />
          )}
          {unassignedCount} 未分配
        </Badge>
      </div>

      <TabsList className="w-full max-w-full min-w-0 shrink-0 justify-start overflow-x-auto">
        <TabsTrigger value="overview">總覽</TabsTrigger>
        <TabsTrigger value="sessions">場次視圖</TabsTrigger>
        <TabsTrigger value="teams">小隊視圖</TabsTrigger>
        <TabsTrigger value="students">參與者清單</TabsTrigger>
      </TabsList>

      <div className="min-h-0 flex-1 overflow-hidden">
        <TabsContent
          value="overview"
          className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto pr-1"
        >
          <AssignmentOverview assignmentPlan={assignmentPlan} />
        </TabsContent>
        <TabsContent
          value="sessions"
          className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto pr-1"
        >
          <SessionView assignmentPlan={assignmentPlan} />
        </TabsContent>
        <TabsContent
          value="teams"
          className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto pr-1"
        >
          <TeamView assignments={assignmentPlan.assignments} />
        </TabsContent>
        <TabsContent
          value="students"
          className="h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-auto pr-1"
        >
          <StudentAssignmentTable assignments={assignmentPlan.assignments} />
        </TabsContent>
      </div>
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
          label="學員總容量"
          value={`${assignmentPlan.studentCapacity} 位`}
        />
        <StatusTile
          label="已分配學員"
          value={`${assignmentPlan.assignedStudentCount} 位`}
        />
        <StatusTile
          label="已分配隊輔"
          value={`${assignmentPlan.assignedCounselorCount} 位`}
        />
        <StatusTile
          label="場次容量"
          value={`${assignmentPlan.sessionsPerSpeaker} 場 / 每場 ${assignmentPlan.sessionCapacity} 位`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {assignmentPlan.speakerLoads.map((load) => (
          <Badge key={load.speakerName} variant="outline">
            {load.speakerName}: {load.studentCount} 位學員＋
            {load.counselorCount} 位隊輔
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
                {sessionLoad.studentCount} / {assignmentPlan.sessionCapacity}{" "}
                位學員＋{sessionLoad.counselorCount} 位隊輔
              </TableCell>
              <TableCell>
                <CapacityBadge
                  count={sessionLoad.studentCount}
                  capacity={assignmentPlan.sessionCapacity}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {assignmentPlan.unassignedStudentCount > 0 ||
      assignmentPlan.unassignedCounselorCount > 0 ? (
        <p className="text-destructive text-sm font-semibold">
          有 {assignmentPlan.unassignedStudentCount} 位學員、
          {assignmentPlan.unassignedCounselorCount}{" "}
          位隊輔未分配，請檢查容量或名單資料。
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
    <div className="border-ink bg-background flex min-h-20 flex-col justify-between gap-2 rounded-[1rem] border-2 p-3 sm:min-h-24 sm:gap-3 sm:p-4">
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
                {session.studentCount} / {assignmentPlan.sessionCapacity}{" "}
                位學員＋{session.counselorCount} 位隊輔
              </p>
            </div>
            <CapacityBadge
              count={session.studentCount}
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
            <ParticipantCounts assignments={team.assignments} />
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
      <p className="text-muted-foreground text-sm font-semibold">
        尚無參與者。
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>參與者</TableHead>
          <TableHead>小隊</TableHead>
          <TableHead>講者 / 場次</TableHead>
          <TableHead>志願</TableHead>
          <TableHead>優先序</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.map((assignment) => (
          <TableRow key={assignment.studentId}>
            <TableCell>
              <div className="flex flex-wrap items-center gap-2">
                {assignment.studentName}
                <ParticipantRoleBadge role={assignment.participantRole} />
              </div>
            </TableCell>
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
          <TableHead>參與者</TableHead>
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
                <span className="flex flex-wrap items-center gap-2 font-black">
                  {assignment.studentName}
                  <ParticipantRoleBadge role={assignment.participantRole} />
                </span>
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

function ParticipantCounts({
  assignments,
}: {
  assignments: PlannedSpeakerAssignment[]
}) {
  const studentCount = assignments.filter(
    (assignment) => assignment.participantRole === "student",
  ).length
  const counselorCount = assignments.length - studentCount

  return (
    <Badge variant="outline">
      {studentCount} 位學員＋{counselorCount} 位隊輔
    </Badge>
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
