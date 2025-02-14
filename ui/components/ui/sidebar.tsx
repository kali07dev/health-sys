"use client"

import * as React from "react"
import { Menu } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SidebarContextType = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  state: "expanded" | "collapsed"
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const state = isOpen ? "expanded" : "collapsed"

  return <SidebarContext.Provider value={{ isOpen, setIsOpen, state }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export function Sidebar({ className, children }: React.ComponentProps<"aside">) {
  const { isOpen, setIsOpen } = useSidebar()

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r bg-white transition-transform",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "sm:translate-x-0", // Always visible on larger screens
          className,
        )}
      >
        <div className="flex h-full flex-col">{children}</div>
      </aside>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black bg-opacity-50 transition-opacity sm:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsOpen(false)}
      />
    </>
  )
}

export function SidebarTrigger() {
  const { setIsOpen } = useSidebar()

  return (
    <Button variant="ghost" size="icon" className="sm:hidden mr-2" onClick={() => setIsOpen((prev) => !prev)}>
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex h-14 items-center border-b px-3", className)} {...props} />
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props} />
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto border-t p-3", className)} {...props} />
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav className={cn("space-y-0.5 p-3", className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />
}

interface SidebarMenuButtonProps extends React.ComponentProps<"a"> {
  asChild?: boolean
}

export function SidebarMenuButton({ className, asChild = false, ...props }: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900",
        "active:bg-gray-200",
        className,
      )}
      {...props}
    />
  )
}

