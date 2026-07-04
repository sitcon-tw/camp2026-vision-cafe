export type SpeakerAssignment = {
  studentName: string
  speakerName: string
}

export type AdminFlowControls = {
  speakerPreferenceSelectionOpen: boolean
  assignmentLookupOpen: boolean
}

export type StudentSpeakerPreference = {
  studentId: string
  studentName: string
  teamName: string
  preferenceOrder: string[]
  submittedAt: string | null
}

export type PlannedSpeakerAssignment = SpeakerAssignment & {
  studentId: string
  teamName: string
  preferenceRank: number | null
}

export type SpeakerAssignmentPlan = {
  generatedAt: string
  assignments: PlannedSpeakerAssignment[]
  speakerLoads: {
    speakerName: string
    count: number
  }[]
}

export type TeamAssignments = {
  teamName: string
  assignments: SpeakerAssignment[]
}

export type Speaker = {
  speaker_name: string
  avatar: string
  description: string
  links?: SpeakerLink[]
}

export type SpeakerLink = {
  label: string
  href: string
}

const speakerCandidates: Speaker[] = [
  {
    speaker_name: "林予安",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%23F4C84A'/%3E%3Ccircle cx='34' cy='39' r='7' fill='%2317233A'/%3E%3Ccircle cx='62' cy='39' r='7' fill='%2317233A'/%3E%3Cpath d='M31 62c8 8 26 8 34 0' fill='none' stroke='%2317233A' stroke-width='7' stroke-linecap='round'/%3E%3C/svg%3E",
    description:
      "專注於產品策略與跨域協作，擅長把模糊的使用者洞察整理成可執行的專案方向。",
    links: [
      {
        label: "產品策略文章",
        href: "https://medium.com/tag/product-strategy",
      },
      {
        label: "使用者洞察方法",
        href: "https://www.nngroup.com/articles/user-research-methods/",
      },
    ],
  },
  {
    speaker_name: "陳以晨",
    avatar:
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='48' fill='%2331A886'/%3E%3Ccircle cx='35' cy='40' r='7' fill='%23FFF8E9'/%3E%3Ccircle cx='61' cy='40' r='7' fill='%23FFF8E9'/%3E%3Cpath d='M29 64c10 6 28 6 38 0' fill='none' stroke='%23FFF8E9' stroke-width='7' stroke-linecap='round'/%3E%3C/svg%3E",
    description:
      "長期帶領工程與設計團隊打造學習型產品，重視快速驗證、清楚溝通與團隊節奏。",
    links: [
      {
        label: "學習型產品案例",
        href: "https://www.edutopia.org/topic/project-based-learning",
      },
      {
        label: "快速驗證與產品實驗",
        href: "https://www.strategyzer.com/library/testing-business-ideas",
      },
    ],
  },
]

const adminFlowControls: AdminFlowControls = {
  speakerPreferenceSelectionOpen: true,
  assignmentLookupOpen: false,
}

const mockStudentNames = [
  "王小明",
  "李小華",
  "張家寧",
  "林品妤",
  "郭庭安",
  "黃彥廷",
  "陳宥蓁",
  "劉冠宇",
  "吳佳穎",
  "蔡承恩",
  "楊子晴",
  "許庭瑋",
  "鄭又嘉",
  "謝孟軒",
  "周芷妍",
  "曾柏翰",
  "邱郁婷",
  "賴俊廷",
  "徐若涵",
  "洪士傑",
  "盧映辰",
  "蘇品睿",
  "江宜蓁",
  "彭冠霖",
  "范語彤",
  "葉秉宏",
  "余欣妤",
  "潘昱辰",
  "廖采潔",
  "鍾宇翔",
  "沈可晴",
  "何冠廷",
  "羅心怡",
  "高柏宇",
  "蕭羽庭",
  "游承翰",
  "魏嘉琪",
  "方靖恩",
  "唐子喬",
  "宋以安",
  "馬庭皓",
  "段予樂",
  "梁芷芸",
  "石宥辰",
  "程若寧",
  "白睿哲",
  "任佳萱",
  "康子昂",
]

