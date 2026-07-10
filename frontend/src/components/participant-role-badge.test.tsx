import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ParticipantRoleBadge } from "./participant-role-badge"

describe("ParticipantRoleBadge", () => {
  it("renders student and counselor labels", () => {
    expect(
      renderToStaticMarkup(<ParticipantRoleBadge role="student" />),
    ).toContain("學員")
    expect(
      renderToStaticMarkup(<ParticipantRoleBadge role="counselor" />),
    ).toContain("隊輔")
  })
})
