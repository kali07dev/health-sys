import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/auth-options"
import InfoPanel from "@/components/ui/InfoPanel"
import { ClipboardList } from "lucide-react"
import CreateVPCForm from "@/components/forms/CreateVPCForm"

export default async function CreateVPCPage() {
  const session = await getServerSession(authOptions)

  // Check if user is authenticated
  if (!session) {
    redirect("/auth/login")
  }

  // Get user ID from session
  const userId = session.user?.id

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <InfoPanel title="Create New VPC" icon={<ClipboardList className="h-5 w-5 text-red-600" />}>
        <p className="text-sm text-gray-700">
          Use this form to create a new Visible person commitment report. Please provide all required information to
          ensure proper processing of the report.
        </p>
      </InfoPanel>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <CreateVPCForm userId={userId} />
      </div>
    </div>
  )
}
