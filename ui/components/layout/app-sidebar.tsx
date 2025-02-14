"use client"
import { LayoutDashboard, MessageSquare, PieChart, Settings, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

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
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: PieChart, label: "Analytics", href: "/analytics" },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
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
      </SidebarFooter>
    </Sidebar>
  )
}

