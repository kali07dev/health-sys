"use client"
import { Bell, ChevronDown, Search } from "lucide-react"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function AppHeader() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-white px-3 sm:px-6">
      <div className="flex flex-1 items-center gap-4">
        <SidebarTrigger />
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input type="search" placeholder="Search..." className="w-full bg-gray-50 pl-9 focus:bg-white" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-gray-700">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <Button variant="ghost" className="gap-2 text-gray-700">
          <img src="/placeholder.svg?height=32&width=32" alt="User" className="h-6 w-6 rounded-full" />
          <span className="hidden text-sm font-normal md:inline-block">{session?.user?.email}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

