// components/layouts/Sidebar.tsx
import {
    LayoutDashboard,
    Menu,
    MessageSquare,
    PieChart,
    Settings,
    Users,
  } from "lucide-react";
  import { IconButton } from "@/components/ui/icon-button";
  
  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", color: "red" },
    { icon: Users, label: "Customers", color: "blue" },
    { icon: PieChart, label: "Analytics", color: "red" },
    { icon: MessageSquare, label: "Messages", color: "blue" },
    { icon: Settings, label: "Settings", color: "gray" },
  ];
  
  interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    isMobile: boolean;
  }
  
  export default function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
    return (
      <aside
        className={`${
          isOpen ? "w-64" : "w-0 md:w-20"
        } transition-all duration-300 ease-in-out bg-white shadow-md fixed md:relative h-full z-50 ${
          !isOpen && isMobile ? "hidden" : ""
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <h1
            className={`text-xl font-semibold text-red-500 ${
              (!isOpen || isMobile) && "hidden"
            }`}
          >
            Dashboard
          </h1>
          <IconButton
            icon={Menu}
            color="red"
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item, index) => (
              <li key={index}>
                <a
                  href="#"
                  className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                    index === 0
                      ? "bg-red-50 text-red-500"
                      : `text-${item.color}-500`
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {isOpen && <span className="ml-3">{item.label}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    );
  }