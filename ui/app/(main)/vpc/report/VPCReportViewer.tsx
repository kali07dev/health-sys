// src/app/reports/vpc-preview/VPCReportViewer.tsx
'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Calendar,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  BarChart3,
  User,
  Briefcase,
  TrendingUp,
  ListChecks,
  ArrowRightFromLine, // Changed for better "Escalation" meaning
  Layers, // For Attachments
} from 'lucide-react';
import type { VPCReport, Attachment as AttachmentType } from './types'; // Adjust path if types.ts is elsewhere

interface VPCReportViewerProps {
  report: VPCReport;
}

export default function VPCReportViewer({ report }: VPCReportViewerProps) {
  const [expandedSections, setExpandedSections] = useState({
    description: true,
    actionTaken: true,
    attachments: true,
    stats: false,
    escalation: false,
    personnel: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📜';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    return '📄'; // Default document icon
  };

  const safetyTypeClasses = report.vpcType === 'unsafe'
    ? 'bg-red-600 text-white'
    : 'bg-green-600 text-white';
  const safetyBorderClasses = report.vpcType === 'unsafe' ? 'border-red-500' : 'border-green-500';

  const safetyPercentage = report.stats.departmentTotal > 0
    ? ((report.stats.departmentSafe / report.stats.departmentTotal) * 100).toFixed(1)
    : '0';

  // Handler for PDF download (can be an API call)
  const handleDownloadPdf = async () => {
    // Example: API call to generate and download PDF
    // const response = await fetch(`/api/reports/vpc/${report.id}/pdf`);
    // if (response.ok) {
    //   const blob = await response.blob();
    //   const url = window.URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = `vpc-report-${report.vpcNumber}.pdf`;
    //   document.body.appendChild(a);
    //   a.click();
    //   a.remove();
    //   window.URL.revokeObjectURL(url);
    // } else {
    //   alert('Failed to download PDF.');
    // }
    alert(`Simulating PDF download for ${report.vpcNumber}`);
  };


  return (
    <div className="max-w-4xl mx-auto">
      {/* Report Header */}
      <div className={`border-t-4 ${safetyBorderClasses} bg-white shadow-lg rounded-lg overflow-hidden`}>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">VPC Safety Report</h1>
              <p className="text-gray-600">Your Company Name Inc.</p>
              <p className="text-sm text-gray-500">Generated on: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
            </div>
            <button
              onClick={handleDownloadPdf}
              className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Download size={18} className="mr-2" />
              Download PDF
            </button>
          </div>

          {/* Incident Summary */}
          <div className="mt-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FileText size={22} className="mr-2 text-blue-600" />
              Incident Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-sm text-gray-500">VPC Number</p>
                <p className="font-medium text-gray-800">{report.vpcNumber}</p>
              </div>
              <div className="flex items-start">
                <Calendar size={18} className="mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">Reported Date & Time</p>
                  <p className="font-medium text-gray-800">{new Date(report.reportedDate).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Department</p>
                <p className="font-medium text-gray-800">{report.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Incident Category</p>
                <p className="font-medium text-gray-800">{report.incidentRelatesTo}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Safety Type</p>
                <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-semibold ${safetyTypeClasses}`}>
                  {report.vpcType === 'unsafe' ? (
                    <div className="flex items-center">
                      <AlertCircle size={16} className="mr-1.5" />
                      UNSAFE
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle size={16} className="mr-1.5" />
                      SAFE
                    </div>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Section Toggle Helper */}
          {(Object.keys(expandedSections) as Array<keyof typeof expandedSections>)
            .filter(key => key !== 'personnel' && key !== 'stats' && key !== 'escalation' && key !== 'attachments') // These are handled separately below
            .map(sectionKey => {
              const titleMap: Record<string, string> = {
                description: 'Description',
                actionTaken: 'Action Taken',
              };
              const IconMap: Record<string, React.ElementType> = {
                description: ListChecks,
                actionTaken: TrendingUp,
              };
              const Icon = IconMap[sectionKey];

              return (
                <div className="mt-6" key={sectionKey}>
                  <div
                    className="flex justify-between items-center cursor-pointer py-2"
                    onClick={() => toggleSection(sectionKey)}
                  >
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                      <Icon size={22} className="mr-2 text-blue-600" />
                      {titleMap[sectionKey]}
                    </h2>
                    {expandedSections[sectionKey] ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                  {expandedSections[sectionKey] && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {sectionKey === 'description' && (
                        <blockquote className="italic border-l-4 border-gray-400 pl-4 py-2 text-gray-700 leading-relaxed">
                          &quot;{report.description}&quot;
                        </blockquote>
                      )}
                      {sectionKey === 'actionTaken' && (
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          {report.actionTaken.split('\n').map((step, i) => (
                            <li key={i} className="leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Attachments */}
          <div className="mt-6">
            <div
              className="flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection('attachments')}
            >
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Layers size={22} className="mr-2 text-blue-600" />
                Attachments ({report.attachments.length})
              </h2>
              {expandedSections.attachments ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
            {expandedSections.attachments && (
              report.attachments.length > 0 ? (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.attachments.map((attachment: AttachmentType, index: number) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <div className="text-3xl mr-3 mt-1 text-gray-600">
                          {getFileIcon(attachment.fileType)}
                        </div>
                        <div className="flex-1 min-w-0"> {/* Added min-w-0 for truncation to work */}
                          <p 
                            className="font-semibold text-blue-700 truncate hover:underline cursor-pointer" 
                            title={attachment.fileName}
                            onClick={() => attachment.url && window.open(attachment.url, '_blank')}
                          >
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(attachment.fileSize / (1024 * 1024)).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-gray-500">
                            Uploaded by: {attachment.uploadedBy}
                          </p>
                        </div>
                        {attachment.url && (
                           <button 
                            className="ml-2 p-1 text-gray-500 hover:text-blue-600 flex-shrink-0"
                            title="Download attachment"
                            onClick={() => window.open(attachment.url, '_blank')}
                          >
                            <Download size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-gray-600 italic p-4 bg-gray-50 rounded-lg border border-gray-200">No attachments for this report.</p>
              )
            )}
          </div>
          
          {/* Personnel Matrix */}
          <div className="mt-6">
            <div
              className="flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection('personnel')}
            >
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <Users size={22} className="mr-2 text-blue-600" />
                Personnel Matrix
              </h2>
              {expandedSections.personnel ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
            {expandedSections.personnel && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center"><User size={18} className="mr-2"/>Reported By</h3>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-800">{report.reporter.name}</p>
                  <p className="text-sm text-gray-500 mt-2">Position</p>
                  <p className="font-medium text-gray-800">{report.reporter.position}</p>
                  <p className="text-sm text-gray-500 mt-2">Employee Number</p>
                  <p className="font-medium text-gray-800">{report.reporter.employeeNumber}</p>
                </div>
                <div>
                  <h3 className="text-md font-semibold text-gray-700 mb-2 flex items-center"><Briefcase size={18} className="mr-2"/>VPC Created By</h3>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-800">{report.creator.name}</p>
                  <p className="text-sm text-gray-500 mt-2">Role</p>
                  <p className="font-medium text-gray-800">{report.creator.role}</p>
                  <p className="text-sm text-gray-500 mt-2">Employee Number</p>
                  <p className="font-medium text-gray-800">{report.creator.employeeNumber}</p>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="mt-6">
            <div
              className="flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection('stats')}
            >
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <BarChart3 size={22} className="mr-2 text-blue-600" />
                Department Statistics ({report.department})
              </h2>
              {expandedSections.stats ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
            {expandedSections.stats && (
              <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Total VPCs</p>
                    <p className="text-2xl font-bold text-gray-800">{report.stats.departmentTotal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Safe VPCs ({safetyPercentage}%)</p>
                     <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                      <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${safetyPercentage}%` }}></div>
                    </div>
                    <p className="text-sm font-medium text-green-600 mt-1">{report.stats.departmentSafe} Safe / {report.stats.departmentUnsafe} Unsafe</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">VPCs in Last 90 Days</p>
                    <p className="text-xl font-semibold text-gray-800">{report.stats.last90Days}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-md font-semibold text-gray-700 mb-2">Category Breakdown:</h4>
                  <ul className="space-y-1">
                    {Object.entries(report.stats.categories).map(([category, count]) => (
                      <li key={category} className="flex justify-between text-sm text-gray-700">
                        <span>{category}</span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Escalation Path */}
          <div className="mt-6">
            <div
              className="flex justify-between items-center cursor-pointer py-2"
              onClick={() => toggleSection('escalation')}
            >
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <ArrowRightFromLine size={22} className="mr-2 text-blue-600" />
                Escalation Path
              </h2>
              {expandedSections.escalation ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
            </div>
            {expandedSections.escalation && (
              report.escalationPath.length > 0 ? (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <ol className="relative border-l border-gray-300 dark:border-gray-700">
                    {report.escalationPath.map((manager, index) => (
                      <li key={index} className="mb-6 ml-6">
                        <span className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-4 ring-white dark:ring-gray-900 dark:bg-blue-900">
                          <span className="text-blue-700 font-bold text-xs">{manager.level}</span>
                        </span>
                        <h3 className="flex items-center mb-1 text-md font-semibold text-gray-900">
                          {manager.name}
                        </h3>
                        <p className="text-sm font-normal text-gray-500">{manager.position}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                 <p className="mt-2 text-gray-600 italic p-4 bg-gray-50 rounded-lg border border-gray-200">No escalation path defined for this report.</p>
              )
            )}
          </div>
        </div>

        {/* Report Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            This report was generated by the VPC Safety365 System. © {new Date().getFullYear()} Your Company Name Inc. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Report ID: {report.id}
          </p>
        </div>
      </div>
    </div>
  );
}