"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import type { CorrectiveAction } from "@/interfaces/incidents"
import { incidentAPI } from "@/utils/api"
import EmployeeActionCard from "./EmployeeActionCard"
import ActionDetailsSidebar from "./ActionDetailsSidebar"
import { Loader2 } from "lucide-react"
import { useTranslations } from 'next-intl'

interface CorrectiveActionsContentProps {
  userId: string
  userRole: string
}

export default function CorrectiveActionsContent({ userId, userRole }: CorrectiveActionsContentProps) {
  const [actions, setActions] = useState<CorrectiveAction[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const t = useTranslations('correctiveActions')

  useEffect(() => {
    const fetchUserActions = async () => {
      try {
        setLoading(true)
        const response = await incidentAPI.getCorrectiveActionsByUserID(userId)
        setActions(Array.isArray(response) ? response : [])
        setError(null)
      } catch (err) {
        console.error(err)
        setError(t('messages.loadFailed'))
        toast.error(t('messages.loadFailed'))
      } finally {
        setLoading(false)
      }
    }
    fetchUserActions()
  }, [userId, t])

  const fetchUserActions = async () => {
    try {
      setLoading(true)
      const response = await incidentAPI.getCorrectiveActionsByUserID(userId)
      setActions(Array.isArray(response) ? response : [])
      setError(null)
    } catch (err) {
      console.error(err)
      setError(t('messages.loadFailed'))
      toast.error(t('messages.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action: CorrectiveAction) => {
    setSelectedAction(action)
    setSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
  }

  const handleActionUpdated = () => {
    fetchUserActions()
    toast.success(t('messages.actionUpdated'))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-700">
        <p className="font-medium">{t('errors.title')}</p>
        <p>{error}</p>
      </div>
    )
  }

  if (!actions || actions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
        <h3 className="text-lg font-medium text-gray-700 mb-2">{t('sections.noActions')}</h3>
        <p className="text-gray-500">{t('sections.noActionsDescription')}</p>
      </div>
    )
  }

  // Group actions by status
  const pendingActions = actions.filter((a) => a.status === "pending" || a.status === "in_progress")
  const completedActions = actions.filter((a) => a.status === "completed" || a.status === "verified")
  const overdueActions = actions.filter((a) => a.status === "overdue")

  return (
    <div className="space-y-8 mt-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('sections.pending')}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{pendingActions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-amber-500">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('sections.overdue')}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{overdueActions.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('sections.completed')}</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{completedActions.length}</p>
        </div>
      </div>

      {/* Overdue actions section */}
      {overdueActions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-600 mb-4">{t('sections.overdue')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overdueActions.map((action) => (
              <EmployeeActionCard key={action.id} action={action} onClick={() => handleActionClick(action)} />
            ))}
          </div>
        </div>
      )}

      {/* Pending actions section */}
      {pendingActions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('sections.active')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingActions.map((action) => (
              <EmployeeActionCard key={action.id} action={action} onClick={() => handleActionClick(action)} />
            ))}
          </div>
        </div>
      )}

      {/* Completed actions section */}
      {completedActions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('sections.completed')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedActions.map((action) => (
              <EmployeeActionCard key={action.id} action={action} onClick={() => handleActionClick(action)} />
            ))}
          </div>
        </div>
      )}

      {/* Action details sidebar */}
      {selectedAction && (
        <ActionDetailsSidebar
          action={selectedAction}
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          onActionUpdated={handleActionUpdated}
          userId={userId}
          userRole={userRole}
        />
      )}
    </div>
  );
}