"use client"

import { useState } from "react"
import { type ReportRequest, reportsApi } from "@/utils/reportsAPI"
import { toast } from "sonner"
import { Loader2, FileType, FileSpreadsheet, ChevronRight, Calendar, Clock } from "lucide-react"

type ReportType = {
  id: "safety_performance" | "incident_trends" | "location_analysis" | "compliance_report"
  name: string
  description: string
}

interface ReportFormProps {
  reportTypes: readonly ReportType[]
}

export default function ReportForm({ reportTypes }: ReportFormProps) {
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string>("")
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
    startTime: "00:00", // Start of day
    endTime: "23:59", // End of day
  })
  const [format, setFormat] = useState<"pdf" | "excel">("pdf")
  const [step, setStep] = useState(1)

  // Helper function to format date and time to RFC3339
  const formatDateTime = (date: string, time: string) => {
    if (!date) return ""
    return new Date(`${date}T${time}`).toISOString()
  }

  const handleGenerateReport = async () => {
    if (!selectedReport || !dateRange.startDate || !dateRange.endDate) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      const request: ReportRequest = {
        reportType: selectedReport as ReportRequest["reportType"],
        startDate: formatDateTime(dateRange.startDate, dateRange.startTime),
        endDate: formatDateTime(dateRange.endDate, dateRange.endTime),
        format,
      }

      await reportsApi.downloadReport(request)
      toast.success("Report generated successfully")
    } catch {
      toast.error("Failed to generate report")
      //console.error(error);
    } finally {
      setLoading(false)
    }
  }

  const isDateRangeValid = dateRange.startDate && dateRange.endDate
  const canProceed = step === 1 ? selectedReport : isDateRangeValid

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100">
      {/* Header with Title */}
      <div className="bg-[#0A1A2F] text-white px-8 py-5 rounded-t-2xl">
        <h1 className="text-2xl font-bold">Generate Report</h1>
        <p className="text-gray-300 text-sm mt-1">Create custom reports for your organization</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between px-8 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full flex items-center justify-center ${step >= 1 ? "bg-[#E63946]" : "bg-gray-200"}`}
          >
            {step > 1 && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
          </div>
          <div className={`h-0.5 w-6 ${step >= 2 ? "bg-[#E63946]" : "bg-gray-200"}`}></div>
          <div
            className={`h-3 w-3 rounded-full flex items-center justify-center ${step >= 2 ? "bg-[#E63946]" : "bg-gray-200"}`}
          >
            {step > 2 && <div className="h-1.5 w-1.5 rounded-full bg-white"></div>}
          </div>
          <div className={`h-0.5 w-6 ${step >= 3 ? "bg-[#E63946]" : "bg-gray-200"}`}></div>
          <div
            className={`h-3 w-3 rounded-full flex items-center justify-center ${step === 3 ? "bg-[#E63946]" : "bg-gray-200"}`}
          ></div>
        </div>
        <span className="text-sm font-medium text-[#0A1A2F]">Step {step} of 3</span>
      </div>

      {/* Step 1: Report Type Selection */}
      <div className={`transition-all duration-300 ${step === 1 ? "block" : "hidden"}`}>
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold text-[#0A1A2F] mb-6">Choose Report Type</h2>
          <div className="grid grid-cols-2 gap-5">
            {reportTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`p-6 rounded-xl transition-all duration-200 group ${
                  selectedReport === type.id
                    ? "bg-[#F8F0F1] border-[#E63946] border-2"
                    : "hover:bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex flex-col items-start">
                  <div
                    className={`w-14 h-14 rounded-full mb-3 flex items-center justify-center ${
                      selectedReport === type.id ? "bg-[#E63946]" : "bg-gray-100"
                    }`}
                  >
                    <ChevronRight
                      className={`w-6 h-6 ${selectedReport === type.id ? "text-white" : "text-gray-500"}`}
                    />
                  </div>
                  <h3
                    className={`font-semibold text-lg mb-1 ${
                      selectedReport === type.id ? "text-[#E63946]" : "text-[#0A1A2F]"
                    }`}
                  >
                    {type.name}
                  </h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step 2: Date Selection */}
      <div className={`transition-all duration-300 ${step === 2 ? "block" : "hidden"}`}>
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold text-[#0A1A2F] mb-6">Select Date Range</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#0A1A2F] mb-2">Start Date and Time</label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#E63946] w-5 h-5" />
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#E63946] focus:border-[#E63946] transition-all duration-200 text-[#0A1A2F]"
                  />
                </div>
                <div className="w-40 relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#E63946] w-5 h-5" />
                  <input
                    type="time"
                    value={dateRange.startTime}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, startTime: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#E63946] focus:border-[#E63946] transition-all duration-200 text-[#0A1A2F]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0A1A2F] mb-2">End Date and Time</label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#E63946] w-5 h-5" />
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#E63946] focus:border-[#E63946] transition-all duration-200 text-[#0A1A2F]"
                  />
                </div>
                <div className="w-40 relative">
                  <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#E63946] w-5 h-5" />
                  <input
                    type="time"
                    value={dateRange.endTime}
                    onChange={(e) => setDateRange((prev) => ({ ...prev, endTime: e.target.value }))}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-[#E63946] focus:border-[#E63946] transition-all duration-200 text-[#0A1A2F]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Format Selection */}
      <div className={`transition-all duration-300 ${step === 3 ? "block" : "hidden"}`}>
        <div className="px-8 py-6">
          <h2 className="text-2xl font-bold text-[#0A1A2F] mb-6">Choose Format</h2>
          <div className="grid grid-cols-2 gap-5">
            <button
              onClick={() => setFormat("pdf")}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                format === "pdf" ? "bg-[#F8F0F1] border-[#E63946]" : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full mb-3 flex items-center justify-center ${
                  format === "pdf" ? "bg-[#E63946]" : "bg-gray-100"
                }`}
              >
                <FileType className={`w-7 h-7 ${format === "pdf" ? "text-white" : "text-gray-500"}`} />
              </div>
              <h3 className={`font-semibold text-lg ${format === "pdf" ? "text-[#E63946]" : "text-[#0A1A2F]"}`}>
                PDF Format
              </h3>
              <p className="text-sm text-gray-600 mt-1">Best for viewing and sharing</p>
            </button>
            <button
              onClick={() => setFormat("excel")}
              className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                format === "excel" ? "bg-[#F8F0F1] border-[#E63946]" : "hover:bg-gray-50 border-gray-200"
              }`}
            >
              <div
                className={`w-14 h-14 rounded-full mb-3 flex items-center justify-center ${
                  format === "excel" ? "bg-[#E63946]" : "bg-gray-100"
                }`}
              >
                <FileSpreadsheet className={`w-7 h-7 ${format === "excel" ? "text-white" : "text-gray-500"}`} />
              </div>
              <h3 className={`font-semibold text-lg ${format === "excel" ? "text-[#E63946]" : "text-[#0A1A2F]"}`}>
                Excel Format
              </h3>
              <p className="text-sm text-gray-600 mt-1">Best for data analysis</p>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="px-8 py-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setStep((prev) => prev - 1)}
            className={`px-6 py-3 text-[#0A1A2F] font-medium rounded-lg hover:bg-gray-100 transition-all duration-200 ${
              step === 1 ? "invisible" : ""
            }`}
          >
            Back
          </button>
          <button
            onClick={() => {
              if (step === 3) {
                handleGenerateReport()
              } else {
                setStep((prev) => prev + 1)
              }
            }}
            disabled={!canProceed || loading}
            className="px-8 py-3 bg-[#E63946] text-white rounded-lg hover:bg-[#D12D3A] disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-200 min-w-[140px] flex items-center justify-center font-medium"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : step === 3 ? "Generate Report" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  )
}
