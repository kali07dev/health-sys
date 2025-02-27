"use client"
import { HomeIcon, LayoutDashboard, MessageSquare, PieChart, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import LogoutButton from "@/components/LogoutButton" // Import the LogoutButton

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
  { icon: HomeIcon, label: "Dashboard", href: "/" },
  { icon: Users, label: "Incidents", href: "/incidents" },
  { icon: PieChart, label: "Reports", href: "/reports" },
  { icon: MessageSquare, label: "Alerts", href: "/alerts" },
  { icon: MessageSquare, label: "Tasks", href: "/tasks" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader>
        <h1 className="text-lg font-semibold text-violet-600">Safety System</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton className={pathname === item.href ? "bg-violet-50 text-violet-600" : undefined}>
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
          <img src="/placeholder.svg?height=32&width=32" alt="User" className="h-9 w-9 rounded-full" />
          <div className="flex-1 truncate">
            <div className="truncate text-sm font-medium text-gray-900">John Doe</div>
            <div className="truncate text-sm text-gray-500">john@example.com</div>
          </div>
        </div>
        {/* Add LogoutButton to the SidebarFooter */}
        <LogoutButton variant="ghost" className="w-full justify-start" />
      </SidebarFooter>
    </Sidebar>
  )
}