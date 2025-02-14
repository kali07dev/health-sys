import type { Metadata } from "next"
import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google"
import type React from "react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import Providers from "@/app/providers"
import { SidebarProvider } from "@/components/ui/sidebar"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Safety System",
  description: "Report and track Incidents",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
        <Providers>
          <SidebarProvider>
            <div className="flex h-full bg-gray-50">
              <AppSidebar />
              <div className="flex-1 flex flex-col sm:pl-64">
                <AppHeader />
                <main className="flex-1">{children}</main>
              </div>
            </div>
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  )
}

