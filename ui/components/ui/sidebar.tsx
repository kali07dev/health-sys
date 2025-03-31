"use client"

import * as React from "react"
import { Menu, ChevronLeft } from "lucide-react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SidebarContextType = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isCollapsed: boolean
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  state: "expanded" | "collapsed" | "hidden"
}

const SidebarContext = React.createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  
  let state = "expanded"
  if (!isOpen) state = "hidden"
  else if (isCollapsed) state = "collapsed"
  
  return (
    <SidebarContext.Provider 
      value={{ isOpen, setIsOpen, isCollapsed, setIsCollapsed, state: state as "expanded" | "collapsed" | "hidden" }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export function Sidebar({ className, children }: React.ComponentProps<"aside">) {
  const { isOpen, setIsOpen, isCollapsed } = useSidebar()

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-white transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
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
  const { 
    // isOpen, 
    setIsOpen, 
    // isCollapsed, 
    setIsCollapsed } = useSidebar()

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="mr-2" 
      onClick={() => {
        // On mobile (sm:hidden) toggle open state
        if (window.innerWidth < 640) {
          setIsOpen((prev) => !prev)
        } else {
          // On desktop toggle collapsed state
          setIsCollapsed((prev) => !prev)
        }
      }}
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

export function SidebarCollapseButton() {
  const { isCollapsed, setIsCollapsed } = useSidebar()

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={() => setIsCollapsed((prev) => !prev)}
      className="ml-auto mr-1 hidden sm:flex"
    >
      <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
      <span className="sr-only">Collapse Sidebar</span>
    </Button>
  )
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  const { isCollapsed } = useSidebar()
  
  return (
    <div className={cn(
      "flex h-14 items-center border-b px-3",
      isCollapsed && "justify-center px-0",
      className
    )} {...props} />
  )
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 overflow-auto", className)} {...props} />
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mt-auto border-t p-3", className)} {...props} />
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"nav">) {
  const { isCollapsed } = useSidebar()
  
  return <nav className={cn(
    "space-y-0.5 p-3", 
    isCollapsed && "p-2",
    className
  )} {...props} />
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("", className)} {...props} />
}

interface SidebarMenuButtonProps extends React.ComponentProps<"a"> {
  asChild?: boolean
}

export function SidebarMenuButton({ className, asChild = false, children, ...props }: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : "a"
  const { isCollapsed } = useSidebar()
  
  // Handle the children to separate icon from text
  let icon = null;
  let text = null;
  
  React.Children.forEach(children, child => {
    if (React.isValidElement(child) && typeof child.type !== 'string') {
      icon = child;
    } else if (typeof child === 'string') {
      text = child;
    }
  });

  return (
    <Comp
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900",
        isCollapsed && "justify-center px-2",
        "active:bg-gray-200",
        className,
      )}
      {...props}
    >
      {icon}
      {!isCollapsed && text && <span className="ml-3">{text}</span>}
    </Comp>
  )
}