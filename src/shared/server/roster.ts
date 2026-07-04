import { google } from "googleapis"

import type { AuthenticatedStudent } from "@/shared/data/vision-cafe-api"
import {
  getGooglePrivateKey,
  getOptionalEnv,
  getRequiredEnv,
} from "@/shared/server/env"

type RosterLookupResult =
  | {
      reason: "not-found"
      status: "error"
    }
  | {
      matches: AuthenticatedStudent[]
      reason: "duplicate"
      status: "error"
    }
  | {
      status: "ok"
      student: AuthenticatedStudent
    }

const rosterRange = "A1:Z500"

export async function getRosterStudents() {
  const rows = await getRosterRows()

  return parseRosterStudents(rows)
}

export function parseRosterStudents(rows: (string | null | undefined)[][]) {
  const [headerRow, ...dataRows] = rows
  const header = createHeaderIndex(headerRow ?? [])

  return dataRows.flatMap((row) => {
    const teamId = readColumn(row, header, "小隊")
    const studentName = readColumn(row, header, "學員姓名")
    const studentId = readColumn(row, header, "token")
    const githubUsername = readColumn(row, header, "GitHub username")

    if (!teamId || !studentId || !githubUsername) {
      return []
    }

    return {
      githubUsername,
      studentId,
      studentName: studentName || "未命名學員",
      teamId,
      teamName: `第${teamId}組`,
    }
  })
}

export async function findRosterStudentByGithubUsername(
  githubUsername: string,
): Promise<RosterLookupResult> {
  const normalizedGithubUsername = normalizeGithubUsername(githubUsername)
  const matches = (await getRosterStudents()).filter(
    (student) =>
      normalizeGithubUsername(student.githubUsername) ===
      normalizedGithubUsername,
  )

  if (matches.length === 0) {
    return {
      reason: "not-found",
      status: "error",
    }
  }

  if (matches.length > 1) {
    return {
      matches,
      reason: "duplicate",
      status: "error",
    }
  }

  return {
    status: "ok",
    student: matches[0],
  }
}

export async function findRosterStudentById(studentId: string) {
  return (await getRosterStudents()).find(
    (student) => student.studentId === studentId,
  )
}

export function normalizeGithubUsername(githubUsername: string) {
  return githubUsername.trim().replace(/^@+/, "").toLowerCase()
}

async function getRosterRows() {
  const auth = new google.auth.JWT({
    email: getRequiredEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: getGooglePrivateKey(),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })
  const sheets = google.sheets({ auth, version: "v4" })
  const spreadsheetId = getRequiredEnv("GOOGLE_SHEETS_ROSTER_SPREADSHEET_ID")
  const sheetName = getOptionalEnv(
    "GOOGLE_SHEETS_ROSTER_SHEET_NAME",
    "學員帳號",
  )
  const response = await sheets.spreadsheets.values.get({
    range: `${quoteSheetName(sheetName)}!${rosterRange}`,
    spreadsheetId,
    valueRenderOption: "FORMATTED_VALUE",
  })

  return response.data.values ?? []
}

function createHeaderIndex(headerRow: (string | null | undefined)[]) {
  return new Map(
    headerRow.map((header, index) => [String(header ?? "").trim(), index]),
  )
}

function readColumn(
  row: (string | null | undefined)[],
  header: Map<string, number>,
  columnName: string,
) {
  const columnIndex = header.get(columnName)

  if (columnIndex === undefined) {
    return ""
  }

  return String(row[columnIndex] ?? "").trim()
}

function quoteSheetName(sheetName: string) {
  return `'${sheetName.replaceAll("'", "''")}'`
}
