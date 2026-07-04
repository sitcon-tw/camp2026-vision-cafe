import { describe, expect, it } from "vitest"

import {
  SPEAKER_SESSION_CAPACITY,
  SPEAKER_SESSION_COUNT,
  createSpeakerAssignmentPlan,
  getSpeakerCandidateNames,
  type StudentSpeakerPreference,
} from "./vision-cafe"

describe("createSpeakerAssignmentPlan", () => {
  it("prioritizes earlier submissions and balances sessions for the same speaker", () => {
    const [firstSpeaker, secondSpeaker] = getSpeakerCandidateNames()
    const preferences: StudentSpeakerPreference[] = [
      createPreference("student-1", [firstSpeaker, secondSpeaker], {
        submittedAt: "2026-07-05T10:03:00.000+08:00",
      }),
      createPreference("student-2", [firstSpeaker, secondSpeaker], {
        submittedAt: "2026-07-05T10:01:00.000+08:00",
      }),
      createPreference("student-3", [firstSpeaker, secondSpeaker], {
        submittedAt: "2026-07-05T10:02:00.000+08:00",
      }),
    ]

    const plan = createSpeakerAssignmentPlan(
      preferences,
      "2026-07-05T11:00:00.000+08:00",
    )

    expect(plan.generatedAt).toBe("2026-07-05T11:00:00.000+08:00")
    expect(plan.assignments).toMatchObject([
      {
        priorityOrder: 3,
        sessionIndex: 1,
        speakerName: firstSpeaker,
        status: "assigned",
        studentId: "student-1",
      },
      {
        priorityOrder: 1,
        sessionIndex: 1,
        speakerName: firstSpeaker,
        status: "assigned",
        studentId: "student-2",
      },
      {
        priorityOrder: 2,
        sessionIndex: 2,
        speakerName: firstSpeaker,
        status: "assigned",
        studentId: "student-3",
      },
    ])
    expect(plan.sessionLoads).toMatchObject([
      {
        count: 2,
        sessionIndex: 1,
        speakerName: firstSpeaker,
      },
      {
        count: 1,
        sessionIndex: 2,
        speakerName: firstSpeaker,
      },
      {
        count: 0,
        sessionIndex: 1,
        speakerName: secondSpeaker,
      },
      {
        count: 0,
        sessionIndex: 2,
        speakerName: secondSpeaker,
      },
    ])
  })

  it("uses the next preferred speaker after a speaker reaches total capacity", () => {
    const [firstSpeaker, secondSpeaker] = getSpeakerCandidateNames()
    const firstSpeakerCapacity =
      SPEAKER_SESSION_COUNT * SPEAKER_SESSION_CAPACITY
    const preferences = Array.from(
      { length: firstSpeakerCapacity + 1 },
      (_, index) =>
        createPreference(
          `student-${(index + 1).toString().padStart(2, "0")}`,
          [firstSpeaker, secondSpeaker],
          {
            submittedAt: `2026-07-05T10:${index
              .toString()
              .padStart(2, "0")}:00.000+08:00`,
          },
        ),
    )

    const plan = createSpeakerAssignmentPlan(preferences)
    const lastAssignment = plan.assignments[firstSpeakerCapacity]

    expect(plan.speakerLoads).toEqual([
      {
        count: firstSpeakerCapacity,
        speakerName: firstSpeaker,
      },
      {
        count: 1,
        speakerName: secondSpeaker,
      },
    ])
    expect(lastAssignment).toMatchObject({
      preferenceRank: 2,
      sessionIndex: 1,
      speakerName: secondSpeaker,
      status: "assigned",
    })
  })

  it("marks students as unassigned when all sessions are full", () => {
    const [firstSpeaker, secondSpeaker] = getSpeakerCandidateNames()
    const totalCapacity =
      getSpeakerCandidateNames().length *
      SPEAKER_SESSION_COUNT *
      SPEAKER_SESSION_CAPACITY
    const preferences = Array.from({ length: totalCapacity + 1 }, (_, index) =>
      createPreference(
        `student-${(index + 1).toString().padStart(2, "0")}`,
        [firstSpeaker, secondSpeaker],
        {
          submittedAt: `2026-07-05T10:${index
            .toString()
            .padStart(2, "0")}:00.000+08:00`,
        },
      ),
    )

    const plan = createSpeakerAssignmentPlan(preferences)

    expect(plan.assignedCount).toBe(totalCapacity)
    expect(plan.totalCapacity).toBe(totalCapacity)
    expect(plan.unassignedCount).toBe(1)
    expect(plan.assignments.at(-1)).toMatchObject({
      sessionIndex: null,
      speakerName: null,
      status: "unassigned",
      unassignedReason: "所有講者場次皆已額滿",
    })
    expect(
      plan.sessionLoads.every((load) => load.count <= SPEAKER_SESSION_CAPACITY),
    ).toBe(true)
  })

  it("places null submissions after submitted preferences and shuffles them", () => {
    const [firstSpeaker, secondSpeaker] = getSpeakerCandidateNames()
    const preferences: StudentSpeakerPreference[] = [
      createPreference("student-1", [firstSpeaker, secondSpeaker]),
      createPreference("student-2", [firstSpeaker, secondSpeaker], {
        submittedAt: "2026-07-05T10:01:00.000+08:00",
      }),
      createPreference("student-3", [firstSpeaker, secondSpeaker]),
    ]

    const plan = createSpeakerAssignmentPlan(
      preferences,
      "2026-07-05T11:00:00.000+08:00",
      () => 0,
    )

    expect(plan.assignments).toMatchObject([
      {
        priorityOrder: 3,
        studentId: "student-1",
      },
      {
        priorityOrder: 1,
        studentId: "student-2",
      },
      {
        priorityOrder: 2,
        studentId: "student-3",
      },
    ])
  })

  it("randomly assigns empty preferences after submitted preferences", () => {
    const [firstSpeaker, secondSpeaker] = getSpeakerCandidateNames()
    const preferences: StudentSpeakerPreference[] = [
      createPreference("student-1", []),
      createPreference("student-2", [firstSpeaker, secondSpeaker], {
        submittedAt: "2026-07-05T10:01:00.000+08:00",
      }),
    ]

    const plan = createSpeakerAssignmentPlan(
      preferences,
      "2026-07-05T11:00:00.000+08:00",
      () => 0.99,
    )

    expect(plan.assignedCount).toBe(2)
    expect(plan.unassignedCount).toBe(0)
    expect(plan.assignments).toMatchObject([
      {
        preferenceRank: null,
        priorityOrder: 2,
        sessionIndex: 2,
        speakerName: secondSpeaker,
        status: "assigned",
        studentId: "student-1",
      },
      {
        preferenceRank: 1,
        priorityOrder: 1,
        speakerName: firstSpeaker,
        status: "assigned",
        studentId: "student-2",
      },
    ])
  })
})

function createPreference(
  studentId: string,
  preferenceOrder: string[],
  options: {
    submittedAt?: string | null
  } = {},
): StudentSpeakerPreference {
  return {
    preferenceOrder,
    studentId,
    studentName: studentId,
    submittedAt: options.submittedAt ?? null,
    teamName: "第1組",
  }
}
