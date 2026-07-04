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
  speaker_name: string
  avatar: string
  description: string
  links?: SpeakerLink[]
}

export type SpeakerLink = {
  label: string
  href: string
}

const speakerCandidates: Speaker[] = [
  {
    speaker_name: "林予安",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23F4C84A'/%3E%3Ccircle cx='34' cy='39' r='7' fill='%2317233A'/%3E%3Ccircle cx='62' cy='39' r='7' fill='%2317233A'/%3E%3Cpath d='M31 62c8 8 26 8 34 0' fill='none' stroke='%2317233A' stroke-width='7' stroke-linecap='round'/%3E%3C/svg%3E",
    description:
      "專注於產品策略與跨域協作，擅長把模糊的使用者洞察整理成可執行的專案方向。",
    links: [
      {
        label: "產品策略文章",
        href: "https://medium.com/tag/product-strategy",
      },
      {
        label: "使用者洞察方法",
        href: "https://www.nngroup.com/articles/user-research-methods/",
      },
    ],
  },
  {
    speaker_name: "陳以晨",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%2331A886'/%3E%3Ccircle cx='35' cy='40' r='7' fill='%23FFF8E9'/%3E%3Ccircle cx='61' cy='40' r='7' fill='%23FFF8E9'/%3E%3Cpath d='M29 64c10 6 28 6 38 0' fill='none' stroke='%23FFF8E9' stroke-width='7' stroke-linecap='round'/%3E%3C/svg%3E",
    description:
      "長期帶領工程與設計團隊打造學習型產品，重視快速驗證、清楚溝通與團隊節奏。",
    links: [
      {
        label: "學習型產品案例",
        href: "https://www.edutopia.org/topic/project-based-learning",
      },
      {
        label: "快速驗證與產品實驗",
        href: "https://www.strategyzer.com/library/testing-business-ideas",
      },
    ],
  },
]

export const SPEAKER_SESSION_COUNT = 2
export const SPEAKER_SESSION_CAPACITY = 12

export function getSpeakerCandidates() {
  return speakerCandidates
}

export function getSpeakerCandidateNames() {
  return speakerCandidates.map((speaker) => speaker.speaker_name)
}

export function getSpeakerCandidateByName(speakerName: string) {
  return speakerCandidates.find(
    (speaker) => speaker.speaker_name === speakerName,
  )
}

