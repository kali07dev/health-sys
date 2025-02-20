// app/reports/page.tsx
import { reportsApi } from '@/utils/reportsAPI';
import ReportForm from './reportForm';

const reportTypes = [
  { id: 'safety_performance', name: 'Safety Performance', description: 'Overview of safety metrics and KPIs' },
  { id: 'incident_trends', name: 'Incident Trends', description: 'Analysis of incident patterns over time' },
  { id: 'location_analysis', name: 'Location Analysis', description: 'Safety metrics by location' },
  { id: 'compliance_report', name: 'Compliance Report', description: 'Regulatory compliance status' },
] as const;

export default async function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Generate Reports</h1>
        <p className="mt-2 text-gray-600">Select report type and parameters to generate detailed safety reports</p>
      </div>

      <ReportForm reportTypes={reportTypes} />
    </div>
  );
}