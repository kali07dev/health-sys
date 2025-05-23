import { Suspense } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/app/api/auth/auth-options"
import CorrectiveActionsContent from "@/components/CorrectiveActions/EmployeeView/CorrectiveActionsContent"
import CorrectiveActionsSkeleton from "@/components/NotificationsSkeletonLoader"
import InfoPanel from "@/components/ui/InfoPanel"
import { ShieldAlert, CheckCircle, CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTranslations } from 'next-intl/server'

export default async function CorrectiveActionsPage() {
  const session = await getServerSession(authOptions)
  const t = await getTranslations('correctiveActions')

  if (!session) {
    redirect("/auth/login")
  }

  const userRole = session.role
  const userId = session.user?.id

  return (
    <div className="container mx-auto py-8 px-4 bg-gray-50 min-h-screen">
      <InfoPanel title={t('infoPanel.title')} icon={<ShieldAlert className="h-5 w-5 text-red-600" />}>
        <p className="text-sm text-gray-700">
          {t('infoPanel.description')} <strong>{t('infoPanel.highPriorityNote')}</strong>
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="outline" className="bg-white">
            <CheckCircle className="h-4 w-4 mr-1" />
            {t('buttons.markComplete')}
          </Button>
          <Button size="sm" variant="outline" className="bg-white">
            <CalendarPlus className="h-4 w-4 mr-1" />
            {t('buttons.requestExtension')}
          </Button>
        </div>
      </InfoPanel>
      <Suspense fallback={<CorrectiveActionsSkeleton />}>
        <CorrectiveActionsContent userId={userId} userRole={userRole} />
      </Suspense>
    </div>
  )
}