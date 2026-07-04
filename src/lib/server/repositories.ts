import type { Collection, ObjectId } from "mongodb"

import type {
  AuthenticatedStudent,
  PublishedAssignmentPlan,
} from "@/lib/vision-cafe-api"
import {
  createSpeakerAssignmentPlan,
  createSpeakerSessionAssignments,
  createTeamAssignments,
  type AdminFlowControls,
  type SpeakerAssignmentPlan,
  type StudentSpeakerPreference,
} from "@/lib/vision-cafe"
import { getMongoDatabase } from "@/lib/server/mongodb"
import { getRosterStudents } from "@/lib/server/roster"

type PreferenceDocument = StudentSpeakerPreference & {
  _id: string
  githubUsername: string
  teamId: string
  updatedAt: string
}

type SettingsDocument = AdminFlowControls & {
  _id: "flow-controls"
  updatedAt: string
}

type AssignmentPlanDocument = SpeakerAssignmentPlan & {
  _id?: ObjectId
  publishedAt: string
  status: "published"
}

const defaultFlowControls: AdminFlowControls = {
  assignmentLookupOpen: false,
  speakerPreferenceSelectionOpen: true,
}

export async function getFlowControls(): Promise<AdminFlowControls> {
  const document = await settingsCollection().then((collection) =>
    collection.findOne({ _id: "flow-controls" }),
  )

  if (!document) {
    return defaultFlowControls
  }

  return {
    assignmentLookupOpen: document.assignmentLookupOpen,
    speakerPreferenceSelectionOpen: document.speakerPreferenceSelectionOpen,
  }
}

export async function updateFlowControls(
  updates: AdminFlowControls,
): Promise<AdminFlowControls> {
  const now = new Date().toISOString()

  await settingsCollection().then((collection) =>
    collection.updateOne(
      { _id: "flow-controls" },
      {
        $set: {
          ...updates,
          updatedAt: now,
        },
      },
      { upsert: true },
    ),
  )

  return updates
}

export async function getStudentSelectionPayload(
  student: AuthenticatedStudent,
) {
  const [flowControls, preference] = await Promise.all([
    getFlowControls(),
    getStudentPreference(student),
  ])

  return {
    flowControls,
    preference,
    student,
  }
}

export async function getStudentPreference(
  student: AuthenticatedStudent,
): Promise<StudentSpeakerPreference> {
  const document = await preferencesCollection().then((collection) =>
    collection.findOne({ _id: student.studentId }),
  )

  return toStudentPreference(student, document ?? undefined)
}

export async function getAdminPreferences(): Promise<
  StudentSpeakerPreference[]
> {
  const rosterStudents = await getRosterStudents()
  const studentIds = rosterStudents.map((student) => student.studentId)
  const documents = await preferencesCollection().then((collection) =>
    collection.find({ _id: { $in: studentIds } }).toArray(),
  )
  const documentsById = new Map(
    documents.map((document) => [document._id, document]),
  )

  return rosterStudents.map((student) =>
    toStudentPreference(student, documentsById.get(student.studentId)),
  )
}

export async function ensureStudentProfile(student: AuthenticatedStudent) {
  const existingPreference = await getStudentPreference(student)

  await saveStudentPreference(student, {
    preferenceOrder: existingPreference.preferenceOrder,
    submittedAt: existingPreference.submittedAt,
  })
}

export async function saveStudentPreference(
  student: AuthenticatedStudent,
  updates: Pick<StudentSpeakerPreference, "preferenceOrder" | "submittedAt">,
) {
  const now = new Date().toISOString()

  await preferencesCollection().then((collection) =>
    collection.updateOne(
      { _id: student.studentId },
      {
        $set: {
          githubUsername: student.githubUsername,
          preferenceOrder: updates.preferenceOrder,
          studentId: student.studentId,
          studentName: student.studentName,
          submittedAt: updates.submittedAt,
          teamId: student.teamId,
          teamName: student.teamName,
          updatedAt: now,
        },
      },
      { upsert: true },
    ),
  )
}

export async function createCurrentAssignmentPlan() {
  return createSpeakerAssignmentPlan(await getAdminPreferences())
}

export async function publishCurrentAssignmentPlan() {
  const assignmentPlan = await createCurrentAssignmentPlan()
  const publishedAt = new Date().toISOString()

  await assignmentPlansCollection().then((collection) =>
    collection.insertOne({
      ...assignmentPlan,
      publishedAt,
      status: "published",
    }),
  )

  return assignmentPlan
}

export async function getPublishedAssignmentPlans(): Promise<
  PublishedAssignmentPlan[]
> {
  const documents = await assignmentPlansCollection().then((collection) =>
    collection
      .find({ status: "published" })
      .sort({ publishedAt: -1 })
      .toArray(),
  )

  return documents.map((document, index) => {
    const { _id, ...assignmentPlan } = document

    return {
      ...assignmentPlan,
      id: _id?.toString() ?? document.publishedAt,
      isActive: index === 0,
    }
  })
}

export async function getLookupPayload() {
  const flowControls = await getFlowControls()

  if (!flowControls.assignmentLookupOpen) {
    return {
      state: "closed" as const,
    }
  }

  const assignmentPlan = await getLatestPublishedAssignmentPlan()

  if (!assignmentPlan) {
    return {
      state: "empty" as const,
    }
  }

  return {
    generatedAt: assignmentPlan.generatedAt,
    sessions: createSpeakerSessionAssignments(assignmentPlan),
    state: "ready" as const,
    teams: createTeamAssignments(assignmentPlan.assignments),
  }
}

function toStudentPreference(
  student: AuthenticatedStudent,
  document?: PreferenceDocument,
): StudentSpeakerPreference {
  const submittedAt = document?.submittedAt ?? null

  return {
    preferenceOrder: submittedAt ? (document?.preferenceOrder ?? []) : [],
    studentId: student.studentId,
    studentName: student.studentName,
    submittedAt,
    teamName: student.teamName,
  }
}

async function getLatestPublishedAssignmentPlan() {
  const document = await assignmentPlansCollection().then((collection) =>
    collection.findOne({ status: "published" }, { sort: { publishedAt: -1 } }),
  )

  return document
}

async function preferencesCollection(): Promise<
  Collection<PreferenceDocument>
> {
  return (await getMongoDatabase()).collection<PreferenceDocument>(
    "preferences",
  )
}

async function settingsCollection(): Promise<Collection<SettingsDocument>> {
  return (await getMongoDatabase()).collection<SettingsDocument>("settings")
}

async function assignmentPlansCollection(): Promise<
  Collection<AssignmentPlanDocument>
> {
  return (await getMongoDatabase()).collection<AssignmentPlanDocument>(
    "assignmentPlans",
  )
}
