import { ClockIcon, UsersIcon } from "lucide-react"
import { useMemo, useState } from "react"

import type { LookupPayload } from "@/lib/vision-cafe-api"
import { AppPageShell } from "@/components/ui/app-page-shell"
import { ParticipantRoleBadge } from "@/components/participant-role-badge"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  createSessionKey,
  getSpeakerCandidateByName,
  type SpeakerAssignment,
  type SpeakerSessionAssignments,
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
  const sessions = useMemo(
    () => (initialLookup.state === "ready" ? initialLookup.sessions : []),
    [initialLookup],
  )
  const teamNames = teams.map((team) => team.teamName)
  const sessionKeys = sessions.map((session) =>
    createSessionKey(session.speakerName, session.sessionIndex),
  )
  const [selectedTeamName, setSelectedTeamName] = useState(teamNames[0] ?? "")
  const [selectedSessionKey, setSelectedSessionKey] = useState(
    sessionKeys[0] ?? "",
  )

  const selectedTeam = useMemo(
    () => teams.find((team) => team.teamName === selectedTeamName) ?? teams[0],
    [selectedTeamName, teams],
  )
  const selectedSession = useMemo(
    () =>
      sessions.find(
        (session) =>
          createSessionKey(session.speakerName, session.sessionIndex) ===
          selectedSessionKey,
      ) ?? sessions[0],
    [selectedSessionKey, sessions],
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
      <Tabs defaultValue="teams" className="min-h-0">
        <TabsList className="w-full">
          <TabsTrigger value="teams">小隊查詢</TabsTrigger>
          <TabsTrigger value="sessions">場次查詢</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="flex flex-col gap-5">
          <Card>
            <CardHeader className="gap-3">
              <CardTitle className="text-2xl font-black tracking-tight">
                選擇組別
              </CardTitle>
              <CardDescription className="text-base leading-7">
                查看該組每位學員與隊輔的講者及場次。
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
        </TabsContent>

        <TabsContent value="sessions" className="flex flex-col gap-5">
          <Card>
            <CardHeader className="gap-3">
              <CardTitle className="text-2xl font-black tracking-tight">
                選擇場次
              </CardTitle>
              <CardDescription className="text-base leading-7">
                依講者場次查看該場學員與隊輔名單。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NativeSelect
                value={
                  selectedSession
                    ? createSessionKey(
                        selectedSession.speakerName,
                        selectedSession.sessionIndex,
                      )
                    : ""
                }
                aria-label="選擇場次"
                className="w-full"
                onChange={(event) => setSelectedSessionKey(event.target.value)}
              >
                {sessions.map((session) => (
                  <NativeSelectOption
                    key={createSessionKey(
                      session.speakerName,
                      session.sessionIndex,
                    )}
                    value={createSessionKey(
                      session.speakerName,
                      session.sessionIndex,
                    )}
                  >
                    {session.speakerName} / {session.sessionLabel}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </CardContent>
          </Card>

          {selectedSession ? (
            <SessionAssignmentList session={selectedSession} />
          ) : null}
        </TabsContent>
      </Tabs>
    </AppPageShell>
  )
}

type TeamAssignmentListProps = {
  team: TeamAssignments
}

function TeamAssignmentList({ team }: TeamAssignmentListProps) {
  const studentCount = team.assignments.filter(
    (assignment) => assignment.participantRole === "student",
  ).length
  const counselorCount = team.assignments.length - studentCount

  return (
    <Card>
      <CardHeader className="gap-3">
        <Badge variant="outline" className="w-fit">
          <UsersIcon aria-hidden="true" data-icon="inline-start" />
          {studentCount} 位學員＋{counselorCount} 位隊輔
        </Badge>
        <CardTitle className="text-2xl font-black tracking-tight">
          {team.teamName}
        </CardTitle>
        <CardDescription className="text-base leading-7">
          學員與隊輔名單及其對應的講者場次。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {team.assignments.map((assignment) => (
            <AssignmentRow key={assignment.studentId} assignment={assignment} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type SessionAssignmentListProps = {
  session: SpeakerSessionAssignments
}

function SessionAssignmentList({ session }: SessionAssignmentListProps) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <Badge variant="outline" className="w-fit">
          <ClockIcon aria-hidden="true" data-icon="inline-start" />
          {session.studentCount} 位學員＋{session.counselorCount} 位隊輔
        </Badge>
        <CardTitle className="text-2xl font-black tracking-tight">
          {session.speakerName} / {session.sessionLabel}
        </CardTitle>
        <CardDescription className="text-base leading-7">
          這個場次的學員與隊輔名單。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {session.assignments.length ? (
            session.assignments.map((assignment) => (
              <AssignmentRow
                key={assignment.studentId}
                assignment={assignment}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm font-semibold">
              這個場次目前沒有參與者。
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

type AssignmentRowProps = {
  assignment: SpeakerAssignment
}

function AssignmentRow({ assignment }: AssignmentRowProps) {
  const speaker = assignment.speakerName
    ? getSpeakerCandidateByName(assignment.speakerName)
    : null

  return (
    <div className="border-ink bg-background flex items-center justify-between gap-3 rounded-[1rem] border-2 px-4 py-3">
      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-base font-black">
        {assignment.studentName}
        <ParticipantRoleBadge role={assignment.participantRole} />
      </span>
      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
        <Badge variant={speaker ? "default" : "destructive"}>
          {assignment.speakerName ?? "未分配"}
        </Badge>
        {assignment.status === "assigned" ? (
          <Badge variant="outline">
            {assignment.sessionLabel ?? "未標示場次"}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}
