import type { Metadata } from "next"
import type { ReactNode } from "react"

import "./globals.css"

export const metadata: Metadata = {
  title: "Vision Cafe 講者志願",
  description: "CAMP 2026 Vision Cafe 學生端講者志願選擇。",
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
