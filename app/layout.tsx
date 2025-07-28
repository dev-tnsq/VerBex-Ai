import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import {
  SidebarProvider,
  SidebarInset
} from "@/components/ui/sidebar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Verbex AI - Your Intelligent DeFi Companion",
  description: "Navigate Stellar DeFi with confidence across Blend, Soroswap, and DeFindex. Professional portfolio management powered by AI.",
  generator: 'Verbex AI'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SidebarProvider>
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  )
}
