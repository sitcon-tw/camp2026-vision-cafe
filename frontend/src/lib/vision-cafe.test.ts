import { describe, expect, it } from "vitest"

import {
  SPEAKER_SESSION_CAPACITY,
  SPEAKER_SESSION_COUNT,
  createSessionKey,
  getSpeakerCandidateNames,
  groupAssignmentsBySession,
  groupAssignmentsByTeam,
} from "./vision-cafe"

describe("vision cafe shared frontend data", () => {
  it("loads speaker names and session constants from the shared config", () => {
    expect(getSpeakerCandidateNames()).toEqual(["蘇柏瑄 Brian Su", "趙式隆"])
    expect(SPEAKER_SESSION_COUNT).toBe(2)
    expect(SPEAKER_SESSION_CAPACITY).toBe(12)
  })

  it("keeps stable display grouping helpers for API payloads", () => {
    expect(createSessionKey("林予安", 1)).toBe("林予安:1")
    expect(
      groupAssignmentsByTeam([
        {
          studentId: "student-1",
          teamName: "第1組",
        },
        {
          studentId: "student-2",
          teamName: "第1組",
        },
        {
          studentId: "student-3",
          teamName: "第2組",
        },
      ]),
    ).toEqual([
      {
        assignments: [
          {
            studentId: "student-1",
            teamName: "第1組",
          },
          {
            studentId: "student-2",
            teamName: "第1組",
          },
        ],
        teamName: "第1組",
      },
      {
        assignments: [
          {
            studentId: "student-3",
            teamName: "第2組",
          },
        ],
        teamName: "第2組",
      },
    ])
  })

  it("preserves participant roles and separate session counts", () => {
    const sessions = groupAssignmentsBySession(
      [
        {
          counselorCount: 1,
          sessionIndex: 1,
          sessionLabel: "第 1 場",
          speakerName: "林予安",
          studentCount: 1,
        },
      ],
      [
        {
          participantRole: "student" as const,
          sessionIndex: 1,
          sessionLabel: "第 1 場",
          speakerName: "林予安",
          status: "assigned" as const,
        },
        {
          participantRole: "counselor" as const,
          sessionIndex: 1,
          sessionLabel: "第 1 場",
          speakerName: "林予安",
          status: "assigned" as const,
        },
      ],
    )

    expect(sessions[0]).toMatchObject({
      counselorCount: 1,
      studentCount: 1,
    })
    expect(sessions[0].assignments.map((item) => item.participantRole)).toEqual(
      ["student", "counselor"],
    )
  })
})
