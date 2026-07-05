import { describe, expect, it } from "vitest"

import {
  SPEAKER_SESSION_CAPACITY,
  SPEAKER_SESSION_COUNT,
  createSessionKey,
  getSpeakerCandidateNames,
  groupAssignmentsByTeam,
} from "./vision-cafe"

describe("vision cafe shared frontend data", () => {
  it("loads speaker names and session constants from the shared config", () => {
    expect(getSpeakerCandidateNames()).toEqual(["林予安", "陳以晨"])
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
})
