import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"
import type { NextRequest } from "next/server"

import type { AuthenticatedStudent } from "@/lib/vision-cafe-api"

const testDatabaseName = `vision_cafe_integration_${Date.now()}_${Math.random()
  .toString(36)
  .slice(2)}`

process.env.MONGODB_DB = testDatabaseName

const { rosterStudents } = vi.hoisted(() => {
  const students: AuthenticatedStudent[] = []
  const teamSizes = [6, 6, 6, 5, 5, 5, 5, 5, 5]

  for (const [teamIndex, teamSize] of teamSizes.entries()) {
    for (let studentIndex = 0; studentIndex < teamSize; studentIndex += 1) {
      const globalIndex = students.length + 1
      const studentId = `student-${globalIndex.toString().padStart(2, "0")}`
      const teamId = String(teamIndex + 1)

      students.push({
        githubUsername: `student-${globalIndex}`,
        studentId,
        studentName: `學員 ${globalIndex.toString().padStart(2, "0")}`,
        teamId,
        teamName: `第${teamId}組`,
      })
    }
  }

  return {
    rosterStudents: students,
  }
})

vi.mock("@/lib/server/admin-auth", () => ({
  requireAdminSession: vi.fn(async () => ({
    kind: "admin",
  })),
}))

vi.mock("@/lib/server/roster", () => ({
  findRosterStudentById: vi.fn(async (studentId: string) =>
    rosterStudents.find((student) => student.studentId === studentId),
  ),
  getRosterStudents: vi.fn(async () => rosterStudents),
}))

describe("Vision Cafe backend integration", () => {
  beforeAll(async () => {
    await dropTestDatabase()
  })

  beforeEach(async () => {
    await dropTestDatabase()
  })

  afterAll(async () => {
    await dropTestDatabase()
    const { closeMongoConnectionForTests } = await import("./mongodb")

    await closeMongoConnectionForTests()
  })

  it("runs the complete 48-student admin flow across 9 teams and 2 speakers", async () => {
    const speakerNames = await getSpeakerNames()
    expect(speakerNames).toHaveLength(2)
    expect(rosterStudents).toHaveLength(48)
    expect(new Set(rosterStudents.map((student) => student.teamId)).size).toBe(
      9,
    )

    await expectFlowControls({
      assignmentLookupOpen: false,
      speakerPreferenceSelectionOpen: true,
    })

    await putFlowControls({
      assignmentLookupOpen: false,
      speakerPreferenceSelectionOpen: false,
    })
    await expectFlowControls({
      assignmentLookupOpen: false,
      speakerPreferenceSelectionOpen: false,
    })

    await putFlowControls({
      assignmentLookupOpen: false,
      speakerPreferenceSelectionOpen: true,
    })

    const initialPreferences = await getAdminPreferences()
    expect(initialPreferences.preferences).toHaveLength(48)
    expect(
      initialPreferences.preferences.every(
        (preference) => preference.submittedAt === null,
      ),
    ).toBe(true)
    expect(
      initialPreferences.preferences.every(
        (preference) => preference.preferenceOrder.length === 0,
      ),
    ).toBe(true)

    for (const [index, student] of rosterStudents.entries()) {
      const preferenceOrder =
        index % 2 === 0 ? speakerNames : [...speakerNames].reverse()

      await putStudentPreference(student.studentId, {
        preferenceOrder,
        submittedAt: `2026-07-05T10:${(index % 60)
          .toString()
          .padStart(2, "0")}:00.000+08:00`,
      })
    }

    const updatedPreferences = await getAdminPreferences()
    expect(updatedPreferences.preferences).toHaveLength(48)
    expect(
      updatedPreferences.preferences.every(
        (preference) => preference.submittedAt !== null,
      ),
    ).toBe(true)

    const dryRun = await postDryRun()
    expect(dryRun.assignmentPlan.assignments).toHaveLength(48)
    expect(dryRun.assignmentPlan.totalCapacity).toBe(48)
    expect(dryRun.assignmentPlan.unassignedCount).toBe(0)
    expect(dryRun.assignmentPlan.speakerLoads).toEqual([
      {
        count: 24,
        speakerName: speakerNames[0],
      },
      {
        count: 24,
        speakerName: speakerNames[1],
      },
    ])
    expect(dryRun.assignmentPlan.sessionLoads).toEqual([
      {
        count: 12,
        sessionIndex: 1,
        sessionLabel: "第 1 場",
        speakerName: speakerNames[0],
      },
      {
        count: 12,
        sessionIndex: 2,
        sessionLabel: "第 2 場",
        speakerName: speakerNames[0],
      },
      {
        count: 12,
        sessionIndex: 1,
        sessionLabel: "第 1 場",
        speakerName: speakerNames[1],
      },
      {
        count: 12,
        sessionIndex: 2,
        sessionLabel: "第 2 場",
        speakerName: speakerNames[1],
      },
    ])

    await expectLookupState("closed")

    await putFlowControls({
      assignmentLookupOpen: true,
      speakerPreferenceSelectionOpen: false,
    })
    await expectLookupState("empty")

    const published = await postPublish()
    expect(published.assignmentPlan.assignments).toHaveLength(48)

    const lookupPayload = await getLookup()
    expect(lookupPayload.state).toBe("ready")

    if (lookupPayload.state !== "ready") {
      throw new Error("Expected ready lookup payload")
    }

    expect(lookupPayload.teams).toHaveLength(9)
    expect(
      lookupPayload.teams.reduce(
        (total, team) => total + team.assignments.length,
        0,
      ),
    ).toBe(48)
    expect(lookupPayload.teams.map((team) => team.assignments.length)).toEqual([
      6, 6, 6, 5, 5, 5, 5, 5, 5,
    ])
    expect(lookupPayload.sessions).toHaveLength(4)
    expect(
      lookupPayload.sessions.map((session) => session.assignments.length),
    ).toEqual([12, 12, 12, 12])
    expect(
      lookupPayload.teams.every((team) =>
        team.assignments.every(
          (assignment) =>
            assignment.status === "assigned" &&
            assignment.speakerName &&
            assignment.sessionIndex,
        ),
      ),
    ).toBe(true)
  })
})

