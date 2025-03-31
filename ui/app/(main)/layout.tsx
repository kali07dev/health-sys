"use client"

import { useEffect } from "react"
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"
import PageHeader from '@/components/PageHeader'

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  
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

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <MainContent>{children}</MainContent>
    </SidebarProvider>
  )
}