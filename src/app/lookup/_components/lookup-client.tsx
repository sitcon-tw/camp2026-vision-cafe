"use client"

import { UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"

import type { LookupPayload } from "@/lib/vision-cafe-api"
import { AppPageShell } from "@/components/ui/app-page-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

import {
  getSpeakerCandidateByName,
  type SpeakerAssignment,
  type TeamAssignments,
} from "@/lib/vision-cafe"

type LookupClientProps = {
  initialLookup: LookupPayload
}

export function LookupClient({ initialLookup }: LookupClientProps) {
  const teams = useMemo(
    () => (initialLookup.state === "ready" ? initialLookup.teams : []),
    [initialLookup],
  )
  const teamNames = teams.map((team) => team.teamName)
  const [selectedTeamName, setSelectedTeamName] = useState(teamNames[0] ?? "")

  const selectedTeam = useMemo(
    () => teams.find((team) => team.teamName === selectedTeamName) ?? teams[0],
    [selectedTeamName, teams],
  )

  if (initialLookup.state === "closed") {
    return (
      <AppPageShell title="分配講者查詢" backHref="/" backLabel="回到首頁">
        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl font-black tracking-tight">
              查詢尚未開放
            </CardTitle>
            <CardDescription className="text-base leading-7">
              請等待工作人員開放結果查詢。
            </CardDescription>
          </CardHeader>
        </Card>
      </AppPageShell>
    )
  }

  if (initialLookup.state === "empty") {
    return (
      <AppPageShell title="分配講者查詢" backHref="/" backLabel="回到首頁">
        <Card>
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl font-black tracking-tight">
              尚無分配結果
            </CardTitle>
            <CardDescription className="text-base leading-7">
              目前還沒有正式發布的講者分配。
            </CardDescription>
          </CardHeader>
        </Card>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell title="分配講者查詢" backHref="/" backLabel="回到首頁">
      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-black tracking-tight">
            選擇組別
          </CardTitle>
          <CardDescription className="text-base leading-7">
            每次只顯示一組的講者分配結果。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NativeSelect
            value={selectedTeam?.teamName ?? ""}
            aria-label="選擇組別"
            className="w-full"
            onChange={(event) => setSelectedTeamName(event.target.value)}
          >
            {teamNames.map((teamName) => (
              <NativeSelectOption key={teamName} value={teamName}>
                {teamName}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </CardContent>
      </Card>

      {selectedTeam ? <TeamAssignmentList team={selectedTeam} /> : null}
    </AppPageShell>
  )
}

type TeamAssignmentListProps = {
  team: TeamAssignments
}

function TeamAssignmentList({ team }: TeamAssignmentListProps) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <Badge variant="outline" className="w-fit">
          <UsersIcon aria-hidden="true" data-icon="inline-start" />
          {team.assignments.length} 位學生
        </Badge>
        <CardTitle className="text-2xl font-black tracking-tight">
          {team.teamName}
        </CardTitle>
        <CardDescription className="text-base leading-7">
          學生名單與右側對應的分配講者。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {team.assignments.map((assignment) => (
            <AssignmentRow
              key={assignment.studentName}
              assignment={assignment}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type AssignmentRowProps = {
  assignment: SpeakerAssignment
}

function AssignmentRow({ assignment }: AssignmentRowProps) {
  const speaker = getSpeakerCandidateByName(assignment.speakerName)

  return (
    <div className="border-ink bg-background flex items-center justify-between gap-3 rounded-[1rem] border-2 px-4 py-3">
      <span className="min-w-0 flex-1 text-base font-black">
        {assignment.studentName}
      </span>
      <Badge variant={speaker ? "default" : "destructive"} className="shrink-0">
        {assignment.speakerName}
      </Badge>
    </div>
  )
}
