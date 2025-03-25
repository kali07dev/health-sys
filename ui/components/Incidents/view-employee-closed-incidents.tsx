"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format, formatDistance } from "date-fns"
import {
  Loader2,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  MapPin,
  User,
  X,
  ArrowLeft,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/dashCard"
import type { Incident } from "@/interfaces/incidents"
import IncidentDetails from "./IncidentDetails"
import { toast } from "react-hot-toast"
import InfoPanel from "@/components/ui/InfoPanel"
import { ArchiveIcon, UserIcon } from "lucide-react"
import { incidentAPI } from "@/utils/api"

interface ViewEmployeeClosedIncidentsProps {
  employeeId: string
}

export function ViewEmployeeClosedIncidents({ employeeId }: ViewEmployeeClosedIncidentsProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalIncidents, setTotalIncidents] = useState(0)
  const [loading, setLoading] = useState(true)

  // Sorting state
  const [sortField, setSortField] = useState<"title" | "location" | "type" | "severityLevel" | "status" | "occurredAt">(
    "occurredAt",
  )
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filtering state
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    severity: "",
    dateRange: {
      from: null as string | null,
      to: null as string | null,
    },
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Fetch employee details and closed incidents when component mounts
  useEffect(() => {
    const fetchEmployeeClosedIncidents = async (page: number, size: number) => {
        setLoading(true)
        try {
          // Modify this to use your actual API
          const response = await incidentAPI.getClosedIncidentsByEmployee( employeeId,{
            page,
            pageSize: size,
            
          })
    
          setIncidents(response.data)
          setCurrentPage(response.page)
          setTotalPages(response.totalPages)
          setPageSize(response.pageSize)
          setTotalIncidents(response.total)
        } catch (error) {
          console.error("Failed to fetch employee closed incidents:", error)
          toast.error("Failed to load incidents")
        } finally {
          setLoading(false)
        }
      }
    fetchEmployeeClosedIncidents(currentPage, pageSize)

    
  }, [currentPage, employeeId, pageSize])

  const fetchEmployeeClosedIncidents = async (page: number, size: number) => {
    setLoading(true)
    try {
      // Modify this to use your actual API
      const response = await incidentAPI.getClosedIncidentsByEmployee( employeeId,{
        page,
        pageSize: size,
        
      })

      setIncidents(response.data)
      setCurrentPage(response.page)
      setTotalPages(response.totalPages)
      setPageSize(response.pageSize)
      setTotalIncidents(response.total)
    } catch (error) {
      console.error("Failed to fetch employee closed incidents:", error)
      toast.error("Failed to load incidents")
    } finally {
      setLoading(false)
    }
  }


  // Page change handler
  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage) {
      fetchEmployeeClosedIncidents(newPage, pageSize)
    }
  }

  // Page size change handler
  const handlePageSizeChange = (newPageSize: number) => {
    fetchEmployeeClosedIncidents(1, newPageSize) // Reset to first page
  }

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident)
  }

  // Sort handler
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter handlers
  const handleFilterChange = (
    key: keyof typeof filters,
    value: string | { from: string | null; to: string | null },
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleDateRangeChange = (key: "from" | "to", value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value,
      },
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      type: "",
      severity: "",
      dateRange: {
        from: null,
        to: null,
      },
    })
  }

  // Apply client-side filtering and sorting
  const filteredAndSortedIncidents = incidents
    .filter((incident) => {
      // Text search
      if (
        filters.search &&
        !incident.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !incident.referenceNumber.toLowerCase().includes(filters.search.toLowerCase()) &&
        !incident.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        !incident.location.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false
      }

      // Type filter
      if (filters.type && filters.type !== "all" && incident.type !== filters.type) {
        return false
      }

      // Severity filter
      if (filters.severity && filters.severity !== "all" && incident.severityLevel !== filters.severity) {
        return false
      }

      // Date range filter
      if (filters.dateRange.from) {
        const fromDate = new Date(filters.dateRange.from)
        if (new Date(incident.occurredAt) < fromDate) {
          return false
        }
      }

      if (filters.dateRange.to) {
        const toDate = new Date(filters.dateRange.to)
        toDate.setHours(23, 59, 59, 999) // Set to end of day
        if (new Date(incident.occurredAt) > toDate) {
          return false
        }
      }

      return true
    })
    .sort((a, b) => {
        let valueA: string | number | undefined
        let valueB: string | number | undefined

      switch (sortField) {
        case "title":
          valueA = a.title
          valueB = b.title
          break
        case "location":
          valueA = a.location
          valueB = b.location
          break
        case "type":
          valueA = a.type
          valueB = b.type
          break
        case "severityLevel":
          // Sort by severity level with custom order
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
          valueA = severityOrder[a.severityLevel as keyof typeof severityOrder]
          valueB = severityOrder[b.severityLevel as keyof typeof severityOrder]
          break
        case "status":
          valueA = a.status
          valueB = b.status
          break
        case "occurredAt":
          valueA = new Date(a.occurredAt).getTime()
          valueB = new Date(b.occurredAt).getTime()
          break
        default:
          valueA = a[sortField]
          valueB = b[sortField]
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })

  // Helper functions
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch (e) {
      console.log(e)
      return "Invalid date"
    }
  }

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true })
    } catch (e) {
      console.log(e)
      return "Unknown time"
    }
  }

  const formatIncidentType = (type: string) => {
    if (!type) return "Unknown"
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  // Helper for getting active filters count
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.type) count++
    if (filters.severity) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    return count
  }

  const paginationInfo = `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalIncidents)} of ${totalIncidents} closed incidents`

  return (
    <div className="px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <div className="flex items-center gap-2">
            <Link href="/incidents" passHref>
              <Button variant="ghost" size="sm" className="p-0">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to All Incidents
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <InfoPanel title="Employee Incident History" icon={<UserIcon className="h-5 w-5 text-blue-600" />}>
        <p className="text-sm">
          This page displays all closed incidents associated with this employee.
          {
            ` has ${totalIncidents} closed incident${totalIncidents !== 1 ? "s" : ""} on record.`}
          You can search and filter through the incidents to find specific records.
        </p>
      </InfoPanel>

      {/* Search and Filter Bar */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search incidents..."
            className="pl-8 w-full"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
          {filters.search && (
            <button className="absolute right-2 top-2.5" onClick={() => handleFilterChange("search", "")}>
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && <Badge className="ml-1 bg-red-600">{getActiveFiltersCount()}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white border shadow-md">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Filter Options</h3>
                {getActiveFiltersCount() > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 p-0 h-auto text-xs"
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-filter">Incident Type</Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="injury">Injury</SelectItem>
                    <SelectItem value="near_miss">Near Miss</SelectItem>
                    <SelectItem value="property_damage">Property Damage</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity-filter">Severity</Label>
                <Select value={filters.severity} onValueChange={(value) => handleFilterChange("severity", value)}>
                  <SelectTrigger id="severity-filter">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All severities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date-from" className="text-xs">
                      From
                    </Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filters.dateRange.from || ""}
                      onChange={(e) => handleDateRangeChange("from", e.target.value || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs">
                      To
                    </Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filters.dateRange.to || ""}
                      onChange={(e) => handleDateRangeChange("to", e.target.value || null)}
                    />
                  </div>
                </div>
              </div>

              <Button
                className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => setIsFilterOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredAndSortedIncidents.length === 0 && (
        <Card className="mt-8 border-2 border-dotted border-red-300">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <ArchiveIcon className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Closed Incidents Found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {incidents.length === 0
                  ? `no closed incidents on record.`
                  : "This employee has no closed incidents on record."
                  }
            </p>
            {incidents.length > 0 && filteredAndSortedIncidents.length === 0 && (
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Card View */}
      {!loading && filteredAndSortedIncidents.length > 0 && (
        <div className="mt-8 grid gap-4 md:hidden">
          {filteredAndSortedIncidents.map((incident) => (
            <Card
              key={incident.id}
              className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 bg-white dark:bg-gray-800">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{incident.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                      <User className="h-3 w-3 opacity-50" />
                      {incident.referenceNumber}
                    </p>
                  </div>
                  <Badge
                    className={
                      incident.severityLevel === "critical"
                        ? "bg-red-600 hover:bg-red-700"
                        : incident.severityLevel === "high"
                          ? "bg-orange-500 hover:bg-orange-600"
                          : incident.severityLevel === "medium"
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-green-500 hover:bg-green-600"
                    }
                  >
                    {incident.severityLevel.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-500 dark:text-gray-400 truncate">{incident.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-500 dark:text-gray-400">{getTimeAgo(incident.occurredAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <Badge className="bg-green-600 hover:bg-green-700">CLOSED</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    onClick={() => handleViewIncident(incident)}
                  >
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Desktop Table View */}
      {!loading && filteredAndSortedIncidents.length > 0 && (
        <div className="mt-8 flow-root hidden md:block">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer"
                        onClick={() => handleSort("title")}
                      >
                        <div className="flex items-center gap-1">
                          Incident Details
                          <span className="ml-1">
                            {sortField === "title" ? (
                              sortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        </div>
                      </th>
                      <th
                        className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell cursor-pointer"
                        onClick={() => handleSort("location")}
                      >
                        <div className="flex items-center gap-1">
                          Location
                          <span className="ml-1">
                            {sortField === "location" ? (
                              sortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        </div>
                      </th>
                      <th
                        className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell cursor-pointer"
                        onClick={() => handleSort("type")}
                      >
                        <div className="flex items-center gap-1">
                          Type
                          <span className="ml-1">
                            {sortField === "type" ? (
                              sortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        </div>
                      </th>
                      <th
                        className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => handleSort("severityLevel")}
                      >
                        <div className="flex items-center gap-1">
                          Severity
                          <span className="ml-1">
                            {sortField === "severityLevel" ? (
                              sortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        </div>
                      </th>
                      <th
                        className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell cursor-pointer"
                        onClick={() => handleSort("occurredAt")}
                      >
                        <div className="flex items-center gap-1">
                          Timing
                          <span className="ml-1">
                            {sortField === "occurredAt" ? (
                              sortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )
                            ) : (
                              <ArrowUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        </div>
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {filteredAndSortedIncidents.map((incident) => (
                      <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">{incident.title}</div>
                              <div className="text-gray-500 text-xs flex items-center gap-1">
                                <User className="h-3 w-3 opacity-50" />
                                {incident.referenceNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {incident.location}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm hidden md:table-cell">
                          {formatIncidentType(incident.type)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <Badge
                            className={
                              incident.severityLevel === "critical"
                                ? "bg-red-600 hover:bg-red-700"
                                : incident.severityLevel === "high"
                                  ? "bg-orange-500 hover:bg-orange-600"
                                  : incident.severityLevel === "medium"
                                    ? "bg-yellow-500 hover:bg-yellow-600"
                                    : "bg-green-500 hover:bg-green-600"
                            }
                          >
                            {incident.severityLevel.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            <div>
                              <div>{formatDate(incident.occurredAt)}</div>
                              <div className="text-xs text-gray-500">{getTimeAgo(incident.occurredAt)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:text-red-900 mr-2"
                            onClick={() => handleViewIncident(incident)}
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Incident Slide-over */}
      <Sheet open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto max-h-screen bg-white dark:bg-gray-800">
          <SheetHeader>
            <SheetTitle>Employee Closed Incident Details</SheetTitle>
          </SheetHeader>
          {selectedIncident && <IncidentDetails incident={selectedIncident} />}
        </SheetContent>
      </Sheet>

      {/* Pagination component */}
      <div className="w-full bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-sm text-gray-500">{paginationInfo}</div>
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Page Size Selector */}
          <div className="w-full sm:w-auto">
            <Select value={pageSize.toString()} onValueChange={(value) => handlePageSizeChange(Number(value))}>
              <SelectTrigger className="w-full sm:w-[140px] bg-white border-red-300 focus:ring-red-200">
                <SelectValue placeholder={`${pageSize} entries`} />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} entries
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {/* Pagination Info */}
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-0">
              Page {currentPage} of {totalPages}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

