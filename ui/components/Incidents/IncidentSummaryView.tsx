// app/incidents/[id]/summary/IncidentSummaryView.tsx
'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { IncidentSummary } from '@/api/incident_summary';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/dashCard';
import { Timeline } from '@/components/ui/timeline';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

interface Props {
  summary: IncidentSummary;
}

export function IncidentSummaryView({ summary }: Props) {
  const [activeTab, setActiveTab] = useState('details');

  if (!summary.incident) {
    return <div>No incident data available.</div>;
  }

  const getSeverityColor = (level: string | undefined) => {
    if (!level) return 'bg-gray-500';
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-red-500';
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

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Incident Summary: {summary.incident.reference_number}
          </h1>
          <p className="text-gray-500">{summary.incident.title}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={`${getSeverityColor(summary.incident.severity_level)} text-white`}>
            {summary.incident.severity_level}
          </Badge>
          <Badge className={`${getStatusColor(summary.incident.status)} text-white`}>
            {summary.incident.status}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 gap-2 mb-8">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="investigation">Investigation</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Location:</dt>
                    <dd>{summary.incident.location}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Occurred At:</dt>
                    {/* <dd>{format(new Date(summary.incident.occurred_at), 'PPP')}</dd> */}
                    <dd>{summary.incident.occurred_at}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Reported By:</dt>
                    {/* <dd>{summary.incident.reported_by.full_name}</dd> */}
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-gray-500 mb-1">Actions Completion</dt>
                    <dd>
                      <Progress 
                        value={(summary.statistics.completed_actions_count / summary.statistics.total_actions_count) * 100} 
                        className="h-2"
                      />
                      <span className="text-sm text-gray-500 mt-1">
                        {summary.statistics.completed_actions_count} of {summary.statistics.total_actions_count} completed
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Days Open</dt>
                    <dd className="text-2xl font-bold">{summary.statistics.total_days_open}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* {summary.incident.attachments.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.incident.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium truncate">{attachment.file_name}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(attachment.created_at), 'PP')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // Handle download
                          toast.success('Download started');
                        }}
                        className="ml-4 text-blue-600 hover:text-blue-800"
                      >
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </Card>
        </TabsContent>

        <TabsContent value="investigation">
          <Card className="p-6">
            {summary.investigation ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Investigation Details</h3>
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-gray-500">Lead Investigator</dt>
                      {/* <dd className="mt-1">{summary.investigation.lead_investigator.full_name}</dd> */}
                    </div>
                    <div>
                      <dt className="text-gray-500">Root Cause</dt>
                      <dd className="mt-1">{summary.investigation.root_cause}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Findings</dt>
                      <dd className="mt-1">{summary.investigation.findings}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No investigation has been initiated yet.
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card className="p-6">
            <div className="space-y-6">
              {summary.corrective_actions.map((action) => (
                <div
                  key={action.id}
                  className="border-b pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">{action.description}</h4>
                    <Badge className={action.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}>
                      {action.status}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <dt className="text-gray-500">Assigned To</dt>
                      {/* <dd>{action.assigned_to.full_name}</dd> */}
                    </div>
                    <div>
                      <dt className="text-gray-500">Due Date</dt>
                      <dd>{format(new Date(action.due_date), 'PP')}</dd>
                    </div>
                    {action.completed_at && (
                      <div>
                        <dt className="text-gray-500">Completed At</dt>
                        <dd>{format(new Date(action.completed_at), 'PP')}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card className="p-6">
            <Timeline items={summary.timeline.map(event => ({
              date: format(new Date(event.date), 'PPp'),
              title: event.description,
              description: `By ${event.user_name}`,
              type: event.event_type
            }))} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}