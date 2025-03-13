// app/reports/ReportForm.tsx
'use client';

import { useState } from 'react';
import { ReportRequest, reportsApi } from '@/utils/reportsAPI';
import { toast } from 'sonner';
import { Loader2, FileType, FileSpreadsheet, ChevronRight } from 'lucide-react';

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
    startTime: '00:00',  // Start of day
    endTime: '23:59'     // End of day
  });
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [step, setStep] = useState(1);

  // Helper function to format date and time to RFC3339
  const formatDateTime = (date: string, time: string) => {
      if (!date) return '';
      return new Date(`${date}T${time}`).toISOString();
  };

  const handleGenerateReport = async () => {
    if (!selectedReport || !dateRange.startDate || !dateRange.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const request: ReportRequest = {
        reportType: selectedReport as ReportRequest['reportType'],
        startDate: formatDateTime(dateRange.startDate, dateRange.startTime),
        endDate: formatDateTime(dateRange.endDate, dateRange.endTime),
        format,
      };

      await reportsApi.downloadReport(request);
      toast.success('Report generated successfully');
    } catch {
      toast.error('Failed to generate report');
      //console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const isDateRangeValid = dateRange.startDate && dateRange.endDate;
  const canProceed = step === 1 ? selectedReport : isDateRangeValid;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`} />
          <div className={`h-2 w-2 rounded-full ${step === 3 ? 'bg-blue-500' : 'bg-gray-200'}`} />
        </div>
        <span className="text-sm text-gray-400">Step {step} of 3</span>
      </div>

      {/* Step 1: Report Type Selection */}
      <div className={`transition-all duration-300 ${step === 1 ? 'block' : 'hidden'}`}>
        <div className="px-8 py-6">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Choose Report Type</h2>
          <div className="grid gap-3">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`p-6 rounded-xl transition-all duration-200 group ${
                  selectedReport === type.id
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{type.name}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                  <ChevronRight 
                    className={`w-5 h-5 transition-all duration-200 ${
                      selectedReport === type.id ? 'text-blue-500' : 'text-gray-300 group-hover:text-gray-400'
                    }`} 
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Date Selection */}
      <div className={`transition-all duration-300 ${step === 2 ? 'block' : 'hidden'}`}>
        <div className="px-8 py-6">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Select Date Range</h2>
          <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Start Date and Time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="flex-1 px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <input
                type="time"
                value={dateRange.startTime}
                onChange={(e) => setDateRange(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-32 px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              End Date and Time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="flex-1 px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              <input
                type="time"
                value={dateRange.endTime}
                onChange={(e) => setDateRange(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-32 px-4 py-3 rounded-xl border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
         </div>
        </div>
      </div>

      {/* Step 3: Format Selection */}
      <div className={`transition-all duration-300 ${step === 3 ? 'block' : 'hidden'}`}>
        <div className="px-8 py-6">
          <h2 className="text-2xl font-medium text-gray-900 mb-6">Choose Format</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setFormat('pdf')}
              className={`p-6 rounded-xl border transition-all duration-200 ${
                format === 'pdf'
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <FileType className={`w-8 h-8 mb-2 ${format === 'pdf' ? 'text-blue-500' : 'text-gray-400'}`} />
              <h3 className="font-medium text-gray-900">PDF Format</h3>
              <p className="text-sm text-gray-500 mt-1">Best for viewing</p>
            </button>
            <button
              onClick={() => setFormat('excel')}
              className={`p-6 rounded-xl border transition-all duration-200 ${
                format === 'excel'
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              <FileSpreadsheet className={`w-8 h-8 mb-2 ${format === 'excel' ? 'text-blue-500' : 'text-gray-400'}`} />
              <h3 className="font-medium text-gray-900">Excel Format</h3>
              <p className="text-sm text-gray-500 mt-1">Best for analysis</p>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="px-8 py-6 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStep(prev => prev - 1)}
            className={`px-6 py-2 text-gray-600 rounded-lg hover:bg-gray-50 transition-all duration-200 ${
              step === 1 ? 'invisible' : ''
            }`}
          >
            Back
          </button>
          <button
            onClick={() => {
              if (step === 3) {
                handleGenerateReport();
              } else {
                setStep(prev => prev + 1);
              }
            }}
            disabled={!canProceed || loading}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-200 min-w-[120px] flex items-center justify-center"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === 3 ? (
              'Generate'
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}