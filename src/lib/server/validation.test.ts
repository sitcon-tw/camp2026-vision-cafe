import { describe, expect, it } from "vitest"

import { getSpeakerCandidateNames } from "@/lib/vision-cafe"

import { validateSpeakerPreferenceOrder } from "./validation"

describe("validateSpeakerPreferenceOrder", () => {
  it("accepts exactly the configured speakers in any order", () => {
    expect(validateSpeakerPreferenceOrder(getSpeakerCandidateNames())).toBe(
      true,
    )
    expect(
      validateSpeakerPreferenceOrder([...getSpeakerCandidateNames()].reverse()),
    ).toBe(true)
  })

  it("rejects duplicate, missing, and unknown speakers", () => {
    const [firstSpeaker] = getSpeakerCandidateNames()

    expect(validateSpeakerPreferenceOrder([])).toBe(false)
    expect(validateSpeakerPreferenceOrder([firstSpeaker, firstSpeaker])).toBe(
      false,
    )
    expect(validateSpeakerPreferenceOrder([firstSpeaker])).toBe(false)
    expect(validateSpeakerPreferenceOrder(["不存在的講者"])).toBe(false)
  })
})
