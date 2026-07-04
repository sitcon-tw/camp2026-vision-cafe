import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"

export const metadata: Metadata = {
  title: "Vision Cafe",
  description: "CAMP 2026 Vision Cafe app.",
}

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" data-theme="light" style={{ colorScheme: "light" }}>
      <body>{children}</body>
    </html>
  )
}
