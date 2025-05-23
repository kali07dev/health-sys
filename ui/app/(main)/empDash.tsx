"use client"
import { useState, useEffect } from "react"
import { PlusCircle, ClipboardList, UserCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import StatCard from "@/components/statCard"
import { dashboardAPI } from "@/utils/adminApi"
import { useTranslations } from 'next-intl'

interface Incident {
  ID: string
  ReferenceNumber: string
  Type: string
  SeverityLevel: string
  Status: string
  Title: string
  Description?: string
  Location?: string
  CreatedAt?: string
}

interface CorrectiveAction {
  ID: string
  Description: string
  Priority: string
  Status: string
  DueDate: string
  AssignedBy?: string
  Location?: string
}

interface Metrics {
  totalIncidents: number
  resolvedIncidents: number
  unresolvedIncidents: number
  criticalIncidents: number
  resolutionRate: number
}

interface DashboardData {
  incidents: Incident[]
  metrics: Metrics
  correctiveActions: CorrectiveAction[]
}

interface EmployeeDashProps {
  userID: string
}

export default function EmployeeDashboard({ userID }: EmployeeDashProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const { toast } = useToast()
  const t = useTranslations('employeeDashboard')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardAPI.getEmployeeDashboard(userID)
        setDashboardData(data)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        toast({
          title: t('errors.title'),
          description: t('errors.loadFailed'),
          variant: "error",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast, userID, t])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Quick Actions Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg h-24 flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 mb-2"></div>
              <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded mt-2"></div>
            </div>
          ))}
        </section>

        {/* Metrics Cards Skeleton */}
        <section className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg p-6 h-32">
              <div className="flex justify-between items-start">
                <div className="w-24 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600"></div>
              </div>
              <div className="w-16 h-8 bg-gray-300 dark:bg-gray-600 rounded mt-4"></div>
            </div>
          ))}
        </section>

        {/* Corrective Actions Skeleton */}
        <section className="space-y-4">
          <div className="w-48 h-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg p-6 h-40">
                <div className="w-full h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="w-32 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-40 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Incidents Skeleton */}
        <section className="space-y-4">
          <div className="w-40 h-8 bg-gray-300 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg p-6 h-48">
                <div className="flex justify-between items-center mb-4">
                  <div className="w-40 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="w-36 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-24 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="w-32 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  // Card components
  const IncidentCard = ({ incident }: { incident: Incident }) => {
    const severityTranslation = t(`severity.${incident.SeverityLevel.toLowerCase()}`, {
      defaultValue: incident.SeverityLevel
    })

    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-600 border-t border-r border-b border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2">
            <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{incident.Title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{incident.ReferenceNumber}</p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
              incident.SeverityLevel.toLowerCase() === "critical"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                : incident.SeverityLevel.toLowerCase() === "high"
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                  : incident.SeverityLevel.toLowerCase() === "medium"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
            }`}
          >
            {severityTranslation}
          </span>
        </div>
        <div className="mt-3 flex items-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              incident.Status === "new"
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                : incident.Status === "in_progress"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  : incident.Status === "action_required"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    : incident.Status === "investigating"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                      : incident.Status === "resolved"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {incident.Status}
          </span>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {t('incidentCard.reported', {
            type: incident.Type,
            date: incident.CreatedAt ? new Date(incident.CreatedAt).toLocaleDateString() : ""
          })}
        </p>
        <div className="mt-3 flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="mb-1 sm:mb-0">{t('incidentCard.type', { type: incident.Type })}</span>
          <span>{t('incidentCard.status', { status: incident.Status })}</span>
        </div>
      </div>
    )
  }

  const ActionCard = ({ action }: { action: CorrectiveAction }) => {
    const priorityTranslation = t(`actionCard.priority.${action.Priority.toLowerCase()}`, {
      defaultValue: action.Priority
    })
    const statusTranslation = t(`actionCard.status.${action.Status.toLowerCase()}`, {
      defaultValue: action.Status
    })

    return (
      <div className="rounded-lg bg-white dark:bg-gray-800 p-4 sm:p-6 shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-600 border-t border-r border-b border-red-100 dark:border-red-700">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2">
            <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">{action.Description}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('actionCard.due', { date: new Date(action.DueDate).toLocaleDateString() })}
            </p>
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
              action.Priority.toLowerCase() === "high"
                ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                : action.Priority.toLowerCase() === "medium"
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
            }`}
          >
            {priorityTranslation}
          </span>
        </div>
        <div className="mt-3 flex items-center">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
              action.Status === "pending"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                : action.Status === "completed"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                  : action.Status === "overdue"
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {statusTranslation}
          </span>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{action.Description}</p>
        <div className="mt-3 flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500 dark:text-gray-400">
          <span className="mb-1 sm:mb-0">
            {action.AssignedBy ? t('actionCard.assignedBy', { name: action.AssignedBy }) : ""}
          </span>
          <span>{t('actionCard.due', { date: new Date(action.DueDate).toLocaleDateString() })}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header Section */}
      <header className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-red-600 dark:text-red-500 mb-2">{t('title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('welcome')}</p>
      </header>

      {/* Quick Actions Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Button
          className="bg-red-600 hover:bg-red-700 text-white p-6 h-auto flex flex-col items-center gap-2"
          onClick={() => (window.location.href = "/incidents")}
        >
          <PlusCircle size={24} />
          <span>{t('quickActions.createIncident')}</span>
        </Button>

        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 h-auto flex flex-col items-center gap-2"
          onClick={() => (window.location.href = "/actions")}
        >
          <ClipboardList size={24} />
          <span>{t('quickActions.viewTasks')}</span>
        </Button>

        <Button
          className="bg-black hover:bg-gray-900 text-white p-6 h-auto flex flex-col items-center gap-2"
          onClick={() => (window.location.href = "/profile")}
        >
          <UserCircle size={24} />
          <span>{t('quickActions.viewProfile')}</span>
        </Button>
      </section>

      {/* Metrics Cards */}
      <section className="mb-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('metrics.totalIncidents')}
          value={dashboardData?.metrics.totalIncidents}
          icon={ClipboardList}
          color="bg-blue-600"
        />
        <StatCard
          title={t('metrics.resolved')}
          value={dashboardData?.metrics.resolvedIncidents}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <StatCard
          title={t('metrics.unresolved')}
          value={dashboardData?.metrics.unresolvedIncidents}
          icon={XCircle}
          color="bg-red-600"
        />
        <StatCard
          title={t('metrics.resolutionRate')}
          value={dashboardData?.metrics.resolutionRate ? `${dashboardData.metrics.resolutionRate}%` : null}
          icon={TrendingUp}
          color="bg-black"
        />
      </section>

      {/* Corrective Actions Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-500">{t('sections.correctiveActions')}</h2>
        {dashboardData?.correctiveActions && dashboardData.correctiveActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.correctiveActions.map((action) => (
              <ActionCard key={action.ID} action={action} />
            ))}
          </div>
        ) : (
          <div
            className="mt-8 flex justify-center items-center p-6 border-2 border-dotted border-blue-500 dark:border-blue-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
            style={{ minHeight: "200px" }}
          >
            <p className="text-xl sm:text-2xl font-bold text-center">{t('sections.noActions')}</p>
          </div>
        )}
      </section>

      {/* Recent Incidents Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-500">{t('sections.recentIncidents')}</h2>
        {dashboardData?.incidents && dashboardData.incidents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {dashboardData.incidents.map((incident) => (
              <IncidentCard key={incident.ID} incident={incident} />
            ))}
          </div>
        ) : (
          <div
            className="mt-8 flex justify-center items-center p-6 border-2 border-dotted border-red-500 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
            style={{ minHeight: "200px" }}
          >
            <p className="text-xl sm:text-2xl font-bold text-center">{t('sections.noIncidents')}</p>
          </div>
        )}
      </section>
    </div>
  )
}
