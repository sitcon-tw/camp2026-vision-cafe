export type SpeakerAssignment = {
  studentName: string
  speakerName: string
}

export type TeamAssignments = {
  teamName: string
  assignments: SpeakerAssignment[]
}

const teamAssignments: TeamAssignments[] = [
  {
    teamName: "第一組",
    assignments: [
      {
        studentName: "王小明",
        speakerName: "林予安",
      },
      {
        studentName: "李小華",
        speakerName: "陳以晨",
      },
    ],
  },
  {
    teamName: "第二組",
    assignments: [
      {
        studentName: "張家寧",
        speakerName: "陳以晨",
      },
      {
        studentName: "林品妤",
        speakerName: "林予安",
      },
    ],
  },
]

export function getTeamAssignments() {
  return teamAssignments
}

export function getTeamAssignmentNames() {
  return teamAssignments.map((team) => team.teamName)
}

export function getTeamAssignmentsByName(teamName: string) {
  return teamAssignments.find((team) => team.teamName === teamName)
}
