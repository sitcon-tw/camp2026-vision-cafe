import type {
  AdminFlowControls,
  SpeakerSessionAssignments,
  SpeakerAssignmentPlan,
  StudentSpeakerPreference,
  TeamAssignments,
} from "@/lib/vision-cafe"

export type AuthenticatedStudent = {
  studentId: string
  studentName: string
  teamId: string
  teamName: string
  githubUsername: string
}

export type StudentSelectionPayload = {
  flowControls: AdminFlowControls
  preference: StudentSpeakerPreference
  student: AuthenticatedStudent
}

export type LookupPayload =
  | {
      state: "closed"
    }
  | {
      state: "empty"
    }
  | {
      generatedAt: string
      sessions: SpeakerSessionAssignments[]
      state: "ready"
      teams: TeamAssignments[]
    }

export type AdminPreferencesPayload = {
  preferences: StudentSpeakerPreference[]
}

export type AdminAssignmentPlanPayload = {
  assignmentPlan: SpeakerAssignmentPlan
}

export type ApiErrorPayload = {
  error: string
}
