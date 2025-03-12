'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { 
  AdminDashboardResponse, 
  DashboardFilters, 
  TimeSeriesPoint, 
  Incident
} from '@/interfaces/dashboard';
import { dashboardAPI } from '@/utils/adminApi';

export default function SafetyDashboard() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DashboardFilters>({
    timeRange: 'month'
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await dashboardAPI.getAdminDashboard(filters);
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Convert record objects to arrays for charts
  const getIncidentTypeData = () => {
    if (!dashboardData?.systemMetrics.incidentsByType) return [];
    return Object.entries(dashboardData.systemMetrics.incidentsByType).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getSeverityData = () => {
    if (!dashboardData?.systemMetrics.incidentsBySeverity) return [];
    return Object.entries(dashboardData.systemMetrics.incidentsBySeverity).map(([name, value]) => ({
      name,
      value
    }));
  };

  const formatTimeSeriesData = (data: TimeSeriesPoint[] | null) => {
    if (!data) return [];
    return data.map(point => ({
      ...point,
      timestamp: new Date(point.timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  };

  const QuickAction = ({ title, description, icon: Icon, href, color }: {
    title: string;
    description: string;
    icon: any;
    href: string;
    color: string;
  }) => (
    <Link 
      href={href}
      className="flex transform items-center rounded-lg bg-white p-6 shadow-md transition-all hover:scale-105 hover:shadow-lg"
    >
      <div className={`mr-4 rounded-full p-3 ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );

  const StatCard = ({ title, value, description, icon: Icon, color }: {
    title: string;
    value: number | string;
    description?: string;
    icon: any;
    color: string;
  }) => (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
          {description && (
            <p className="mt-2 text-sm text-gray-500">{description}</p>
          )}
        </div>
        <div className={`rounded-full p-3 ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const IncidentCard = ({ incident }: { incident: Incident }) => (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{incident.Title}</h3>
          <p className="text-sm text-gray-500">{incident.ReferenceNumber}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
          incident.SeverityLevel === 'Critical' ? 'bg-red-100 text-red-800' :
          incident.SeverityLevel === 'High' ? 'bg-orange-100 text-orange-800' :
          incident.SeverityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }`}>
          {incident.SeverityLevel}
        </span>
      </div>
      <p className="mt-2 text-sm text-gray-600 line-clamp-2">{incident.Description}</p>
      <div className="mt-3 flex justify-between text-xs text-gray-500">
        <span>Location: {incident.Location}</span>
        <span>Reported: {new Date(incident.CreatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {/* Metrics Cards Skeleton */}
        <section className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div 
              key={item}
              className="bg-gray-200 animate-pulse rounded-lg p-6 h-32"
            >
              <div className="flex justify-between items-start">
                <div className="w-24 h-5 bg-gray-300 rounded"></div>
                <div className="w-8 h-8 rounded-full bg-gray-300"></div>
              </div>
              <div className="w-16 h-8 bg-gray-300 rounded mt-4"></div>
            </div>
          ))}
        </section>

        {/* Charts Skeleton */}
        <section className="space-y-6">
          <div className="bg-gray-200 animate-pulse rounded-lg p-6 h-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-200 animate-pulse rounded-lg p-6 h-64"></div>
            <div className="bg-gray-200 animate-pulse rounded-lg p-6 h-64"></div>
          </div>
        </section>
        
        {/* Recent Incidents Skeleton */}
        <section className="space-y-4">
          <div className="w-40 h-8 bg-gray-300 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((item) => (
              <div 
                key={item}
                className="bg-gray-200 animate-pulse rounded-lg p-6 h-32"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="w-40 h-6 bg-gray-300 rounded"></div>
                  <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                  <div className="w-full h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Safety Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {session?.user?.email}
        </p>
      </div>

      {/* Quick Actions Grid */}
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Quick Actions</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickAction
          title="User Management"
          description="Manage user roles and permissions"
          icon={UserCog}
          href="/admin/user-management"
          color="bg-blue-600"
        />
        <QuickAction
          title="Department Settings"
          description="Configure department structures"
          icon={Building2}
          href="/admin/departments"
          color="bg-purple-600"
        />
        <QuickAction
          title="General Settings"
          description="Configure system settings"
          icon={Settings}
          href="/admin"
          color="bg-gray-600"
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div>
          <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
          <select
            id="timeRange"
            name="timeRange"
            value={filters.timeRange}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            id="department"
            name="department"
            value={filters.department || ''}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {dashboardData?.departmentMetrics.map(dept => (
              <option key={dept.departmentName} value={dept.departmentName}>
                {dept.departmentName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="incidentType" className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
          <select
            id="incidentType"
            name="incidentType"
            value={filters.incidentType || ''}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {dashboardData?.systemMetrics.incidentsByType && 
              Object.keys(dashboardData.systemMetrics.incidentsByType).map(type => (
                <option key={type} value={type}>{type}</option>
              ))
            }
          </select>
        </div>
        <div>
          <label htmlFor="severityLevel" className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
          <select
            id="severityLevel"
            name="severityLevel"
            value={filters.severityLevel || ''}
            onChange={handleFilterChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            {dashboardData?.systemMetrics.incidentsBySeverity && 
              Object.keys(dashboardData.systemMetrics.incidentsBySeverity).map(severity => (
                <option key={severity} value={severity}>{severity}</option>
              ))
            }
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData && (
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Incidents"
            value={dashboardData.systemMetrics.totalIncidents}
            icon={AlertCircle}
            color="bg-red-600"
          />
          <StatCard
            title="Resolution Rate"
            value={`${dashboardData.systemMetrics.resolutionRate.toFixed(1)}%`}
            description={`${dashboardData.systemMetrics.resolvedIncidents} of ${dashboardData.systemMetrics.totalIncidents} resolved`}
            icon={ClipboardCheck}
            color="bg-green-600"
          />
          <StatCard
            title="Critical Incidents"
            value={dashboardData.systemMetrics.criticalIncidents}
            icon={AlertTriangle}
            color="bg-amber-600"
          />
          <StatCard
            title="Avg. Resolution Time"
            value={`${dashboardData.systemMetrics.averageResolutionTime.toFixed(1)}h`}
            icon={Clock}
            color="bg-blue-600"
          />
        </div>
      )}

      {/* Trends Chart */}
      {dashboardData && (
        <div className="mb-8">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center mb-4">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Incident Trends</h2>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={formatTimeSeriesData(dashboardData.trendAnalysis.incidentTrend)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  name="Incidents" 
                  stroke="#dc2626" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      )}

      {/* Distribution Charts */}
      {dashboardData && (
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center mb-4">
              <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
              <h2 className="text-xl font-semibold">Incidents by Type</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getIncidentTypeData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="mr-2 h-5 w-5 text-yellow-500" />
              <h2 className="text-xl font-semibold">Incidents by Severity</h2>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getSeverityData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Department Metrics */}
      {dashboardData && dashboardData.departmentMetrics.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-md mb-8">
          <div className="flex items-center mb-4">
            <Building2 className="mr-2 h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Department Safety Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incidents</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Critical</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.departmentMetrics.map((dept, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.departmentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.incidentCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.resolvedCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.criticalIncidents}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          dept.resolutionRate >= 75 ? 'bg-green-500' : 
                          dept.resolutionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        {dept.resolutionRate.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Hazards */}
      {dashboardData && dashboardData.topHazards && dashboardData.topHazards.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow-md mb-8">
          <div className="flex items-center mb-4">
            <ShieldCheck className="mr-2 h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Top Hazards</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Severity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Reported</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Affected Departments</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData.topHazards.map((hazard, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hazard.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hazard.frequency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          hazard.averageSeverity > 3 ? 'bg-red-500' : 
                          hazard.averageSeverity > 2 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        {hazard.averageSeverity.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(hazard.lastReportedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex flex-wrap gap-1">
                        {hazard.affectedDepartments.map((dept, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Incidents */}
      {dashboardData && dashboardData.recentIncidents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Incidents</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dashboardData.recentIncidents.map(incident => (
              <IncidentCard key={incident.ID} incident={incident} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}