// app/dashboard/page.tsx
"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { PlusCircle, ClipboardList, UserCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/dashCard';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';

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

const EmployeeDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const empID = "current-employee-id"; // Replace with actual employee ID
      const response = await fetch(`http://127.0.0.1:8000/api/v1/dashboard/employee/${empID}`, {
        credentials: 'include' // This ensures cookies are sent with the request
      });
      
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setDashboardData(data);
      setIsLoading(false);
    } catch (error) {
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Progress value={null} className="w-64" />
        <p className="mt-4 text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Quick Actions Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button 
          className="bg-blue-600 hover:bg-blue-700 text-white p-6 h-auto flex flex-col items-center gap-2"
          onClick={() => window.location.href = '/incidents/create'}
        >
          <PlusCircle size={24} />
          <span>Create Incident</span>
        </Button>
        
        <Button 
          className="bg-gray-600 hover:bg-gray-700 text-white p-6 h-auto flex flex-col items-center gap-2"
          onClick={() => window.location.href = '/tasks'}
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
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboardData?.metrics.totalIncidents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{dashboardData?.metrics.resolvedIncidents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unresolved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{dashboardData?.metrics.unresolvedIncidents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboardData?.metrics.resolutionRate}%</p>
          </CardContent>
        </Card>
      </section>

      {/* Corrective Actions Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Assigned Corrective Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardData?.correctiveActions.map((action) => (
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
      </section>

      {/* Recent Incidents Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Recent Incidents</h2>
        <div className="grid grid-cols-1 gap-4">
          {dashboardData?.incidents.map((incident) => (
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
      </section>
    </div>
  );
};

export default EmployeeDashboard;