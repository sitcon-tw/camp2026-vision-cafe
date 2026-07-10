import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import type { SpeakerAssignmentPlan } from "@/lib/vision-cafe"

import { AssignmentPlanViewer } from "./assignment-plan-viewer"

describe("AssignmentPlanViewer", () => {
  it("keeps counselor counts outside student capacity", () => {
    const plan: SpeakerAssignmentPlan = {
      assignedCounselorCount: 1,
      assignedStudentCount: 12,
      assignments: [],
      generatedAt: "2026-07-10T00:00:00Z",
      sessionCapacity: 12,
      sessionLoads: [
        {
          counselorCount: 1,
          sessionIndex: 1,
          sessionLabel: "第 1 場",
          speakerName: "林予安",
          studentCount: 12,
        },
      ],
      sessionsPerSpeaker: 2,
      speakerLoads: [
        {
          counselorCount: 1,
          speakerName: "林予安",
          studentCount: 12,
        },
      ],
      studentCapacity: 48,
      unassignedCounselorCount: 0,
      unassignedStudentCount: 0,
    }

    const markup = renderToStaticMarkup(
      <AssignmentPlanViewer assignmentPlan={plan} />,
    )

    expect(markup).toContain("12 / 48 位學員")
    expect(markup).toContain("1 位隊輔")
  })
})
