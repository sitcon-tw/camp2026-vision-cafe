import type { DefaultSession } from "next-auth"

type SessionKind = "student"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      githubUsername?: string
      kind?: SessionKind
      studentId?: string
      studentName?: string
      teamId?: string
      teamName?: string
    }
  }

  interface User {
    githubUsername?: string
    kind?: SessionKind
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    githubUsername?: string
    kind?: SessionKind
    studentId?: string
    studentName?: string
    teamId?: string
    teamName?: string
  }
}
