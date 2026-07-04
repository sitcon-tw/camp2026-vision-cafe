import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      if (req.nextUrl.pathname === "/admin/login") {
        return true
      }

      return token?.kind === "admin"
    },
  },
  pages: {
    signIn: "/admin/login",
  },
  secret: process.env.AUTH_SECRET,
})

export const config = {
  matcher: ["/admin/:path*"],
}
