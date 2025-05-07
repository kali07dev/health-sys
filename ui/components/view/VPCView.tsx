"use client"

import { useState, useEffect } from "react"
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline"
import { VPCCard } from "./VPCCard"
import { VPCDetailsSidebar } from "./VPCDetailsSidebar"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { VPCAPI, type VPC } from "@/utils/vpcAPI"

interface VPCViewProps {
  userId: string
  userRole: string
}

export default function VPCView({ userId, userRole }: VPCViewProps) {
  const [vpcs, setVpcs] = useState<VPC[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVPC, setSelectedVPC] = useState<VPC | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 9,
    totalCount: 0,
    totalPages: 0,
  })
  console.log("User ID:", userId)
  console.log("User Role:", userRole)


  const fetchVPCs = async () => {
    try {
      setLoading(true)
      const apiResponse = await VPCAPI.listAllVPCs({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
      })

      // Access the data property from the API response
      const response = apiResponse?.data || {}

      // Ensure items exists and is an array before assigning
      setVpcs(response?.items || [])
      setPagination({
        page: response?.page || 1,
        pageSize: response?.pageSize || pagination.pageSize,
        totalCount: response?.totalCount || 0,
        totalPages: response?.totalPages || 0,
      })

      console.log("API Response:", apiResponse)
      console.log("VPCs loaded:", response?.items || [])
    } catch (err) {
      setError("Failed to load VPCs")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVPCs()
  }, [pagination.page, pagination.pageSize, searchQuery])

  const handleSelectVPC = async (vpc: VPC) => {
    try {
      // Fetch the full VPC details including attachments
      const fullVPC = await VPCAPI.getVPC(vpc.id)
      setSelectedVPC(fullVPC)
    } catch (err) {
      console.error("Error fetching VPC details:", err)
      // Fall back to the basic VPC data if detailed fetch fails
      setSelectedVPC(vpc)
    }
  }

  const handleCloseSidebar = () => {
    setSelectedVPC(null)
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const apiResponse = await VPCAPI.listAllVPCs({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchQuery,
      })

      // Access the data property from the API response
      const response = apiResponse?.data || {}

      // Ensure items exists and is an array before assigning
      setVpcs(response?.items || [])
      setPagination({
        page: response?.page || 1,
        pageSize: response?.pageSize || pagination.pageSize,
        totalCount: response?.totalCount || 0,
        totalPages: response?.totalPages || 0,
      })

      if (selectedVPC) {
        const updatedVPC = await VPCAPI.getVPC(selectedVPC.id)
        setSelectedVPC(updatedVPC)
      }

      console.log("API Response on refresh:", apiResponse)
      console.log("VPCs after refresh:", response?.items || [])
    } catch (err) {
      setError("Failed to refresh VPCs")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page,
    }))
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            placeholder="Search VPCs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleRefresh} className="ml-2 bg-red-600 hover:bg-red-700">
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-white rounded-lg shadow p-6">
          <p className="text-red-600">{error}</p>
          <Button onClick={handleRefresh} className="mt-4 bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      ) : vpcs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">No VPCs found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vpcs.map((vpc) => (
              <VPCCard key={vpc.id} vpc={vpc} onClick={() => handleSelectVPC(vpc)} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {selectedVPC && <VPCDetailsSidebar vpc={selectedVPC} onClose={handleCloseSidebar} />}
    </div>
  )
}
