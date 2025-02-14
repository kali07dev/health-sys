// components/layouts/Navbar.tsx
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { Session } from "next-auth";

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isMobile: boolean;
  session: Session;
}

export default function Navbar({ 
  sidebarOpen, 
  setSidebarOpen, 
  isMobile,
  session 
}: NavbarProps) {
  return (
    <header className="flex items-center h-16 px-6 bg-white shadow-sm">
      {isMobile && (
        <IconButton
          icon={Menu}
          color="gray"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mr-4"
        />
      )}

      <div className="flex-1 flex items-center">
        <IconButton icon={Search} color="gray" className="mr-4" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full md:w-96 px-4 py-2 text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      <div className="flex items-center">
        <IconButton icon={Bell} color="blue" className="mr-4" />
        <div className="flex items-center">
          <img
            src="/placeholder.svg?height=32&width=32"
            alt="User"
            className="w-8 h-8 rounded-full"
          />
          <span className="ml-2 text-sm font-medium text-gray-700 hidden md:inline">
            {session.user?.email}
          </span>
          <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
        </div>
      </div>
    </header>
  );
}