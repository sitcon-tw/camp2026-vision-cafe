import { describe, expect, it } from "vitest"

import { normalizeGithubUsername, parseRosterStudents } from "./roster"

describe("parseRosterStudents", () => {
  it("keeps rows with team, token, and GitHub username", () => {
    const students = parseRosterStudents([
      ["小隊", "學員姓名", "token", "GitHub username"],
      ["1", "小明", "student-1", "Octocat"],
      ["2", "缺帳號", "student-2", ""],
      ["", "測試", "student-3", "staff-user"],
      ["3", "小華", "student-4", "@Mona"],
    ])

    expect(students).toEqual([
      {
        githubUsername: "Octocat",
        studentId: "student-1",
        studentName: "小明",
        teamId: "1",
        teamName: "第1組",
      },
      {
        githubUsername: "@Mona",
        studentId: "student-4",
        studentName: "小華",
        teamId: "3",
        teamName: "第3組",
      },
    ])
  })

  it("uses header names instead of fixed column positions", () => {
    const students = parseRosterStudents([
      ["GitHub username", "token", "學員姓名", "小隊"],
      ["octocat", "student-1", "小明", "5"],
    ])

    expect(students[0]?.teamName).toBe("第5組")
    expect(students[0]?.studentId).toBe("student-1")
  })
})

describe("normalizeGithubUsername", () => {
  it("trims, removes @ prefix, and lowercases usernames", () => {
    expect(normalizeGithubUsername("  @OctoCat  ")).toBe("octocat")
  })
})
