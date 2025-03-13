"use client"

import * as React from "react"
import { Home } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Card } from "@/components/ui/card"

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Welcome back, {session.user?.email || "User"}</h2>
        <p className="text-gray-600">Here&apos;s what&apos;s happening with your projects today.</p>
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
    </div>
  )
}

