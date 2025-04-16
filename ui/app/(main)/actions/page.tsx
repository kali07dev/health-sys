import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/auth-options"
import CorrectiveActionsContent from "@/components/CorrectiveActions/EmployeeView/CorrectiveActionsContent"
import CorrectiveActionsSkeleton from "@/components/NotificationsSkeletonLoader"
import InfoPanel from "@/components/ui/InfoPanel"
import { ShieldAlert, CheckCircle, CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function CorrectiveActionsPage() {
  // Authentication check
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session) {
    redirect("/auth/login")
  }

  // Get user role and ID from session
  const userRole = session.role
  const userId = session.user?.id

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">My Corrective Actions</h1> */}
      <InfoPanel title="Open Corrective Actions" icon={<ShieldAlert className="h-5 w-5 text-red-600" />}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          These are safety improvements assigned to you. Each action has a priority level and deadline.
          <strong> High-priority items</strong> must be addressed within 24 hours.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-700"
          >
            <CalendarPlus className="h-4 w-4 mr-1" />
            Request Extension
          </Button>
        </div>
      </InfoPanel>
      <Suspense fallback={<CorrectiveActionsSkeleton />}>
        <CorrectiveActionsContent userId={userId} userRole={userRole} />
      </Suspense>
    </div>
  )
}