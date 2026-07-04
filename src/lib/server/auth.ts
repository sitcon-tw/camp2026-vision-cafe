import GitHubProvider from "next-auth/providers/github"
import { getServerSession, type NextAuthOptions } from "next-auth"

import type { AuthenticatedStudent } from "@/lib/vision-cafe-api"
import { ensureStudentProfile } from "@/lib/server/repositories"
import { findRosterStudentByGithubUsername } from "@/lib/server/roster"

type GithubProfile = {
  avatar_url?: string | null
  email?: string | null
  id: number | string
  login: string
  name?: string | null
}

export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ account, token, user }) {
      if (account?.provider === "github") {
        const githubUsername = user?.githubUsername

        if (!githubUsername) {
          return token
        }

        const rosterResult =
          await findRosterStudentByGithubUsername(githubUsername)

        if (rosterResult.status !== "ok") {
          return token
        }

        await ensureStudentProfile(rosterResult.student)

        token.githubUsername = rosterResult.student.githubUsername
        token.kind = "student"
        token.studentId = rosterResult.student.studentId
        token.studentName = rosterResult.student.studentName
        token.teamId = rosterResult.student.teamId
        token.teamName = rosterResult.student.teamName
      }

      return token
    },
    async session({ session, token }) {
      session.user.kind = token.kind
      session.user.githubUsername = token.githubUsername
      session.user.studentId = token.studentId
      session.user.studentName = token.studentName
      session.user.teamId = token.teamId
      session.user.teamName = token.teamName

      return session
    },
    async signIn({ account, user }) {
      if (account?.provider !== "github") {
        return false
      }

      const githubUsername = user.githubUsername

      if (!githubUsername) {
        return false
      }

      const rosterResult =
        await findRosterStudentByGithubUsername(githubUsername)

      return rosterResult.status === "ok"
    },
  },
  pages: {
    error: "/auth/error",
    signIn: "/select",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
      profile(profile: GithubProfile) {
        return {
          email: profile.email ?? null,
          githubUsername: profile.login,
          id: String(profile.id),
          image: profile.avatar_url ?? null,
          name: profile.name ?? profile.login,
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
}

export function getAppSession() {
  return getServerSession(authOptions)
}

export function getStudentFromSession(
  session: Awaited<ReturnType<typeof getAppSession>>,
) {
  if (session?.user.kind !== "student" || !session.user.studentId) {
    return null
  }

  return {
    githubUsername: session.user.githubUsername ?? "",
    studentId: session.user.studentId,
    studentName: session.user.studentName ?? session.user.name ?? "未命名學員",
    teamId: session.user.teamId ?? "",
    teamName: session.user.teamName ?? "",
  } satisfies AuthenticatedStudent
}
