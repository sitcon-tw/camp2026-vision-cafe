import speakerConfig from "@shared/speakers.json"

export type SpeakerAssignment = {
  sessionIndex: number | null
  sessionLabel: string | null
  status: SpeakerAssignmentStatus
  studentId: string
  studentName: string
  speakerName: string | null
  teamName: string
}

export type AdminFlowControls = {
  speakerPreferenceSelectionOpen: boolean
  assignmentLookupOpen: boolean
}

export type StudentSpeakerPreference = {
  studentId: string
  studentName: string
  teamName: string
  preferenceOrder: string[]
  submittedAt: string | null
}

export type PlannedSpeakerAssignment = SpeakerAssignment & {
  preferenceRank: number | null
  priorityOrder: number
  submittedAt: string | null
  unassignedReason?: string
}

export type SpeakerAssignmentStatus = "assigned" | "unassigned"

export type SpeakerAssignmentPlan = {
  assignments: PlannedSpeakerAssignment[]
  assignedCount: number
  generatedAt: string
  sessionCapacity: number
  sessionLoads: SpeakerSessionLoad[]
  sessionsPerSpeaker: number
  speakerLoads: {
    speakerName: string
    count: number
  }[]
  totalCapacity: number
  unassignedCount: number
}

export type AssignmentGroup<TAssignment> = {
  assignments: TAssignment[]
  teamName: string
}

export type TeamAssignments = AssignmentGroup<SpeakerAssignment>

export type SpeakerSessionAssignments<TAssignment = SpeakerAssignment> =
  SpeakerSessionLoad & {
    assignments: TAssignment[]
  }

export type SpeakerSessionLoad = {
  count: number
  sessionIndex: number
  sessionLabel: string
  speakerName: string
}

export type Speaker = {
  speakerName: string
  avatar: string
  description: string
  links?: SpeakerLink[]
}

export type SpeakerLink = {
  label: string
  href: string
}

type SpeakerConfig = {
  sessionCapacity: number
  sessionCount: number
  speakers: Speaker[]
}

const typedSpeakerConfig = speakerConfig as SpeakerConfig

export const SPEAKER_SESSION_COUNT = typedSpeakerConfig.sessionCount
export const SPEAKER_SESSION_CAPACITY = typedSpeakerConfig.sessionCapacity

export function getSpeakerCandidates() {
  return typedSpeakerConfig.speakers
}

export function getSpeakerCandidateNames() {
  return typedSpeakerConfig.speakers.map((speaker) => speaker.speakerName)
}

export function getSpeakerCandidateByName(speakerName: string) {
  return typedSpeakerConfig.speakers.find(
    (speaker) => speaker.speakerName === speakerName,
  )
}

export function toSpeakerAssignment(
  assignment: PlannedSpeakerAssignment,
): SpeakerAssignment {
  return {
    sessionIndex: assignment.sessionIndex ?? null,
    sessionLabel: assignment.sessionLabel ?? null,
    speakerName: assignment.speakerName ?? null,
    status: assignment.status ?? "assigned",
    studentId: assignment.studentId,
    studentName: assignment.studentName,
    teamName: assignment.teamName,
  }
}

export function createTeamAssignments(
  assignments: PlannedSpeakerAssignment[],
): TeamAssignments[] {
  return groupAssignmentsByTeam(assignments.map(toSpeakerAssignment))
}

export function createSpeakerSessionAssignments(
  assignmentPlan: SpeakerAssignmentPlan,
): SpeakerSessionAssignments[] {
  return groupAssignmentsBySession(
    assignmentPlan.sessionLoads ?? [],
    assignmentPlan.assignments.map(toSpeakerAssignment),
  )
}

export function groupAssignmentsByTeam<
  TAssignment extends { teamName: string },
>(assignments: TAssignment[]): AssignmentGroup<TAssignment>[] {
  const teams = new Map<string, AssignmentGroup<TAssignment>>()

  for (const assignment of assignments) {
    const team =
      teams.get(assignment.teamName) ??
      ({
        assignments: [],
        teamName: assignment.teamName,
      } satisfies AssignmentGroup<TAssignment>)

    team.assignments.push(assignment)
    teams.set(assignment.teamName, team)
  }

  return Array.from(teams.values())
}

export function groupAssignmentsBySession<
  TAssignment extends {
    sessionIndex: number | null
    sessionLabel: string | null
    speakerName: string | null
    status: SpeakerAssignmentStatus
  },
>(
  sessionLoads: SpeakerSessionLoad[],
  assignments: TAssignment[],
): SpeakerSessionAssignments<TAssignment>[] {
  const sessions = new Map<string, SpeakerSessionAssignments<TAssignment>>()

  for (const sessionLoad of sessionLoads) {
    sessions.set(
      createSessionKey(sessionLoad.speakerName, sessionLoad.sessionIndex),
      {
        ...sessionLoad,
        assignments: [],
      },
    )
  }

  for (const assignment of assignments) {
    if (
      assignment.status !== "assigned" ||
      !assignment.speakerName ||
      !assignment.sessionIndex
    ) {
      continue
    }

    const sessionKey = createSessionKey(
      assignment.speakerName,
      assignment.sessionIndex,
    )
    const session =
      sessions.get(sessionKey) ??
      ({
        assignments: [],
        count: 0,
        sessionIndex: assignment.sessionIndex,
        sessionLabel:
          assignment.sessionLabel ??
          createSessionLabel(assignment.sessionIndex),
        speakerName: assignment.speakerName,
      } satisfies SpeakerSessionAssignments<TAssignment>)

    session.assignments.push(assignment)
    session.count = Math.max(session.count, session.assignments.length)
    sessions.set(sessionKey, session)
  }

  return Array.from(sessions.values())
}

export function createSessionKey(speakerName: string, sessionIndex: number) {
  return `${speakerName}:${sessionIndex}`
}

function createSessionLabel(sessionIndex: number) {
  return `第 ${sessionIndex} 場`
}
