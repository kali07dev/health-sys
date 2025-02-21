'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  AlertCircle, 
  RepeatIcon, 
  Calendar, 
  Shield, 
  Building, 
  Activity,
  ArrowUpCircle,
  ArrowDownCircle
} from 'lucide-react';
import AdminDashboard from '@/components/testMe';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/dashCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { IncidentTrends } from '@/interfaces/dashboard';
import { adminService } from '@/utils/adminApi';

const IncidentTrendsDashboard = () => {
  const [data, setData] = useState<IncidentTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await adminService.getIncidentTrends();
        setData(result);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color, change }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
            {change && (
              <div className={`flex items-center mt-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? <ArrowUpCircle className="w-4 h-4 mr-1" /> : <ArrowDownCircle className="w-4 h-4 mr-1" />}
                <span className="text-sm">{Math.abs(change)}% from last month</span>
              </div>
            )}
          </div>
          <div className={`rounded-full p-3 ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const HazardTable = ({ hazards }) => (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
          Common Hazards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hazards.map((hazard, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hazard.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{hazard.frequency}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        hazard.riskScore > 3 ? 'bg-red-500' : 
                        hazard.riskScore > 2 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      {hazard.riskScore.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {hazard.trendChange > 0 ? (
                      <span className="text-red-600 flex items-center">
                        <ArrowUpCircle className="w-4 h-4 mr-1" />
                        {hazard.trendChange}%
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center">
                        <ArrowDownCircle className="w-4 h-4 mr-1" />
                        {Math.abs(hazard.trendChange)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <><AdminDashboard /><div className="min-h-screen bg-gray-50 p-6">
          <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Incident Trends Report</h1>
              <p className="mt-2 text-gray-600">
                  Comprehensive analysis of safety incidents and patterns
              </p>
          </div>

          {/* Statistics Grid */}
          <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                  title="Total Incidents"
                  value={data?.totalIncidents || 0}
                  icon={AlertCircle}
                  color="bg-red-600"
                  change={-12.5} />
              <StatCard
                  title="Active Hazards"
                  value={data?.activeHazards || 0}
                  icon={AlertTriangle}
                  color="bg-amber-600"
                  change={8.3} />
              <StatCard
                  title="Resolution Rate"
                  value={`${data?.resolutionRate || 0}%`}
                  icon={Activity}
                  color="bg-green-600"
                  change={5.2} />
              <StatCard
                  title="Risk Score"
                  value={data?.riskScore?.toFixed(2) || 0}
                  icon={Shield}
                  color="bg-blue-600"
                  change={-3.7} />
          </div>

          {/* Trends Chart */}
          <Card className="mb-8">
              <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center">
                      <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
                      Incident Trends Over Time
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data?.trendsByMonth || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                  dataKey="month"
                                  tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short' })} />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="incidentCount" stroke="#2563eb" name="Incidents" />
                              <Line type="monotone" dataKey="severityScore" stroke="#dc2626" name="Severity" />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              </CardContent>
          </Card>

          {/* Hazards Table */}
          <HazardTable hazards={data?.commonHazards || []} />

          {/* Risk Patterns Grid */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
              <Card>
                  <CardHeader>
                      <CardTitle className="text-xl font-semibold flex items-center">
                          <Building className="mr-2 h-5 w-5 text-purple-500" />
                          Department Impact
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      {data?.riskPatterns?.map((pattern, index) => (
                          <div key={index} className="mb-4 last:mb-0">
                              <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">{pattern.category}</span>
                                  <span className="text-sm text-gray-500">{pattern.frequency} incidents</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                  {pattern.departments.map((dept, i) => (
                                      <span key={i} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                          {dept}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader>
                      <CardTitle className="text-xl font-semibold flex items-center">
                          <RepeatIcon className="mr-2 h-5 w-5 text-orange-500" />
                          Recurring Issues
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      {data?.recurringIssues?.map((issue, index) => (
                          <div key={index} className="mb-4 last:mb-0 p-4 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                  <div>
                                      <h4 className="font-medium">{issue.description}</h4>
                                      <p className="text-sm text-gray-500">Last occurred: {new Date(issue.lastOccurred).toLocaleDateString()}</p>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-sm ${issue.priority === 'high' ? 'bg-red-100 text-red-800' :
                                          issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-green-100 text-green-800'}`}>
                                      {issue.priority}
                                  </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                  {issue.locations.map((location, i) => (
                                      <span key={i} className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                                          {location}
                                      </span>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </CardContent>
              </Card>
          </div>
      </div></>
  );
};

export default IncidentTrendsDashboard;