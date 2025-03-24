"use client"
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileBarChart, 
  Bell, 
  // ClipboardList, 
  Settings,
  Search, 
  ListChecks, 
  Shield
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import LogoutButton from "@/components/LogoutButton"
import { useSession } from "next-auth/react"
import Image from 'next/image';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  // Check if user has admin privileges
  const isAdminUser = session?.role === 'admin' || session?.role === 'safety_officer' || session?.role === 'manager'
  
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: AlertTriangle, label: "Incidents", href: "/incidents" },

    { icon: Search, label: "Investigations", href: "/investigation" },
    { icon: ListChecks, label: "Assigned Actions", href: "/actions" },
    // Only show Reports for admin, safety_officer, or manager

    ...(isAdminUser ? [{ icon: FileBarChart, label: "Reports", href: "/reports" }] : []),
    { icon: Bell, label: "Alerts", href: "/alerts" },
    // ...(isAdminUser ? [{ icon: ClipboardList, label: "Tasks", href: "/tasks" }] : []),

    { icon: Settings, label: "Profile", href: "/profile" },
    // Only show Admin for admin, safety_officer, or manager
    ...(isAdminUser ? [{ icon: Shield, label: "Admin", href: "/admin" }] : []),
  ]

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-lg font-semibold text-red-600">Safety System</h1>
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