export function createSpeakerAssignmentPlan(
  preferences: StudentSpeakerPreference[],
  generatedAt = new Date().toISOString(),
  random = Math.random,
): SpeakerAssignmentPlan {
  const speakerNames = getSpeakerCandidateNames()
  const speakerLoads = speakerNames.map((speakerName) => ({
    speakerName,
    count: 0,
  }))
  const sessionLoads = speakerNames.flatMap((speakerName) =>
    Array.from({ length: SPEAKER_SESSION_COUNT }, (_, index) => ({
      count: 0,
      sessionIndex: index + 1,
      sessionLabel: createSessionLabel(index + 1),
      speakerName,
    })),
  )
  const indexedPreferences = preferences.map((preference, index) => ({
    index,
    preference,
  }))
  const assignmentResults = new Map<number, PlannedSpeakerAssignment>()
  const prioritizedPreferences = createPrioritizedPreferences(
    indexedPreferences,
    random,
  )

  for (const [priorityIndex, item] of prioritizedPreferences.entries()) {
    const preference = item.preference
    const assignedSession =
      preference.preferenceOrder.length > 0
        ? findPreferredAvailableSession(preference.preferenceOrder, sessionLoads)
        : findRandomAvailableSession(sessionLoads, random)

    if (!assignedSession) {
      assignmentResults.set(item.index, {
        preferenceRank: null,
        priorityOrder: priorityIndex + 1,
        sessionIndex: null,
        sessionLabel: null,
        speakerName: null,
        status: "unassigned",
        studentId: preference.studentId,
        studentName: preference.studentName,
        submittedAt: preference.submittedAt,
        teamName: preference.teamName,
        unassignedReason: "所有講者場次皆已額滿",
      })
      continue
    }

    assignedSession.count += 1
    const assignedSpeakerLoad = speakerLoads.find(
      (load) => load.speakerName === assignedSession.speakerName,
    )

    if (assignedSpeakerLoad) {
      assignedSpeakerLoad.count += 1
    }

    assignmentResults.set(item.index, {
      preferenceRank: getPreferenceRank(
        preference.preferenceOrder,
        assignedSession.speakerName,
      ),
      priorityOrder: priorityIndex + 1,
      sessionIndex: assignedSession.sessionIndex,
      sessionLabel: assignedSession.sessionLabel,
      speakerName: assignedSession.speakerName,
      status: "assigned",
      studentId: preference.studentId,
      studentName: preference.studentName,
      teamName: preference.teamName,
      submittedAt: preference.submittedAt,
    })
  }

  const assignments = indexedPreferences.map((item) => {
    const assignment = assignmentResults.get(item.index)

    if (!assignment) {
      throw new Error(`Missing assignment for ${item.preference.studentId}`)
    }

    return assignment
  })
  const assignedCount = assignments.filter(
    (assignment) => assignment.status === "assigned",
  ).length

  return {
    assignments,
    assignedCount,
    generatedAt,
    sessionCapacity: SPEAKER_SESSION_CAPACITY,
    sessionLoads,
    sessionsPerSpeaker: SPEAKER_SESSION_COUNT,
    speakerLoads,
    totalCapacity:
      speakerNames.length * SPEAKER_SESSION_COUNT * SPEAKER_SESSION_CAPACITY,
    unassignedCount: assignments.length - assignedCount,
  }
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

function findPreferredAvailableSession(
  preferenceOrder: string[],
  sessionLoads: SpeakerSessionLoad[],
) {
  for (const speakerName of preferenceOrder) {
    const availableSessions = sessionLoads.filter(
      (sessionLoad) =>
        sessionLoad.speakerName === speakerName &&
        sessionLoad.count < SPEAKER_SESSION_CAPACITY,
    )

    if (!availableSessions.length) {
      continue
    }

    return availableSessions.reduce((lowest, current) => {
      if (current.count !== lowest.count) {
        return current.count < lowest.count ? current : lowest
      }

      return current.sessionIndex < lowest.sessionIndex ? current : lowest
    })
  }

  return null
}

function getPreferenceRank(preferenceOrder: string[], speakerName: string) {
  const preferenceIndex = preferenceOrder.indexOf(speakerName)

  return preferenceIndex >= 0 ? preferenceIndex + 1 : null
}

function toSubmittedAtTime(submittedAt: string | null) {
  if (!submittedAt) {
    return Number.POSITIVE_INFINITY
  }

  const submittedAtTime = Date.parse(submittedAt)

  return Number.isNaN(submittedAtTime)
    ? Number.POSITIVE_INFINITY
    : submittedAtTime
}

function createSessionLabel(sessionIndex: number) {
  return `第 ${sessionIndex} 場`
}

function createPrioritizedPreferences<
  TItem extends { index: number; preference: StudentSpeakerPreference },
>(indexedPreferences: TItem[], random: () => number) {
  const submittedPreferences: TItem[] = []
  const unsubmittedPreferences: TItem[] = []

  for (const item of indexedPreferences) {
    if (Number.isFinite(toSubmittedAtTime(item.preference.submittedAt))) {
      submittedPreferences.push(item)
    } else {
      unsubmittedPreferences.push(item)
    }
  }

  submittedPreferences.sort((left, right) => {
    const leftTime = toSubmittedAtTime(left.preference.submittedAt)
    const rightTime = toSubmittedAtTime(right.preference.submittedAt)

    if (leftTime !== rightTime) {
      return leftTime - rightTime
    }

    return left.index - right.index
  })

  return [...submittedPreferences, ...shuffle(unsubmittedPreferences, random)]
}

function findRandomAvailableSession(
  sessionLoads: SpeakerSessionLoad[],
  random: () => number,
) {
  const availableSessions = sessionLoads.filter(
    (sessionLoad) => sessionLoad.count < SPEAKER_SESSION_CAPACITY,
  )

  if (!availableSessions.length) {
    return null
  }

  const randomIndex = Math.min(
    availableSessions.length - 1,
    Math.floor(random() * availableSessions.length),
  )

  return availableSessions[randomIndex]
}

function shuffle<TItem>(items: TItem[], random: () => number) {
  const shuffledItems = [...items]

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.min(index, Math.floor(random() * (index + 1)))
    const currentItem = shuffledItems[index]

    shuffledItems[index] = shuffledItems[randomIndex]
    shuffledItems[randomIndex] = currentItem
  }

  return shuffledItems
}
