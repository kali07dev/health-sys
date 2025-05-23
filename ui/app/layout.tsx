import type { Metadata } from "next"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';

import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google"
import "./globals.css"
import Providers from "@/app/providers"

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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} className="h-full">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <Providers>
          {children}
        </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}