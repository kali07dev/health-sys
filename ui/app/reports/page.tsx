// app/reports/page.tsx
import ReportForm from './reportForm';

const reportTypes = [
  { id: 'safety_performance', name: 'Safety Performance', description: 'Overview of safety metrics and KPIs' },
  { id: 'incident_trends', name: 'Incident Trends', description: 'Analysis of incident patterns over time' },
  { id: 'location_analysis', name: 'Location Analysis', description: 'Safety metrics by location' },
  { id: 'compliance_report', name: 'Compliance Report', description: 'Regulatory compliance status' },
] as const;

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-medium text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-500 mb-8">Generate detailed safety reports with just a few clicks</p>
        <ReportForm reportTypes={reportTypes} />
      </div>
    </div>
  );
}