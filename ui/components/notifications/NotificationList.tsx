import type React from "react"
import { useQuery } from "react-query"
import { fetchNotifications } from "@/api/notifications"
import { Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import { toast } from "../ui/use-toast"

export const NotificationList: React.FC = () => {
  const { data: notifications, isLoading, error } = useQuery("notifications", fetchNotifications)

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin" />
  }

  if (error) {
    toast({
      title: "Error",
      description: "Failed to load notifications",
      variant: "destructive",
    })
    return <div>Error loading notifications</div>
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification: any) => (
        <div key={notification.id} className="bg-white shadow rounded-lg p-4">
          <h3 className="font-bold text-lg">{notification.title}</h3>
          <p className="text-gray-600">{notification.message}</p>
          <p className="text-sm text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
          <Button className="mt-2 bg-blue-500 hover:bg-blue-600 text-white">Mark as Read</Button>
        </div>
      ))}
    </div>
  )
}

