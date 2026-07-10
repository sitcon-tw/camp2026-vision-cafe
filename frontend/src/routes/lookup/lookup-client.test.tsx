import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"

import type { LookupPayload } from "@/lib/vision-cafe-api"

import { LookupClient } from "./lookup-client"

describe("LookupClient", () => {
  it("shows separate student and counselor counts", () => {
    const assignments = [
      {
        participantRole: "student" as const,
        sessionIndex: 1,
        sessionLabel: "第 1 場",
        speakerName: "林予安",
        status: "assigned" as const,
        studentId: "student-1",
        studentName: "學員",
        teamName: "第1組",
      },
      {
        participantRole: "counselor" as const,
        sessionIndex: 1,
        sessionLabel: "第 1 場",
        speakerName: "林予安",
        status: "assigned" as const,
        studentId: "counselor-1",
        studentName: "隊輔姓名",
        teamName: "第1組",
      },
    ]
    const payload: LookupPayload = {
      generatedAt: "2026-07-10T00:00:00Z",
      sessions: [
        {
          assignments,
          counselorCount: 1,
          sessionIndex: 1,
          sessionLabel: "第 1 場",
          speakerName: "林予安",
          studentCount: 1,
        },
      ],
      state: "ready",
      teams: [{ assignments, teamName: "第1組" }],
    }

    const markup = renderToStaticMarkup(
      <MemoryRouter>
        <LookupClient initialLookup={payload} />
      </MemoryRouter>,
    )

    expect(markup).toContain("1 位學員＋1 位隊輔")
    expect(markup).toContain("隊輔姓名")
  })
})
