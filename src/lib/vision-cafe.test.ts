import { describe, expect, it } from "vitest"

import {
  createSpeakerAssignmentPlan,
  getSpeakerCandidateNames,
  type StudentSpeakerPreference,
} from "./vision-cafe"

describe("createSpeakerAssignmentPlan", () => {
  it("assigns each student to the first valid preferred speaker and tracks loads", () => {
    const [firstSpeaker, secondSpeaker] = getSpeakerCandidateNames()
    const preferences: StudentSpeakerPreference[] = [
      createPreference("student-1", [firstSpeaker, secondSpeaker]),
      createPreference("student-2", [secondSpeaker, firstSpeaker]),
      createPreference("student-3", [firstSpeaker, secondSpeaker]),
    ]

    const plan = createSpeakerAssignmentPlan(
      preferences,
      "2026-07-05T10:00:00.000+08:00",
    )

    expect(plan.generatedAt).toBe("2026-07-05T10:00:00.000+08:00")
    expect(plan.assignments).toMatchObject([
      {
        preferenceRank: 1,
        speakerName: firstSpeaker,
        studentId: "student-1",
      },
      {
        preferenceRank: 1,
        speakerName: secondSpeaker,
        studentId: "student-2",
      },
      {
        preferenceRank: 1,
        speakerName: firstSpeaker,
        studentId: "student-3",
      },
    ])
    expect(plan.speakerLoads).toEqual([
      {
        count: 2,
        speakerName: firstSpeaker,
      },
      {
        count: 1,
        speakerName: secondSpeaker,
      },
    ])
  })

  it("falls back to the currently least-loaded speaker when preferences are invalid", () => {
    const [firstSpeaker, secondSpeaker] = getSpeakerCandidateNames()
    const preferences: StudentSpeakerPreference[] = [
      createPreference("student-1", [firstSpeaker, secondSpeaker]),
      createPreference("student-2", ["不存在的講者"]),
      createPreference("student-3", ["不存在的講者"]),
    ]

    const plan = createSpeakerAssignmentPlan(preferences)

    expect(plan.assignments).toMatchObject([
      {
        preferenceRank: 1,
        speakerName: firstSpeaker,
        studentId: "student-1",
      },
      {
        preferenceRank: null,
        speakerName: secondSpeaker,
        studentId: "student-2",
      },
      {
        preferenceRank: null,
        speakerName: firstSpeaker,
        studentId: "student-3",
      },
    ])
    expect(plan.speakerLoads).toEqual([
      {
        count: 2,
        speakerName: firstSpeaker,
      },
      {
        count: 1,
        speakerName: secondSpeaker,
      },
    ])
  })
})

function createPreference(
  studentId: string,
  preferenceOrder: string[],
): StudentSpeakerPreference {
  return {
    preferenceOrder,
    studentId,
    studentName: studentId,
    submittedAt: null,
    teamName: "第1組",
  }
}
