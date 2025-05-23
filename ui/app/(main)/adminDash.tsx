"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  ShieldCheck,
  Building2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  ClipboardCheck,
  Clock,
  UserCog,
  Settings,
  type LucideIcon,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts"
import type { AdminDashboardResponse, DashboardFilters, TimeSeriesPoint, Incident } from "@/interfaces/dashboard"
import { dashboardAPI } from "@/utils/adminApi"
import { useTranslations } from 'next-intl'

export default function SafetyDashboard() {
  const { data: session } = useSession()
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<DashboardFilters>({
    timeRange: "month",
  })
  const t = useTranslations('dashboard')

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardAPI.getAdminDashboard(filters)
        setDashboardData(data)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Convert record objects to arrays for charts
  const getIncidentTypeData = () => {
    if (!dashboardData?.systemMetrics.incidentsByType) return []
    return Object.entries(dashboardData.systemMetrics.incidentsByType).map(([name, value]) => ({
      name,
      value,
    }))
  }

  const getSeverityData = () => {
    if (!dashboardData?.systemMetrics.incidentsBySeverity) return []
    return Object.entries(dashboardData.systemMetrics.incidentsBySeverity).map(([name, value]) => ({
      name,
      value,
    }))
  }

  const formatTimeSeriesData = (data: TimeSeriesPoint[] | null | undefined) => {
    if (!data) return []
    return data.map((point) => ({
      ...point,
      timestamp: new Date(point.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }))
  }

  const QuickAction = ({
    title,
    description,
    icon: Icon,
    href,
    color,
  }: {
    title: string
    description: string
    icon: LucideIcon
    href: string
    color: string
  }) => (
    <Link
      href={href}
      className="flex transform items-center rounded-lg bg-white p-4 sm:p-6 shadow-md transition-all hover:scale-105 hover:shadow-lg"
    >
      <div className={`mr-3 sm:mr-4 rounded-full p-2 sm:p-3 ${color}`}>
        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
      <div>
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  )

  const StatCard = ({
    title,
    value,
    description,
    icon: Icon,
    color,
  }: {
    title: string
    value: number | string
    description?: string
    icon: LucideIcon
    color: string
  }) => (
    <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-1 sm:mt-2 text-xl sm:text-3xl font-semibold text-gray-900">{value}</p>
          {description && <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">{description}</p>}
        </div>
        <div className={`rounded-full p-2 sm:p-3 ${color}`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
      </div>
    </div>
  )

  const IncidentCard = ({ incident }: { incident: Incident }) => {
    const severityColor = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800"
    }[incident.SeverityLevel] || "bg-gray-100 text-gray-800"

    return (
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md border-l-4 border-red-500">
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-2">
            <h3 className="font-medium text-black text-sm sm:text-base">{incident.Title}</h3>
            <p className="text-xs text-gray-500">{incident.ReferenceNumber}</p>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${severityColor}`}>
            {incident.SeverityLevel}
          </span>
        </div>
        <p className="mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2">{incident.Description}</p>
        <div className="mt-3 flex flex-col sm:flex-row sm:justify-between text-xs text-gray-500">
          <span className="mb-1 sm:mb-0">{t('incidentCard.location', { location: incident.Location })}</span>
          <span>{t('incidentCard.reported', { date: new Date(incident.CreatedAt).toLocaleDateString() })}</span>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Metrics Cards Skeleton */}
        <section className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-gray-200 animate-pulse rounded-lg p-4 sm:p-6 h-24 sm:h-32">
              <div className="flex justify-between items-start">
                <div className="w-20 sm:w-24 h-4 sm:h-5 bg-gray-300 rounded"></div>
                <div className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-gray-300"></div>
              </div>
              <div className="w-12 sm:w-16 h-6 sm:h-8 bg-gray-300 rounded mt-3 sm:mt-4"></div>
            </div>
          ))}
        </section>

        {/* Charts Skeleton */}
        <section className="space-y-4 sm:space-y-6">
          <div className="bg-gray-200 animate-pulse rounded-lg p-4 sm:p-6 h-48 sm:h-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-gray-200 animate-pulse rounded-lg p-4 sm:p-6 h-48 sm:h-64"></div>
            <div className="bg-gray-200 animate-pulse rounded-lg p-4 sm:p-6 h-48 sm:h-64"></div>
          </div>
        </section>

        {/* Recent Incidents Skeleton */}
        <section className="space-y-3 sm:space-y-4">
          <div className="w-32 sm:w-40 h-6 sm:h-8 bg-gray-300 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-gray-200 animate-pulse rounded-lg p-4 sm:p-6 h-28 sm:h-32">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                  <div className="w-32 sm:w-40 h-5 sm:h-6 bg-gray-300 rounded"></div>
                  <div className="w-16 sm:w-20 h-5 sm:h-6 bg-gray-300 rounded-full"></div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="w-full h-3 sm:h-4 bg-gray-300 rounded"></div>
                  <div className="w-full h-3 sm:h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-red-600">{t('title')}</h1>
        <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
          {t('welcome', { email: session?.user?.email ?? "" })}
        </p>
      </div>

      {/* Quick Actions Grid */}
      <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-gray-900">{t('quickActions')}</h2>
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          title={t('userManagement')}
          description={t('userManagementDesc')}
          icon={UserCog}
          href="/admin/user-management"
          color="bg-red-600"
        />
        <QuickAction
          title={t('departmentSettings')}
          description={t('departmentSettingsDesc')}
          icon={Building2}
          href="/admin/departments"
          color="bg-blue-600"
        />
        <QuickAction
          title={t('generalSettings')}
          description={t('generalSettingsDesc')}
          icon={Settings}
          href="/admin"
          color="bg-black"
        />
      </div>

      {/* Filters */}
      <div className="my-6 flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="w-full sm:w-auto">
          <label htmlFor="timeRange" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {t('filters.timeRange')}
          </label>
          <select
            id="timeRange"
            name="timeRange"
            value={filters.timeRange}
            onChange={handleFilterChange}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {Object.entries(t.raw('filters.timeOptions')).map(([value, label]) => (
              <option key={value} value={value}>{String(label)}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="department" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {t('filters.department')}
          </label>
          <select
            id="department"
            name="department"
            value={filters.department || ""}
            onChange={handleFilterChange}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">{t('filters.allDepartments')}</option>
            {dashboardData?.departmentMetrics?.map((dept) => (
              <option key={dept.departmentName} value={dept.departmentName}>
                {dept.departmentName}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="incidentType" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {t('filters.incidentType')}
          </label>
          <select
            id="incidentType"
            name="incidentType"
            value={filters.incidentType || ""}
            onChange={handleFilterChange}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">{t('filters.allTypes')}</option>
            {dashboardData?.systemMetrics.incidentsByType &&
              Object.keys(dashboardData.systemMetrics.incidentsByType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="severityLevel" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            {t('filters.severity')}
          </label>
          <select
            id="severityLevel"
            name="severityLevel"
            value={filters.severityLevel || ""}
            onChange={handleFilterChange}
            className="w-full sm:w-auto border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">{t('filters.allSeverities')}</option>
            {dashboardData?.systemMetrics.incidentsBySeverity &&
              Object.keys(dashboardData.systemMetrics.incidentsBySeverity).map((severity) => (
                <option key={severity} value={severity}>
                  {severity}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData && (
        <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={t('metrics.totalIncidents')}
            value={dashboardData.systemMetrics.totalIncidents}
            icon={AlertCircle}
            color="bg-red-600"
          />
          <StatCard
            title={t('metrics.resolutionRate')}
            value={`${dashboardData.systemMetrics.resolutionRate.toFixed(1)}%`}
            description={t('metrics.resolvedOfTotal', {
              resolved: dashboardData.systemMetrics.resolvedIncidents,
              total: dashboardData.systemMetrics.totalIncidents
            })}
            icon={ClipboardCheck}
            color="bg-green-600"
          />
          <StatCard
            title={t('metrics.criticalIncidents')}
            value={dashboardData.systemMetrics.criticalIncidents}
            icon={AlertTriangle}
            color="bg-black"
          />
          <StatCard
            title={t('metrics.avgResolutionTime')}
            value={`${dashboardData.systemMetrics.averageResolutionTime.toFixed(1)}h`}
            icon={Clock}
            color="bg-blue-600"
          />
        </div>
      )}

      {/* Trends Chart */}
      {dashboardData && (
        <div className="mb-6 sm:mb-8">
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
            <div className="flex items-center mb-3 sm:mb-4">
              <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <h2 className="text-lg text-black sm:text-xl font-semibold">{t('charts.incidentTrends')}</h2>
            </div>
            <div className="h-64 sm:h-80 lg:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={formatTimeSeriesData(dashboardData.trendAnalysis.incidentTrend)}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} width={30} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                  <Line type="monotone" dataKey="value" name={t('charts.count')} stroke="#dc2626" activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Charts */}
      {dashboardData && (
        <div className="mb-6 sm:mb-8 grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
            <div className="flex items-center mb-3 sm:mb-4">
              <AlertCircle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
              <h2 className="text-lg text-black sm:text-xl font-semibold">{t('charts.incidentsByType')}</h2>
            </div>
            <div className="h-48 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getIncidentTypeData()}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name={t('charts.count')} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
            <div className="flex items-center mb-3 sm:mb-4">
              <AlertTriangle className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-black" />
              <h2 className="text-lg text-black sm:text-xl font-semibold">{t('charts.incidentsBySeverity')}</h2>
            </div>
            <div className="h-48 sm:h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getSeverityData()} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={70} />
                  <Tooltip />
                  <Bar dataKey="value" name={t('charts.count')} fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Department Metrics */}
      {dashboardData && dashboardData.departmentMetrics && dashboardData.departmentMetrics.length > 0 && (
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <h2 className="text-lg text-black sm:text-xl font-semibold">{t('departmentPerformance')}</h2>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('departmentTableHeaders.department')}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('departmentTableHeaders.incidents')}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('departmentTableHeaders.resolved')}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('departmentTableHeaders.critical')}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('departmentTableHeaders.rate')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.departmentMetrics.map((dept, index) => (
                    <tr key={index} className="hover:bg-blue-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {dept.departmentName}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {dept.incidentCount}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {dept.resolvedCount}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {dept.criticalIncidents}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${
                              dept.resolutionRate >= 75
                                ? "bg-green-500"
                                : dept.resolutionRate >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                          ></div>
                          {dept.resolutionRate.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Top Hazards */}
      {dashboardData && dashboardData.topHazards && dashboardData.topHazards.length > 0 && (
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <ShieldCheck className="mr-2 h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            <h2 className="text-lg text-black sm:text-xl font-semibold">{t('topHazards')}</h2>
          </div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-red-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('hazardsTableHeaders.type')}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('hazardsTableHeaders.frequency')}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('hazardsTableHeaders.severity')}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('hazardsTableHeaders.lastReported')}
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('hazardsTableHeaders.departments')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.topHazards.map((hazard, index) => (
                    <tr key={index} className="hover:bg-blue-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                        {hazard.type}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {hazard.frequency}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center">
                          <div
                            className={`w-2 h-2 rounded-full mr-1 sm:mr-2 ${
                              hazard.averageSeverity > 3
                                ? "bg-red-500"
                                : hazard.averageSeverity > 2
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                          ></div>
                          {hazard.averageSeverity.toFixed(1)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {new Date(hazard.lastReportedAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {hazard.affectedDepartments.slice(0, 2).map((dept, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 rounded-full text-xs">
                              {dept}
                            </span>
                          ))}
                          {hazard.affectedDepartments.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-xs">
                              +{hazard.affectedDepartments.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      {dashboardData && dashboardData.recentIncidents.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-red-600 mb-3 sm:mb-4">{t('recentIncidents')}</h2>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {dashboardData.recentIncidents.map((incident) => (
              <IncidentCard key={incident.ID} incident={incident} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}