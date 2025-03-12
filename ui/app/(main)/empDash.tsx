// app/dashboard/page.tsx
"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { PlusCircle, ClipboardList, UserCircle, AlertCircle, CheckCircle, XCircle, TrendingUp  } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/dashCard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import StatCard from '@/components/statCard';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { dashboardAPI } from '@/utils/adminApi';

interface Incident {
  ID: string;
  ReferenceNumber: string;
  Type: string;
  SeverityLevel: string;
  Status: string;
  Title: string;
}

interface CorrectiveAction {
  ID: string;
  Description: string;
  Priority: string;
  Status: string;
  DueDate: string;
}

interface Metrics {
  totalIncidents: number;
  resolvedIncidents: number;
  unresolvedIncidents: number;
  criticalIncidents: number;
  resolutionRate: number;
}

interface DashboardData {
  incidents: Incident[];
  metrics: Metrics;
  correctiveActions: CorrectiveAction[];
}
interface EmployeeDashProps {
  userID: string;
}
export default function EmployeeDashboard ({ userID } : EmployeeDashProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDashboardData = async () => {
          try {
            const data = await dashboardAPI.getEmployeeDashboard(userID);
            setDashboardData(data);
          } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            console.log(error)
            toast({
              title: "Error",
              description: "Failed to load dashboard data. Please try again.",
              variant: "error"
            });
          } finally {
            setIsLoading(false);
          }
        };
    
        fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const session = await getServerSession(authOptions);
        if (!session) {
          redirect('/auth/login');
        }
      const userId = session.user?.id;
      const response = await fetch(`http://localhost:8000/api/v1/dashboard/employee/${userId}`, {
        credentials: 'include' // This ensures cookies are sent with the request
      });
      console.log("dashboard",response);

      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      console.log("dashboard",data);
      setDashboardData(data);
      setIsLoading(false);
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "error"
      });
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        {/* Quick Actions Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <div 
              key={item}
              className="bg-gray-200 animate-pulse rounded-lg h-24 flex items-center justify-center"
            >
              <div className="w-8 h-8 rounded-full bg-gray-300 mb-2"></div>
              <div className="w-24 h-4 bg-gray-300 rounded mt-2"></div>
            </div>
          ))}
        </section>

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

        {/* Corrective Actions Skeleton */}
        <section className="space-y-4">
          <div className="w-48 h-8 bg-gray-300 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((item) => (
              <div 
                key={item}
                className="bg-gray-200 animate-pulse rounded-lg p-6 h-40"
              >
                <div className="w-full h-6 bg-gray-300 rounded mb-4"></div>
                <div className="space-y-3">
                  <div className="w-32 h-5 bg-gray-300 rounded"></div>
                  <div className="w-40 h-5 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Recent Incidents Skeleton */}
        <section className="space-y-4">
          <div className="w-40 h-8 bg-gray-300 rounded animate-pulse"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((item) => (
              <div 
                key={item}
                className="bg-gray-200 animate-pulse rounded-lg p-6 h-48"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="w-40 h-6 bg-gray-300 rounded"></div>
                  <div className="w-20 h-6 bg-gray-300 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="w-36 h-5 bg-gray-300 rounded"></div>
                  <div className="w-24 h-5 bg-gray-300 rounded"></div>
                  <div className="w-32 h-5 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Quick Actions Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 h-auto flex flex-col items-center gap-2"
          onClick={() => window.location.href = '/incidents'}
        >
          <PlusCircle size={24} />
          <span>Create Incident</span>
        </Button>
        
        <Button 
          className="bg-gray-600 hover:bg-gray-700 text-white p-6 h-auto flex flex-col items-center gap-2"
          onClick={() => window.location.href = '/actions'}
        >
          <ClipboardList size={24} />
          <span>View Assigned Tasks</span>
        </Button>
        
        <Button 
          className="bg-black hover:bg-gray-900 text-white p-6 h-auto flex flex-col items-center gap-2"
          onClick={() => window.location.href = '/profile'}
        >
          <UserCircle size={24} />
          <span>View/Update Profile</span>
        </Button>
      </section>

      {/* Metrics Cards */}
      <section className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Incidents"
          value={dashboardData?.metrics.totalIncidents}
          icon={ClipboardList}
          color="bg-blue-600"
        />
        <StatCard
          title="Resolved"
          value={dashboardData?.metrics.resolvedIncidents}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <StatCard
          title="Unresolved"
          value={dashboardData?.metrics.unresolvedIncidents}
          icon={XCircle}
          color="bg-red-600"
        />
        <StatCard
          title="Resolution Rate"
          value={dashboardData?.metrics.resolutionRate ? `${dashboardData.metrics.resolutionRate}%` : null}
          icon={TrendingUp}
          color="bg-purple-600"
        />
      </section>

      {/* Corrective Actions Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Assigned Corrective Actions</h2>
        {dashboardData?.correctiveActions && dashboardData.correctiveActions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dashboardData.correctiveActions.map((action) => (
              <Card key={action.ID} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className={`
                      ${action.Priority === 'high' ? 'text-red-500' : 
                        action.Priority === 'medium' ? 'text-yellow-500' : 
                        'text-blue-500'}
                    `} />
                    {action.Description}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-sm
                        ${action.Status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          action.Status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'}
                      `}>
                        {action.Status}
                      </span>
                    </p>
                    <p><strong>Due Date:</strong> {new Date(action.DueDate).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
            <div
              className="mt-8 flex justify-center items-center p-6 border-2 border-dotted border-blue-500 rounded-lg bg-red-100 text-blue-700"
              style={{ height: "200px" }}
            >
              <p className="text-2xl font-bold text-center">No Corrective Actions Are Currently Assigned</p>
            </div>
          )}
      </section>

      {/* Recent Incidents Section */}
    <section className="space-y-4">
      <h2 className="text-2xl font-bold">Recent Incidents</h2>
      {dashboardData?.incidents && dashboardData.incidents.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {dashboardData.incidents.map((incident) => (
            <Card key={incident.ID} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{incident.Title}</span>
                  <span className={`px-3 py-1 rounded-full text-sm
                    ${incident.SeverityLevel === 'high' ? 'bg-red-100 text-red-800' :
                      incident.SeverityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'}
                  `}>
                    {incident.SeverityLevel}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Reference:</strong> {incident.ReferenceNumber}</p>
                  <p><strong>Type:</strong> {incident.Type}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-sm
                      ${incident.Status === 'new' ? 'bg-blue-100 text-blue-800' :
                        incident.Status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        incident.Status === 'resolved' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'}
                    `}>
                      {incident.Status}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div
          className="mt-8 flex justify-center items-center p-6 border-2 border-dotted border-blue-500 rounded-lg bg-red-100 text-blue-700"
          style={{ height: "200px" }}
        >
          <p className="text-2xl font-bold text-center">No Recent Incidents Found</p>
        </div>
      )}
    </section>
    </div>
  );
};

// export default EmployeeDashboard;