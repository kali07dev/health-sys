// app/reports/ReportForm.tsx
'use client';

import { useState } from 'react';
import { ReportRequest, reportsApi } from '@/utils/reportsAPI';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ReportType = {
  id: 'safety_performance' | 'incident_trends' | 'location_analysis' | 'compliance_report';
  name: string;
  description: string;
};

interface ReportFormProps {
  reportTypes: readonly ReportType[];
}

export default function ReportForm({ reportTypes }: ReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');

  const handleGenerateReport = async () => {
    if (!selectedReport || !dateRange.startDate || !dateRange.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const request: ReportRequest = {
        reportType: selectedReport as ReportRequest['reportType'],
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format,
      };

      await reportsApi.downloadReport(request);
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Report Type Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Report Type</h2>
        <div className="grid gap-4">
          {reportTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`p-4 rounded-lg border transition-all ${
                selectedReport === type.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-400'
              }`}
            >
              <h3 className="font-medium text-gray-900">{type.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{type.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Report Parameters */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Report Parameters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setFormat('pdf')}
                  className={`px-4 py-2 rounded-md ${
                    format === 'pdf'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setFormat('excel')}
                  className={`px-4 py-2 rounded-md ${
                    format === 'excel'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading || !selectedReport || !dateRange.startDate || !dateRange.endDate}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </button>
      </div>
    </div>
  );
}