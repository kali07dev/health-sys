/* eslint-disable @typescript-eslint/no-unused-vars */
// app/(main)/layout.tsx
"use client";

import { useEffect } from "react";
// import { NextIntlClientProvider } from 'next-intl';
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import PageHeader from '@/components/PageHeader';

// Define the message structure type
type Messages = {
  auth?: Record<string, string>;
  navigation?: Record<string, string>;
  common?: Record<string, string>;
  errors?: Record<string, string>;
  success?: Record<string, string>;
};

function MainContent({ 
  children
}: { 
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();
  
  useEffect(() => {
    const sidebarContent = document.querySelector('.sidebar-content');
    
    if (sidebarContent && window.innerWidth >= 640) { // sm breakpoint
      if (isCollapsed) {
        sidebarContent.classList.remove('sm:pl-64');
        sidebarContent.classList.add('sm:pl-16');
      } else {
        sidebarContent.classList.remove('sm:pl-16');
        sidebarContent.classList.add('sm:pl-64');
      }
    }
    
    // Handle resize events
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        if (isCollapsed) {
          sidebarContent?.classList.remove('sm:pl-64');
          sidebarContent?.classList.add('sm:pl-16');
        } else {
          sidebarContent?.classList.remove('sm:pl-16');
          sidebarContent?.classList.add('sm:pl-64');
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isCollapsed]);

  return (
    <div className="flex h-full bg-gray-50">
      <AppSidebar />
      <div className="flex-1 flex flex-col sm:pl-64 transition-all duration-300 sidebar-content">
        <AppHeader />
        <main className="flex-1">
          <PageHeader />
          {children}
        </main>
      </div>
    </div>
  );
}

// Helper function to get current locale
function getCurrentLocale(): string {
  if (typeof window === 'undefined') return 'en';
  
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('locale='))
    ?.split('=')[1] || 'en';
}

// Helper function to load messages
async function loadMessages(locale: string): Promise<Messages> {
  try {
    const messages = await import(`../../messages/${locale}.json`);
    return messages.default || messages;
  } catch (error) {
    console.warn(`Failed to load messages for locale: ${locale}`, error);
    try {
      // Fallback to English
      const fallbackMessages = await import('../../messages/en.json');
      return fallbackMessages.default || fallbackMessages;
    } catch (fallbackError) {
      console.error('Failed to load fallback messages', fallbackError);
      return {};
    }
  }
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <MainContent>{children}</MainContent>
    </SidebarProvider>
  );
}