async function getSpeakerNames() {
  const { getSpeakerCandidateNames } = await import("@/lib/vision-cafe")

  return getSpeakerCandidateNames()
}

async function expectFlowControls(expected: {
  assignmentLookupOpen: boolean
  speakerPreferenceSelectionOpen: boolean
}) {
  expect(await getFlowControls()).toEqual(expected)
}

async function getFlowControls() {
  const route = await import("@/app/api/admin/flow-controls/route")
  const response = await route.GET()

  expect(response.status).toBe(200)

  return response.json()
}

async function putFlowControls(body: {
  assignmentLookupOpen: boolean
  speakerPreferenceSelectionOpen: boolean
}) {
  const route = await import("@/app/api/admin/flow-controls/route")
  const response = await route.PUT(createJsonRequest(body))

  expect(response.status).toBe(200)

  return response.json()
}

async function getAdminPreferences() {
  const route = await import("@/app/api/admin/preferences/route")
  const response = await route.GET()

  expect(response.status).toBe(200)

  return response.json() as Promise<{
    preferences: {
      preferenceOrder: string[]
      studentId: string
      studentName: string
      submittedAt: string | null
      teamName: string
    }[]
  }>
}

async function putStudentPreference(
  studentId: string,
  body: {
    preferenceOrder: string[]
    submittedAt: string
  },
) {
  const route = await import("@/app/api/admin/preferences/[studentId]/route")
  const response = await route.PUT(createJsonRequest(body), {
    params: Promise.resolve({
      studentId,
    }),
  })

  expect(response.status).toBe(200)
}

async function postDryRun() {
  const route = await import("@/app/api/admin/assignments/dry-run/route")
  const response = await route.POST(createAdminRequest("POST"))

  expect(response.status).toBe(200)

  return response.json() as Promise<{
    assignmentPlan: {
      assignments: unknown[]
      sessionLoads: {
        count: number
        sessionIndex: number
        sessionLabel: string
        speakerName: string
      }[]
      speakerLoads: {
        count: number
        speakerName: string
      }[]
      totalCapacity: number
      unassignedCount: number
    }
  }>
}

async function postPublish() {
  const route = await import("@/app/api/admin/assignments/publish/route")
  const response = await route.POST(createAdminRequest("POST"))

  expect(response.status).toBe(200)

  return response.json() as Promise<{
    assignmentPlan: {
      assignments: unknown[]
    }
  }>
}

async function expectLookupState(expectedState: "closed" | "empty" | "ready") {
  const lookupPayload = await getLookup()

  expect(lookupPayload.state).toBe(expectedState)
}

async function getLookup() {
  const route = await import("@/app/api/lookup/route")
  const response = await route.GET()

  expect(response.status).toBe(200)

  return response.json() as Promise<
    | {
        state: "closed" | "empty"
      }
    | {
        state: "ready"
        sessions: {
          assignments: unknown[]
          count: number
          sessionIndex: number
          sessionLabel: string
          speakerName: string
        }[]
        teams: {
          assignments: {
            sessionIndex: number | null
            speakerName: string | null
            status: "assigned" | "unassigned"
          }[]
          teamName: string
        }[]
      }
  >
}

async function dropTestDatabase() {
  const { getMongoDatabase } = await import("./mongodb")
  const database = await getMongoDatabase()

  await database.dropDatabase()
}

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/test", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "PUT",
  }) as NextRequest
}

function createAdminRequest(method: string) {
  return new Request("http://localhost/api/test", { method }) as NextRequest
}
