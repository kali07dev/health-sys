import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/auth-options"
import InfoPanel from "@/components/ui/InfoPanel"
import { PencilIcon } from "lucide-react"
import EditVPCForm from "@/components/forms/EditVPCForm"
import { getVPCById } from "@/lib/api/vpc"

interface EditVPCPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditVPCPage({ params }: EditVPCPageProps) {
  const session = await getServerSession(authOptions)
  const { id } = await params;

  // Check if user is authenticated
  if (!session) {
    redirect("/auth/login")
  }

  // Get user ID from session
  const userId = session.user?.id

  // Fetch VPC data
  let vpcData = null
  try {
    vpcData = await getVPCById(id, session.token)
  } catch (error) {
    console.error("Error fetching VPC:", error)
    redirect("/vpc")
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Edit Info Panel */}
      <InfoPanel 
        title="Edit VPC Report" 
        icon={<PencilIcon className="h-5 w-5 text-blue-600" />}
        className="bg-blue-50 border-blue-200"
      >
        <p className="text-sm text-blue-700">
          You are editing VPC report <strong>{vpcData?.data.vpcNumber}</strong>. 
          Make the necessary changes and submit to update the report.
        </p>
      </InfoPanel>

      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <EditVPCForm userId={userId} vpcData={{...vpcData?.data, id: id}} />
      </div>
    </div>
  )
}