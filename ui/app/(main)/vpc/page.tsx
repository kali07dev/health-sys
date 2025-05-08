import { Suspense } from "react"
import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/auth-options"
import VPCView from "@/components/view/VPCView"
import { VPCSkeleton } from "@/components/view/VPCSkeleton"

import InfoPanel from "@/components/ui/InfoPanel"
import { ClipboardList, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function VPCPage() {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session) {
    redirect("/auth/login")
  }

  // Get user role and ID from session
  const userRole = session.role
  const userId = session.user?.id

  // If user is an Employee, redirect to create VPC page
  if (userRole === "employee") {
    redirect("/vpc/create")
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <InfoPanel
        title="Visible Person Commitment (VPC) Management"
        icon={<ClipboardList className="h-5 w-5 text-red-600" />}
      >
        <p className="text-sm text-gray-700">
          This section lists all VPCs in the system. You can view details of each VPC by clicking on the card. Use the
          search functionality to filter VPCs by various criteria.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Link href="/vpc/create">
            <Button size="sm" variant="outline" className="bg-white">
              <Plus className="h-4 w-4 mr-1" />
              Create VPC
            </Button>
          </Link>
        </div>
      </InfoPanel>
      <Suspense fallback={<VPCSkeleton />}>
        <VPCView userId={userId} userRole={userRole} />
      </Suspense>
    </div>
  )
}
