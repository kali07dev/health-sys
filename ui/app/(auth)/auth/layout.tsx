// app/auth/layout.tsx
// import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google"
import Providers from "@/app/providers"
import "../../globals.css"

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// })

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// })

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
        <Providers>
          <main className="min-h-screen flex items-center justify-center bg-gray-50">
            {children}
          </main>
        </Providers>
  )
}