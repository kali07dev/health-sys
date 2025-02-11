"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useState } from "react"
import {
  Bell,
  ChevronDown,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PieChart,
  Search,
  Settings,
  Users,
} from "lucide-react"
import { IconButton } from "@/components/ui/icon-button"
import { Card } from "@/components/ui/card"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", color: "red" },
  { icon: Users, label: "Customers", color: "blue" },
  { icon: PieChart, label: "Analytics", color: "red" },
  { icon: MessageSquare, label: "Messages", color: "blue" },
  { icon: Settings, label: "Settings", color: "gray" },
]


export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { data: session, status } = useSession(); // Get status
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]); // Watch status instead of session

  if (status === "loading") {
    return <div>Loading...</div>; // Show loading state
  }

  if (!session) {
    return null; // Fallback (shouldn't reach here if status is handled)
  }

  return (
     <div className="flex h-screen bg-gray-100">
     {/* Sidebar */}
     <aside className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 ease-in-out bg-white shadow-md`}>
       <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
         <h1 className={`text-xl font-semibold text-red-500 ${!sidebarOpen && "hidden"}`}>Dashboard</h1>
         <IconButton icon={Menu} color="red" onClick={() => setSidebarOpen(!sidebarOpen)} />
       </div>
       <nav className="p-4">
         <ul className="space-y-2">
           {sidebarItems.map((item, index) => (
             <li key={index}>
               <a
                 href="#"
                 className={`flex items-center p-2 rounded-lg hover:bg-gray-100 ${
                   index === 0 ? "bg-red-50 text-red-500" : `text-${item.color}-500`
                 }`}
               >
                 <item.icon className="w-5 h-5" />
                 {sidebarOpen && <span className="ml-3">{item.label}</span>}
               </a>
             </li>
           ))}
         </ul>
       </nav>
     </aside>

     {/* Main content */}
     <div className="flex-1 flex flex-col overflow-hidden">
       {/* Navbar */}
       <header className="flex items-center h-16 px-6 bg-white shadow-sm">
         <div className="flex-1 flex items-center">
           <IconButton icon={Search} color="gray" className="mr-4" />
           <input
             type="text"
             placeholder="Search..."
             className="w-96 px-4 py-2 text-gray-700 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-red-500"
           />
         </div>
         <div className="flex items-center">
           <IconButton icon={Bell} color="blue" className="mr-4" />
           <div className="flex items-center">
             <img src="/placeholder.svg?height=32&width=32" alt="User" className="w-8 h-8 rounded-full" />
             <span className="ml-2 text-sm font-medium text-gray-700">John Doe</span>
             <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
           </div>
         </div>
       </header>

       {/* Dashboard content */}
       <main className="flex-1 overflow-y-auto p-6">
         <div className="mb-8">
           <h2 className="text-3xl font-bold text-gray-800">Welcome back, John</h2>
           <p className="text-gray-600">Here's what's happening with your projects today.</p>
         </div>
              <h1>Dashboard</h1>
                  <p>Welcome, {session.user?.email}</p>
                  <p>Your role is: {session.role}</p>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
           <Card title="Total Revenue" color="red">
             <div className="text-3xl font-bold text-gray-800">$24,345</div>
             <div className="text-sm text-gray-500">+2.5% from last month</div>
           </Card>
           <Card title="Active Users" color="blue">
             <div className="text-3xl font-bold text-gray-800">1,234</div>
             <div className="text-sm text-gray-500">+15% from last week</div>
           </Card>
           <Card title="Conversion Rate" color="red">
             <div className="text-3xl font-bold text-gray-800">2.5%</div>
             <div className="text-sm text-gray-500">+0.2% from yesterday</div>
           </Card>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <Card title="Recent Activity" color="white">
             <ul className="space-y-4">
               {[1, 2, 3, 4].map((item) => (
                 <li key={item} className="flex items-center">
                   <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                     <Home className="w-4 h-4 text-red-500" />
                   </div>
                   <div>
                     <p className="text-sm font-medium text-gray-800">New user signed up</p>
                     <p className="text-xs text-gray-500">2 minutes ago</p>
                   </div>
                 </li>
               ))}
             </ul>
           </Card>
           <Card title="Top Products" color="white">
             <ul className="space-y-4">
               {[1, 2, 3, 4].map((item) => (
                 <li key={item} className="flex items-center justify-between">
                   <div className="flex items-center">
                     <div className="w-10 h-10 rounded bg-blue-100 mr-3" />
                     <div>
                       <p className="text-sm font-medium text-gray-800">Product Name</p>
                       <p className="text-xs text-gray-500">Category</p>
                     </div>
                   </div>
                   <div className="text-sm font-medium text-blue-800">$1,234</div>
                 </li>
               ))}
             </ul>
           </Card>
         </div>
       </main>
     </div>
   </div>
  );
}