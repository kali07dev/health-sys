"use client"
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileBarChart, 
  Bell, 
  Settings,
  Search, 
  ListChecks, 
  Shield,
  Biohazard,
  ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import LogoutButton from "@/components/LogoutButton"
import { useSession } from "next-auth/react"
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarCollapseButton
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const t = useTranslations('sidebar');
  
  // Check if user has admin privileges
  const isAdminUser = session?.role === 'admin' || session?.role === 'safety_officer' || session?.role === 'manager'
  
  const sidebarItems = [
    { icon: LayoutDashboard, label: t('dashboard'), href: "/" },
    { icon: AlertTriangle, label: t('incidents'), href: "/incidents" },
    { icon: Biohazard, label: t('hazards'), href: "/hazards" },
    { icon: ShieldCheck, label: t('vpc'), href: "/vpc" },
    { icon: Search, label: t('investigation'), href: "/investigation" },
    { icon: ListChecks, label: t('assignedTasks'), href: "/actions" },
    ...(isAdminUser ? [{ icon: FileBarChart, label: t('reports'), href: "/reports" }] : []),
    { icon: Bell, label: t('alerts'), href: "/alerts" },
    { icon: Settings, label: t('profile'), href: "/profile" },
    ...(isAdminUser ? [{ icon: Shield, label: t('admin'), href: "/admin" }] : []),
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-lg font-semibold text-red-600 truncate">{t('safetySystem')}</h1>
        <SidebarCollapseButton />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton className={pathname === item.href ? "bg-red-50 text-red-600" : undefined}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 px-3 py-2">
          <Image
            src="/user.svg"
            alt="User"
            width={36}
            height={36}
            className="rounded-full"
          />
          <div className="flex-1 truncate">
            <div className="truncate text-sm font-medium text-gray-900">{session?.role}</div>
            <div className="truncate text-sm text-gray-500">{session?.user?.email}</div>
          </div>
        </div>
        <LogoutButton variant="ghost" className="w-full justify-start" />
      </SidebarFooter>
    </Sidebar>
  )
}