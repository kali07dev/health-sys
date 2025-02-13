import type React from "react"
import { NotificationSettings } from "@/components/notifications/NotificationSettings"  

const NotificationSettingsPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Notification Settings</h1>
      <NotificationSettings />
    </div>
  )
}

export default NotificationSettingsPage

