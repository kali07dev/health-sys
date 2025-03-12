"use client"
import { 
  LayoutDashboard, 
  AlertTriangle, 
  FileBarChart, 
  Bell, 
  ClipboardList, 
  Settings,
  // LogOut,
  Search, // Icon for Investigations
  ListChecks, // Icon for Assigned Actions
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

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: AlertTriangle, label: "Incidents", href: "/incidents" },
  { icon: Search, label: "Investigations", href: "/investigation" }, // New route for Investigations
  { icon: ListChecks, label: "Assigned Actions", href: "/actions" }, // New route for Assigned Actions
  { icon: FileBarChart, label: "Reports", href: "/reports" },
  { icon: Bell, label: "Alerts", href: "/alerts" },
  { icon: ClipboardList, label: "Tasks", href: "/tasks" },
  { icon: Settings, label: "Profile", href: "/profile" },
  { icon: Shield, label: "Admin", href: "/admin" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

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
          width={36} // Set the width to match your design (h-9 = 36px)
          height={36} // Set the height to match your design (w-9 = 36px)
          className="rounded-full"
        />
          <div className="flex-1 truncate">
            <div className="truncate text-sm font-medium text-gray-900">{session?.role}</div>
            <div className="truncate text-sm text-gray-500">{session?.user?.email}</div>
          </div>
        </div>
        {/* Add LogoutButton to the SidebarFooter */}
        <LogoutButton variant="ghost" className="w-full justify-start" />
      </SidebarFooter>
    </Sidebar>
  )
}