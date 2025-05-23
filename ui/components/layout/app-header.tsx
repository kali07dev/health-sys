"use client"
import { Bell, ChevronDown, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from 'next-intl';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Image from "next/image"

export function AppHeader() {
  const { data: session } = useSession();
  const t = useTranslations('navigation');

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center gap-4 px-4">
        <SidebarTrigger />
        
        <div className="flex flex-1 items-center justify-between">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={t('search')}
              className="pl-10 pr-4"
            />
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher />
            
            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-5 w-5" />
              <span className="sr-only">{t('notifications')}</span>
            </Button>

            {/* User Menu */}
            <Button variant="ghost" className="gap-2 text-gray-700 hover:text-red-600 hover:bg-red-50">
              <Image src="/user.svg" alt="User" 
                width={36}
                height={36}                   
                className="h-6 w-6 rounded-full" />
              <span className="hidden text-sm font-normal md:inline-block">{session?.user?.email}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}