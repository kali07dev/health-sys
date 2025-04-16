import { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/auth-options"
import InvestigationsView from "@/components/view/InvestigationsView"
import { InvestigationsSkeleton } from "@/components/view/InvestigationsSkeleton"

import InfoPanel from "@/components/ui/InfoPanel"
import { ClipboardList, Play, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function InvestigationsPage() {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session) {
    redirect("/auth/login")
  }

  // Get user role and ID from session
  const userRole = session.role
  const userId = session.user?.id

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Investigations</h1> */}
      <InfoPanel title="Pending Investigations" icon={<ClipboardList className="h-5 w-5 text-red-600" />}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          This section lists investigations requiring your attention. Each investigation must be completed within 72
          hours of assignment. Use the action buttons to update progress or request support.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-700"
          >
            <Play className="h-4 w-4 mr-1" />
            Start Investigation
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-white dark:bg-gray-800 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-gray-700"
          >
            <AlertCircle className="h-4 w-4 mr-1" />
            Request Support
          </Button>
        </div>
      </InfoPanel>
      <Suspense fallback={<InvestigationsSkeleton />}>
        <InvestigationsView userId={userId} userRole={userRole} />
      </Suspense>
    </div>
  )
}