const studentSpeakerPreferences: StudentSpeakerPreference[] =
  mockStudentNames.map((studentName, index) => {
    const studentNumber = index + 1
    const submittedHour = 9 + Math.floor(index / 12)
    const submittedMinute = (18 + index * 7) % 60

    return {
      studentId: `S${studentNumber.toString().padStart(3, "0")}`,
      studentName,
      teamName: `第${Math.floor(index / 4) + 1}組`,
      preferenceOrder:
        index % 2 === 0 ? ["林予安", "陳以晨"] : ["陳以晨", "林予安"],
      submittedAt:
        index % 11 === 4
          ? null
          : `2026-07-04T${submittedHour
              .toString()
              .padStart(2, "0")}:${submittedMinute
              .toString()
              .padStart(2, "0")}:00+08:00`,
    }
  })

const teamAssignments: TeamAssignments[] = [
  {
    teamName: "第一組",
    assignments: [
      {
        studentName: "王小明",
        speakerName: "林予安",
      },
      {
        studentName: "李小華",
        speakerName: "陳以晨",
      },
    ],
  },
  {
    teamName: "第二組",
    assignments: [
      {
        studentName: "張家寧",
        speakerName: "陳以晨",
      },
      {
        studentName: "林品妤",
        speakerName: "林予安",
      },
    ],
  },
]

export function getSpeakerCandidates() {
  return speakerCandidates
}

export function getSpeakerCandidateNames() {
  return speakerCandidates.map((speaker) => speaker.speaker_name)
}

export function getSpeakerCandidateByName(speakerName: string) {
  return speakerCandidates.find(
    (speaker) => speaker.speaker_name === speakerName,
  )
}

export function getAdminFlowControls() {
  return adminFlowControls
}

export function getStudentSpeakerPreferences() {
  return studentSpeakerPreferences
}

export function getStudentSpeakerPreferenceById(studentId: string) {
  return studentSpeakerPreferences.find(
    (preference) => preference.studentId === studentId,
  )
}

export function updateStudentSpeakerPreference(
  preferences: StudentSpeakerPreference[],
  studentId: string,
  updates: Pick<StudentSpeakerPreference, "preferenceOrder" | "submittedAt">,
) {
  return preferences.map((preference) =>
    preference.studentId === studentId
      ? { ...preference, ...updates }
      : preference,
  )
}

export function createSpeakerAssignmentPlan(
  preferences: StudentSpeakerPreference[],
  generatedAt = new Date().toISOString(),
): SpeakerAssignmentPlan {
  const speakerLoads = getSpeakerCandidateNames().map((speakerName) => ({
    speakerName,
    count: 0,
  }))

  const assignments = preferences.map((preference) => {
    const rankedSpeaker = preference.preferenceOrder.find((speakerName) =>
      speakerLoads.some((load) => load.speakerName === speakerName),
    )
    const lowestLoad = speakerLoads.reduce((lowest, current) =>
      current.count < lowest.count ? current : lowest,
    )
    const assignedLoad =
      speakerLoads.find((load) => load.speakerName === rankedSpeaker) ??
      lowestLoad

    assignedLoad.count += 1

    return {
      studentId: preference.studentId,
      studentName: preference.studentName,
      teamName: preference.teamName,
      speakerName: assignedLoad.speakerName,
      preferenceRank: rankedSpeaker
        ? preference.preferenceOrder.indexOf(assignedLoad.speakerName) + 1
        : null,
    }
  })

  return {
    generatedAt,
    assignments,
    speakerLoads,
  }
}

export function getTeamAssignments() {
  return teamAssignments
}

export function getTeamAssignmentNames() {
  return teamAssignments.map((team) => team.teamName)
}

export function getTeamAssignmentsByName(teamName: string) {
  return teamAssignments.find((team) => team.teamName === teamName)
}
