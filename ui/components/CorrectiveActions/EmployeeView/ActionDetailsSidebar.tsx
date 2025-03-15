'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Upload,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { CorrectiveAction } from '@/interfaces/incidents';
import { incidentAPI } from '@/utils/api';
import FeedbackForm from './FeedbackForm';
import EvidenceUploader from './EvidenceUploader';
import Image from 'next/image';

interface ActionDetailsSidebarProps {
  action: CorrectiveAction;
  isOpen: boolean;
  onClose: () => void;
  onActionUpdated: () => void;
  userId: string;
  userRole: string;
}

export default function ActionDetailsSidebar({ 
  action, 
  isOpen, 
  onClose, 
  onActionUpdated,
  // userId,
  userRole
}: ActionDetailsSidebarProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const BE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

  const canAddEvidence = action.status !== 'completed' && action.status !== 'verified';
  const isAdminOrSafetyOfficer = userRole === 'admin' || userRole === 'safety_officer';

  // Get status icon and color
  const getStatusDetails = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'verified':
        return {
          icon: <CheckCircle2 className="h-5 w-5 text-green-800" />,
          color: 'text-green-800',
          bgColor: 'bg-green-100'
        };
      case 'in_progress':
        return {
          icon: <Clock className="h-5 w-5 text-blue-600" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'overdue':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50'
        };
    }
  };

  // Calculate due date and days remaining
  const dueDate = new Date(action.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  
  const today = new Date();
  const daysDiff = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
  
  const statusDetails = getStatusDetails(action.status);

  const handleMarkInProgress = async () => {
    if (action.status === 'pending') {
      try {
        setIsSubmitting(true);
        await incidentAPI.updateCorrectiveAction(action.id, {
          ...action,
          status: 'in_progress'
        });
        onActionUpdated();
        toast.success('Action marked as in progress');
      } catch (error) {
        console.error(error);
        toast.error('Failed to update action status');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSectionToggle = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex ${isOpen ? 'visible' : 'invisible'}`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'opacity-30' : 'opacity-0'}`}
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl overflow-y-auto transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-full mr-3 ${statusDetails.bgColor}`}>
              {statusDetails.icon}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Corrective Action</h2>
              <p className={`text-sm font-medium ${statusDetails.color}`}>
                {action.status.charAt(0).toUpperCase() + action.status.slice(1).replace('_', ' ')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close panel"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Incident Title */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Incident Title</h3>
            <p className="text-base text-gray-900">{action.incidentTitle}</p>
          </div>

          {/* Assigned By and Assigned To */}
          <div className="flex">
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned By</h3>
              <p className="text-base text-gray-900">{action.assignerName}</p>
            </div>
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Assigned To</h3>
              <p className="text-base text-gray-900">{action.assigneeName}</p>
            </div>
          </div>

          {/* Description */}
          <div className="flex">
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
              <p className="text-base text-gray-900">{action.incidentLocation}</p>
            </div>
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-base text-gray-900">{action.description}</p>
            </div>
          </div>
          
          {/* Due date */}
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-700">Due Date</p>
              <p className="text-base text-gray-900">{formattedDueDate}</p>
              
              {action.status !== 'completed' && action.status !== 'verified' && (
                <p className={`text-sm mt-1 ${daysDiff < 0 ? 'text-red-600 font-medium' : daysDiff <= 3 ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                  {daysDiff < 0 
                    ? `${Math.abs(daysDiff)} days overdue` 
                    : daysDiff === 0 
                      ? 'Due today' 
                      : `${daysDiff} days remaining`}
                </p>
              )}
            </div>
          </div>
          
          {/* Priority and Type */}
          <div className="flex">
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Priority</h3>
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium 
                ${action.priority === 'critical' ? 'bg-red-100 text-red-800' : 
                  action.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  action.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'}`}>
                {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}
              </div>
            </div>
            <div className="w-1/2">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Type</h3>
              <p className="text-base text-gray-900">{action.actionType}</p>
            </div>
          </div>
          
          {/* Evidence section */}
          <div className="border rounded-lg overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
              onClick={() => setEvidenceExpanded(!evidenceExpanded)}
            >
              <h3 className="text-sm font-medium text-gray-700">Evidence & Attachments</h3>
              <button className="p-1 rounded-full hover:bg-gray-200">
                {evidenceExpanded ? 
                  <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                }
              </button>
            </div>
            
            {evidenceExpanded && (
              <div className="p-4 border-t">
                {action.evidence && action.evidence.length > 0 ? (
                  <div className="space-y-4">
                    {action.evidence.map((evidence) => (
                      <div key={evidence.id} className="flex flex-col space-y-3">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{evidence.fileName}</p>
                            <p className="text-xs text-gray-500">Uploaded by {evidence.uploaderName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(evidence.uploadedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {/* File Preview */}
                        <div className="mt-2">
                          {/* Check file extension instead of fileType */}
                          {evidence.fileName.match(/\.(jpeg|jpg|gif|png|svg|webp)$/i) ? (
                            <div className="w-full h-auto rounded-lg border border-gray-200 overflow-hidden">
                              <Image
                                src={`${BE_URL}/${evidence.fileURL}`}
                                alt={evidence.fileName}
                                className="w-full h-auto object-cover max-h-48"
                              />
                            </div>
                          ) : (
                            <a
                              href={evidence.fileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline"
                            >
                              Preview File
                            </a>
                          )}
                          {evidence.description && (
                            <p className="text-xs text-gray-600 mt-1">{evidence.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p>No evidence uploaded yet</p>
                  </div>
                )}
                
                {canAddEvidence && (
                  <button
                    onClick={() => handleSectionToggle('evidence')}
                    className="w-full mt-4 py-2 px-4 bg-red-50 text-red-600 rounded-md hover:bg-red-100 flex items-center justify-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Evidence
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Action History */}
          <div className="border rounded-lg overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
              onClick={() => setHistoryExpanded(!historyExpanded)}
            >
              <h3 className="text-sm font-medium text-gray-700">Action History</h3>
              <button className="p-1 rounded-full hover:bg-gray-200">
                {historyExpanded ? 
                  <ChevronUp className="h-4 w-4 text-gray-500" /> : 
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                }
              </button>
            </div>
            
            {historyExpanded && (
              <div className="p-4 border-t">
                <ul className="space-y-4">
                  <li className="flex space-x-3">
                    <div className="relative">
                      <div className="h-2 w-2 rounded-full bg-gray-300 mt-2"></div>
                      <div className="absolute top-4 bottom-0 left-0.5 border-l border-dashed border-gray-300"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Action Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(action.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </li>
                  
                  {action.status !== 'pending' && (
                    <li className="flex space-x-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Status Changed to In Progress</p>
                        <p className="text-xs text-gray-500">Date not available</p>
                      </div>
                    </li>
                  )}
                  
                  {(action.status === 'completed' || action.status === 'verified') && (
                    <li className="flex space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-500 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Action Completed</p>
                        <p className="text-xs text-gray-500">
                          {action.completedAt ? new Date(action.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Date not available'}
                        </p>
                      </div>
                    </li>
                  )}
                  
                  {action.status === 'verified' && (
                    <li className="flex space-x-3">
                      <div className="h-2 w-2 rounded-full bg-green-700 mt-2"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Action Verified</p>
                        <p className="text-xs text-gray-500">
                          {action.verifiedAt ? new Date(action.verifiedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'Date not available'}
                        </p>
                        <p className="text-xs text-gray-700">Verified by: {action.verifiedBy || 'N/A'}</p>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="pt-4 space-y-3 border-t">
            {action.status === 'pending' && (
              <button
                onClick={handleMarkInProgress}
                disabled={isSubmitting}
                className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4 mr-2" />
                )}
                Mark as In Progress
              </button>
            )}
            
            {(action.status === 'in_progress' || action.status === 'overdue') && (
              <button
                onClick={() => handleSectionToggle('feedback')}
                className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </button>
            )}
            
            {canAddEvidence && (
              <button
                onClick={() => handleSectionToggle('evidence')}
                className="w-full py-2 px-4 bg-white text-red-600 border border-red-600 rounded-md hover:bg-red-50 flex items-center justify-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </button>
            )}

            {/* Verification button for Admin or Safety Officer */}
            {action.verificationRequired && isAdminOrSafetyOfficer && (
              <button
                onClick={() => handleSectionToggle('verification')}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Verify Action
              </button>
            )}
          </div>
          
          {/* Forms */}
          {activeSection === 'feedback' && (
            <div className="pt-4 border-t">
              <FeedbackForm 
                actionId={action.id}
                onCancel={() => setActiveSection(null)}
                onSubmitSuccess={onActionUpdated}
              />
            </div>
          )}
          
          {activeSection === 'evidence' && (
            <div className="pt-4 border-t">
              <EvidenceUploader
                actionId={action.id}
                onCancel={() => setActiveSection(null)}
                onSubmitSuccess={onActionUpdated}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}