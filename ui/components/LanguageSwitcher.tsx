// components/LanguageSwitcher.tsx
"use client";

import { useTransition } from 'react';
import { useLocale } from 'next-intl';
import { ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const locales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const changeLanguage = (newLocale: string) => {
    startTransition(() => {
      // Set cookie for locale persistence
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000`; // 1 year
      
      // Reload the page to apply the new locale
      window.location.reload();
    });
  };

  const currentLocale = locales.find(l => l.code === locale) || locales[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={isPending}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLocale.flag} {currentLocale.name}</span>
          <span className="sm:hidden">{currentLocale.flag}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc.code}
            onClick={() => changeLanguage(loc.code)}
            className={`flex items-center gap-3 cursor-pointer ${
              loc.code === locale ? 'bg-gray-100' : ''
            }`}
          >
            <span className="text-lg">{loc.flag}</span>
            <span>{loc.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}