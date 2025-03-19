"use client"

import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { InvestigationCard } from './InvestigationCard';
import { InvestigationDetailsSidebar } from './InvestigationDetailsSidebar';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { InvestigationFindingsModal } from './InvestigationFindingsModal';
import { InvestigationAPI } from '@/utils/investigationAPI';
import { Investigation,} from '@/interfaces/incidents';


interface InvestigationsViewProps {
  userId: string
  userRole: string
}

export default function InvestigationsView({ userId }: InvestigationsViewProps) {
  const [investigations, setInvestigations] = useState<Investigation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showInterviewModal, setShowInterviewModal] = useState(false)
  const [showFindingsModal, setShowFindingsModal] = useState(false)

  useEffect(() => {
    const fetchInvestigations = async () => {
      try {
        const response = await InvestigationAPI.getInvestigationByEmployee(userId)
        setInvestigations(Array.isArray(response) ? response : [])
      } catch (err) {
        setError("Failed to load investigations")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchInvestigations()
  }, [userId])

  const filteredInvestigations = investigations.filter((investigation) => {
    // Handle potential null values and case-insensitive search
    const incidentTitle = investigation.incident?.Title || investigation.incident?.Title || ""
    const status = investigation.status || ""

    return (
      incidentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      status.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const handleSelectInvestigation = (investigation: Investigation) => {
    setSelectedInvestigation(investigation)
  }

  const handleCloseSidebar = () => {
    setSelectedInvestigation(null)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await InvestigationAPI.getInvestigationByEmployee(userId)
      const investigationsArray = Array.isArray(response) ? response : [response]
      setInvestigations(investigationsArray)

      // Refresh selected investigation if needed
      if (selectedInvestigation) {
        const updatedInvestigation = investigationsArray.find((inv) => inv.id === selectedInvestigation.id)
        setSelectedInvestigation(updatedInvestigation || null)
      }
    } catch (err) {
      setError("Failed to refresh investigations")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col h-full mt-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Search investigations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
            Try Again
          </button>
        </div>
      ) : filteredInvestigations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-500 dark:text-gray-400">No investigations found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvestigations.map((investigation) => (
            <InvestigationCard
              key={investigation.id}
              investigation={investigation}
              onClick={() => handleSelectInvestigation(investigation)}
            />
          ))}
        </div>
      )}

      {/* Sidebar for detailed view */}
      {selectedInvestigation && (
        <InvestigationDetailsSidebar
          investigation={selectedInvestigation}
          onClose={handleCloseSidebar}
          onInvestigationClosed={handleRefresh}
          onScheduleInterview={() => setShowInterviewModal(true)}
          onAddFindings={() => setShowFindingsModal(true)}
        />
      )}

      {/* Modals */}
      {showInterviewModal && selectedInvestigation && (
        <ScheduleInterviewModal
          investigationId={selectedInvestigation.id}
          onClose={() => setShowInterviewModal(false)}
          onSchedule={handleRefresh}
        />
      )}

      {showFindingsModal && selectedInvestigation && (
        <InvestigationFindingsModal
          investigationId={selectedInvestigation.id}
          onClose={() => setShowFindingsModal(false)}
          onSubmit={handleRefresh}
        />
      )}
    </div>
  )
}

