import type React from "react"
import { NotificationList } from "@/components/notifications/NotificationList"  
import { Button } from "@/components/ui/button"

const NotificationsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      <Button className="mb-4 bg-purple-500 hover:bg-purple-600 text-white">Mark All as Read</Button>
      <NotificationList />
    </div>
  )
}

export default NotificationsPage

