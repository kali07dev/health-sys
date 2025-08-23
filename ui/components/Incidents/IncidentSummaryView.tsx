// app/incidents/[id]/summary/IncidentSummaryView.tsx
'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { IncidentSummary } from '@/api/incident_summary';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/dashCard';
import { Timeline } from '@/components/ui/timeline';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  summary: IncidentSummary;
}

export function IncidentSummaryView({ summary }: Props) {
  const [activeTab, setActiveTab] = useState('details');

  if (!summary.incident) {
    return (
      <div className="flex items-center justify-center h-60 bg-red-50 rounded-lg shadow">
        <p className="text-red-600 font-medium text-lg">No incident data available.</p>
      </div>
    );
  }

  const getSeverityColor = (level: string | undefined) => {
    if (!level) return 'bg-gray-500';
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return 'bg-gray-500';
    switch (status.toLowerCase()) {
      case 'closed': return 'bg-green-500';
      case 'investigating': return 'bg-blue-500';
      case 'action_required': return 'bg-orange-500';
      case 'new': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Safely format date strings
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(parseISO(dateString), 'PPP');
    } catch {
      console.error('Invalid date format:', dateString);
      return dateString || 'N/A';
    }
  };

  // Safe calculation for progress
  const calculateProgress = () => {
    const completed = summary.statistics?.completed_actions_count || 0;
    const total = summary.statistics?.total_actions_count || 1; // Prevent division by zero
    return total > 0 ? (completed / total) * 100 : 0;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Section with gradient background */}
      <div className="bg-gradient-to-r from-red-500 to-red-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Incident Summary: {summary.incident.ReferenceNumber}
            </h1>
            <p className="text-red-100 mt-1">{summary.incident.Title}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getSeverityColor(summary.incident.SeverityLevel)} text-white px-4 py-1 text-sm font-medium rounded-full shadow`}>
              {summary.incident.SeverityLevel || 'Unknown Severity'}
            </Badge>
            <Badge className={`${getStatusColor(summary.incident.Status)} text-white px-4 py-1 text-sm font-medium rounded-full shadow`}>
              {summary.incident.Status || 'Unknown Status'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 bg-red-50 p-1 rounded-lg">
          <TabsTrigger 
            value="details" 
            className="text-black data-[state=active]:bg-red-500 data-[state=active]:text-black rounded-md"
          >
            Details
          </TabsTrigger>
          <TabsTrigger 
            value="investigation" 
            className="text-black data-[state=active]:bg-red-500 data-[state=active]:text-black rounded-md"
          >
            Investigation
          </TabsTrigger>
          <TabsTrigger 
            value="actions" 
            className="text-black data-[state=active]:bg-red-500 data-[state=active]:text-black rounded-md"
          >
            Actions
          </TabsTrigger>
          <TabsTrigger 
            value="timeline" 
            className="text-black data-[state=active]:bg-red-500 data-[state=active]:text-black rounded-md"
          >
            Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="p-6 bg-white shadow-lg rounded-lg border-l-4 border-red-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-red-700">Basic Information</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                    <dt className="text-gray-600 font-medium">Location:</dt>
                    <dd className="text-gray-900">{summary.incident.Location || 'N/A'}</dd>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                    <dt className="text-gray-600 font-medium">Occurred At:</dt>
                    <dd className="text-gray-900">{formatDate(summary.incident.OccurredAt)}</dd>
                  </div>
                  <div className="flex justify-between items-center bg-white p-3 rounded-md shadow-sm">
                    <dt className="text-gray-600 font-medium">Reported By:</dt>
                    <dd className="text-gray-900">{summary.incident.Reporter?.FirstName} {summary.incident.Reporter?.LastName}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-red-700">Statistics</h3>
                <dl className="space-y-4">
                  <div className="bg-white p-3 rounded-md shadow-sm">
                    <dt className="text-gray-600 font-medium mb-2">Actions Completion</dt>
                    <dd>
                      <div className="relative pt-1">
                        <Progress 
                          value={calculateProgress()} 
                          className="h-3 rounded-full bg-red-100"
                        />
                        <span className="text-sm text-gray-600 mt-2 block">
                          {summary.statistics?.completed_actions_count || 0} of {summary.statistics?.total_actions_count || 0} completed
                        </span>
                      </div>
                    </dd>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm flex justify-between items-center">
                    <dt className="text-gray-600 font-medium">Days Open</dt>
                    <dd className="text-2xl font-bold text-red-600">{summary.statistics?.total_days_open || 0}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="investigation">
          <Card className="p-6 bg-white shadow-lg rounded-lg border-l-4 border-red-500">
            {summary.investigation ? (
              <div className="space-y-6 text-black">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-red-700">Investigation Details</h3>
                  <dl className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <dt className="text-gray-700 font-medium mb-2">Lead Investigator</dt>
                      <dd className="bg-white p-3 rounded-md shadow-sm">
                        {summary.investigation.LeadInvestigator?.FullName || 'N/A'}
                      </dd>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <dt className="text-gray-700 font-medium mb-2">Root Cause</dt>
                      <dd className="bg-white p-3 rounded-md shadow-sm">
                        {summary.investigation.RootCause || 'Not determined'}
                      </dd>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <dt className="text-gray-700 font-medium mb-2">Findings</dt>
                      <dd className="bg-white p-3 rounded-md shadow-sm">
                        {summary.investigation.Findings || 'No findings recorded'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-red-50 rounded-lg">
                <svg className="w-16 h-16 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
                <p className="text-lg text-gray-600">No investigation has been initiated yet.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card className="p-6 bg-white shadow-lg rounded-lg border-l-4 border-red-500">
            {summary.corrective_actions && summary.corrective_actions.length > 0 ? (
              <div className="space-y-6">
                {summary.corrective_actions.map((action, index) => (
                  <div
                    key={action.ID || index}
                    className="bg-red-50 p-4 rounded-lg border-l-4 border-l-red-300 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                      <h4 className="font-medium text-gray-900">{action.Description}</h4>
                      <Badge className={action.Status === 'completed' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}>
                        {action.Status}
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-md">
                        <dt className="text-gray-600 text-sm">Assigned To</dt>
                        <dd className="font-medium mt-1">{action.AssignedTo?.FullName || 'Unassigned'}</dd>
                      </div>
                      <div className="bg-white p-3 rounded-md">
                        <dt className="text-gray-600 text-sm">Due Date</dt>
                        <dd className="font-medium mt-1">{action.DueDate ? formatDate(action.DueDate) : 'No due date'}</dd>
                      </div>
                      {action.CompletedAt && (
                        <div className="bg-white p-3 rounded-md md:col-span-2">
                          <dt className="text-gray-600 text-sm">Completed At</dt>
                          <dd className="font-medium mt-1 text-green-600">{formatDate(action.CompletedAt)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-red-50 rounded-lg">
                <svg className="w-16 h-16 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                </svg>
                <p className="text-lg text-gray-600">No corrective actions have been added yet.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-6 bg-white shadow-lg rounded-lg border-l-4 border-red-500">
            {summary.timeline && summary.timeline.length > 0 ? (
              <Timeline items={summary.timeline.map(event => ({
                date: formatDate(event.date),
                title: event.description,
                description: `By ${event.user_name || 'Unknown User'}`,
                type: event.event_type,
                color: 'red' // Using the system color theme
              }))} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-red-50 rounded-lg">
                <svg className="w-16 h-16 text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-lg text-gray-600">No timeline events available.</p>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}