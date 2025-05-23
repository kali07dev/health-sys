// app/(auth)/auth/layout.tsx
// import { Geist, Azeret_Mono as Geist_Mono } from "next/font/google"
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import Providers from "@/app/providers";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import "../../globals.css";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// })

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// })

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Providing all messages to the client side is the easiest way to get started
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>
        <div className="min-h-screen bg-gray-50">
          {/* Top bar with language switcher */}
          <div className="absolute top-4 right-4 z-10">
            <LanguageSwitcher />
          </div>
          
          {/* Auth content */}
          <div className="flex min-h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
              {children}
            </div>
          </div>
        </div>
      </Providers>
    </NextIntlClientProvider>
  );
}