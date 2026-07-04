import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"

export const metadata: Metadata = {
  title: "視界咖啡館講者志願",
  description: "SITCON Camp 2026 視界咖啡館講者志願選擇。",
}

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="zh-Hant" data-theme="light" style={{ colorScheme: "light" }}>
      <body>{children}</body>
    </html>
  )
}
