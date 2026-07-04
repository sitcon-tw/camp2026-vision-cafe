import { z } from "zod"

import { getSpeakerCandidateNames } from "@/lib/vision-cafe"

export const flowControlsSchema = z.object({
  assignmentLookupOpen: z.boolean(),
  speakerPreferenceSelectionOpen: z.boolean(),
})

export const preferenceUpdateSchema = z.object({
  preferenceOrder: z.array(z.string()),
  submittedAt: z.iso.datetime({ offset: true }).nullable(),
})

export const studentPreferenceSubmitSchema = z.object({
  preferenceOrder: z.array(z.string()),
})

export function validateSpeakerPreferenceOrder(preferenceOrder: string[]) {
  const speakerNames = getSpeakerCandidateNames()
  const expected = new Set(speakerNames)
  const received = new Set(preferenceOrder)

  if (
    preferenceOrder.length !== speakerNames.length ||
    received.size !== speakerNames.length
  ) {
    return false
  }

  return preferenceOrder.every((speakerName) => expected.has(speakerName))
}
