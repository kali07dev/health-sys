"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { format, formatDistance } from "date-fns"
import { Loader2, ChevronUp, ChevronDown, Search, Filter, ArrowUpDown, Calendar, MapPin, User, X } from "lucide-react"
// import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Card,
  CardContent,
  // CardDescription,
  // CardHeader,
  // CardTitle,
} from "@/components/ui/dashCard"
import type { Incident } from "@/interfaces/incidents"
import IncidentForm from "./IncidentForm"
import IncidentDetails from "./IncidentDetails"
import { toast } from "react-hot-toast"
import InfoPanel from "@/components/ui/InfoPanel"
import { CalendarClock, Plus, FileText } from "lucide-react"
import { incidentAPI } from "@/utils/api"

interface IncidentsTableProps {
  initialIncidents: Incident[]
  userRole: string
  totalIncidents: number
  initialPage: number
  totalPages: number
  pageSize: number
}

// Type definitions for sorting and filtering
type SortField = "title" | "location" | "type" | "severityLevel" | "status" | "occurredAt"
type SortDirection = "asc" | "desc"
type FilterState = {
  search: string
  type: string
  status: string
  severity: string
  dateRange: {
    from: string | null
    to: string | null
  }
}

export const IncidentsTable = ({
  initialIncidents,
  userRole,
  totalIncidents,
  initialPage,
  totalPages: initialTotalPages,
  pageSize: initialPageSize,
}: IncidentsTableProps) => {
  // const [incidents] = useState<Incident[]>(initialIncidents)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  // const [loading] = useState(false)

  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)

  // Fetch incidents when page or page size changes
  const fetchIncidents = async (page: number, pageSize: number) => {
    setLoading(true)
    try {
      const response = await incidentAPI.getAllIncidentsFiltered({ page, pageSize })
      setIncidents(response.data)
      setCurrentPage(response.page)
      setTotalPages(response.totalPages)
      setPageSize(response.pageSize)
    } catch {
      toast.error("Failed to load incidents")
    } finally {
      setLoading(false)
    }
  }

  // Page change handler
  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage) {
      fetchIncidents(newPage, pageSize)
    }
  }

  // Page size change handler
  const handlePageSizeChange = (newPageSize: number) => {
    fetchIncidents(1, newPageSize) // Reset to first page
  }
  const paginationInfo = `Showing ${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalIncidents)} of ${totalIncidents} incidents`


  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>("occurredAt")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Filtering state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "",
    status: "",
    severity: "",
    dateRange: {
      from: null,
      to: null,
    },
  })
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident)
  }

  const handleCreateSuccess = (newIncident: Incident) => {
    console.log(newIncident)
    toast.success("Incident Successfully Created")
    window.location.reload()

    // setIncidents([...incidents, newIncident]);
    // setIsCreateModalOpen(false);
    // toast.success("Incident Successfully Created");
  }

  // Enhanced formatting helpers
  const formatIncidentType = (type: string) => {
    if (!type) return "Unknown" // Handle undefined or null type
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), { addSuffix: true })
    } catch (e) {
      console.log(e)
      return "Unknown time"
    }
  }
  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Filter handlers
  const handleFilterChange = (key: keyof FilterState, value: string | { from: string | null; to: string | null }) => {
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
      status: "",
      severity: "",
      dateRange: {
        from: null,
        to: null,
      },
    })
  }

  // Apply sorting and filtering
  const filteredAndSortedIncidents = useMemo(() => {
    // First apply filters
    let result = [...incidents]

    // Text search across multiple fields
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      result = result.filter(
        (incident) =>
          incident.referenceNumber.toLowerCase().includes(searchTerm) ||
          incident.title.toLowerCase().includes(searchTerm) ||
          incident.description.toLowerCase().includes(searchTerm) ||
          incident.location.toLowerCase().includes(searchTerm),
      )
    }

    // Type filter
    if (filters.type) {
      result = result.filter((incident) => incident.type === filters.type)
    }

    // Status filter
    if (filters.status) {
      result = result.filter((incident) => incident.status === filters.status)
    }

    // Severity filter
    if (filters.severity) {
      result = result.filter((incident) => incident.severityLevel === filters.severity)
    }

    // Date range filter
    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from)
      result = result.filter((incident) => new Date(incident.occurredAt) >= fromDate)
    }

    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to)
      toDate.setHours(23, 59, 59, 999) // Set to end of day
      result = result.filter((incident) => new Date(incident.occurredAt) <= toDate)
    }

    // Then sort
    return result.sort((a, b) => {
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
          // Sort by status with custom order
          const statusOrder = { new: 1, investigating: 2, action_required: 3, resolved: 4, closed: 5 }
          valueA = statusOrder[a.status as keyof typeof statusOrder]
          valueB = statusOrder[b.status as keyof typeof statusOrder]
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
  }, [incidents, sortField, sortDirection, filters])

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy h:mm a")
    } catch (e) {
      console.log(e)
      return "Invalid date"
    }
  }

  // Helper for getting active filters count
  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.type) count++
    if (filters.status) count++
    if (filters.severity) count++
    if (filters.dateRange.from || filters.dateRange.to) count++
    return count
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Incidents</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            A list of all incidents in your organization including their reference number, type, severity, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-0 sm:flex-none flex gap-2">
          <Link href="/incidents/closed" passHref>
          <Button
          variant="outline"
          className="w-full text-sm sm:text-base border-red-300 text-red-600 dark:text-red-400 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 px-2 sm:px-4"
        >
              View Closed Incidents
            </Button>
          </Link>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            Report New Incident
          </Button>
        </div>
      </div>
      <InfoPanel title="Incident Reporting Tools" icon={<FileText className="h-5 w-5 text-red-600" />}>
        <p className="text-sm">
          This page allows you to create, view, and manage safety incidents. Use the <strong>New Incident</strong>{" "}
          button to report new issues. All incidents require review within 24 hours of submission.
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-red-700 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-800/50 dark:bg-gray-700"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Incident
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white text-red-700 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-800/50 dark:bg-gray-700"
          >
            <CalendarClock className="h-4 w-4 mr-1" />
            View Reports
          </Button>
        </div>
      </InfoPanel>

      {/* Search and Filter Bar */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search incidents..."
            className="pl-8 w-full dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:border-gray-600"
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
          {filters.search && (
            <button className="absolute right-2 top-2.5" onClick={() => handleFilterChange("search", "")}>
              <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>

        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700">
              <Filter className="h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && <Badge className="ml-1 bg-red-600">{getActiveFiltersCount()}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-md">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Filter Options</h3>
                {getActiveFiltersCount() > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-0 h-auto text-xs"
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-filter" className="text-gray-700 dark:text-gray-300">Incident Type</Label>
                <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                  <SelectTrigger id="type-filter" className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    <SelectItem value="all" className="dark:text-gray-200">All types</SelectItem>
                    <SelectItem value="injury" className="dark:text-gray-200">Injury</SelectItem>
                    <SelectItem value="near_miss" className="dark:text-gray-200">Near Miss</SelectItem>
                    <SelectItem value="property_damage" className="dark:text-gray-200">Property Damage</SelectItem>
                    <SelectItem value="environmental" className="dark:text-gray-200">Environmental</SelectItem>
                    <SelectItem value="security" className="dark:text-gray-200">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter" className="text-gray-700 dark:text-gray-300">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger id="status-filter" className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    <SelectItem value="all" className="dark:text-gray-200">All statuses</SelectItem>
                    <SelectItem value="new" className="dark:text-gray-200">New</SelectItem>
                    <SelectItem value="investigating" className="dark:text-gray-200">Investigating</SelectItem>
                    <SelectItem value="action_required" className="dark:text-gray-200">Action Required</SelectItem>
                    <SelectItem value="resolved" className="dark:text-gray-200">Resolved</SelectItem>
                    <SelectItem value="closed" className="dark:text-gray-200">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity-filter" className="text-gray-700 dark:text-gray-300">Severity</Label>
                <Select value={filters.severity} onValueChange={(value) => handleFilterChange("severity", value)}>
                  <SelectTrigger id="severity-filter" className="dark:bg-gray-700 dark:text-white dark:border-gray-600">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700">
                    <SelectItem value="all" className="dark:text-gray-200">All severities</SelectItem>
                    <SelectItem value="low" className="dark:text-gray-200">Low</SelectItem>
                    <SelectItem value="medium" className="dark:text-gray-200">Medium</SelectItem>
                    <SelectItem value="high" className="dark:text-gray-200">High</SelectItem>
                    <SelectItem value="critical" className="dark:text-gray-200">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-gray-300">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="date-from" className="text-xs text-gray-700 dark:text-gray-400">
                      From
                    </Label>
                    <Input
                      id="date-from"
                      type="date"
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      value={filters.dateRange.from || ""}
                      onChange={(e) => handleDateRangeChange("from", e.target.value || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs text-gray-700 dark:text-gray-400">
                      To
                    </Label>
                    <Input
                      id="date-to"
                      type="date"
                      className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
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

      {/* Check if filtered incidents array is empty */}
      {filteredAndSortedIncidents.length === 0 ? (
        <Card className="mt-8 border-2 border-dotted border-red-300 dark:bg-gray-800 dark:border-red-700/50">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <Search className="h-8 w-8 text-red-600 dark:text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Incidents Found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
              {incidents.length === 0
                ? "No incidents are currently reported in the system."
                : "No incidents match your current filter criteria."}
            </p>
            {incidents.length > 0 && filteredAndSortedIncidents.length === 0 && (
              <Button variant="outline" className="mt-4 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700" onClick={clearFilters}>
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="mt-8 grid gap-4 md:hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-gray-700 dark:text-white" />
            </div>
          )}
            {filteredAndSortedIncidents.map((incident) => (
              <Card
                key={incident.id}
                className="overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{incident.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                        <User className="h-3 w-3 opacity-50" />
                        {incident.userIncidentID? incident.userIncidentID :  incident.referenceNumber}
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
                      } // Text inside these badges is typically white due to dark bg
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
                    <Badge
                      className={ // Text inside these badges is typically white due to dark bg
                        incident.status === "new"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : incident.status === "investigating"
                            ? "bg-purple-600 hover:bg-purple-700"
                            : incident.status === "action_required"
                              ? "bg-red-600 hover:bg-red-700"
                              : incident.status === "resolved"
                                ? "bg-yellow-500 hover:bg-yellow-600"
                                : "bg-green-600 hover:bg-green-700"
                      }
                    >
                      {incident.status
                        .replace("_", " ")
                        .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1))}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        onClick={() => handleViewIncident(incident)}
                      >
                        View
                      </Button>
                      {userRole !== "employee" && (
                        <Link
                          href={`/incidents/${incident.id}/review`}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 h-8 px-3 py-1"
                        >
                          Review
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                          <div className="flex items-center gap-1 text-gray-900 dark:text-white">
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
                          <div className="flex items-center gap-1 text-gray-900 dark:text-white">
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
                          <div className="flex items-center gap-1 text-gray-900 dark:text-white">
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
                          <div className="flex items-center gap-1 text-gray-900 dark:text-white">
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
                          className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                          onClick={() => handleSort("status")}
                        >
                          <div className="flex items-center gap-1 text-gray-900 dark:text-white">
                            Status
                            <span className="ml-1">
                              {sortField === "status" ? (
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
                          <div className="flex items-center gap-1 text-gray-900 dark:text-white">
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
                        <tr key={incident.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{incident.title}</div>
                                <div className="text-gray-500 dark:text-gray-300 text-xs flex items-center gap-1">
                                  <User className="h-3 w-3 opacity-50" />
                                  {incident.userIncidentID? incident.userIncidentID :  incident.referenceNumber}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300 hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-400" />
                              {incident.location}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-300 hidden md:table-cell">
                            {formatIncidentType(incident.type)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <Badge
                              className={ // Text inside these badges is typically white due to dark bg
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
                          <td className="whitespace-nowrap px-3 py-4 text-sm hidden md:table-cell">
                            <Badge
                              className={ // Text inside these badges is typically white due to dark bg
                                incident.status === "new"
                                  ? "bg-blue-600 hover:bg-blue-700"
                                  : incident.status === "investigating"
                                    ? "bg-purple-600 hover:bg-purple-700"
                                    : incident.status === "action_required"
                                      ? "bg-red-600 hover:bg-red-700"
                                      : incident.status === "resolved"
                                        ? "bg-yellow-500 hover:bg-yellow-600"
                                        : "bg-green-600 hover:bg-green-700"
                              }
                            >
                              {incident.status
                                .replace("_", " ")
                                .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1))}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-300 hidden lg:table-cell">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-400" />
                              <div>
                                <div>{formatDate(incident.occurredAt)}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{getTimeAgo(incident.occurredAt)}</div>
                              </div>
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <Button
                              variant="ghost"
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 mr-2"
                              onClick={() => handleViewIncident(incident)}
                            >
                              View
                            </Button>
                            {userRole !== "employee" && (
                              <Link
                                href={`/incidents/${incident.id}/review`}
                                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 h-10 px-4 py-2"
                              >
                                Review
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Incident Slide-over */}
      <Sheet open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto max-h-screen bg-white dark:bg-gray-800">
          <SheetHeader>
            <SheetTitle className="text-gray-900 dark:text-white">Incident Details</SheetTitle>
          </SheetHeader>
          {selectedIncident && <IncidentDetails incident={selectedIncident} />}
        </SheetContent>
      </Sheet>

      {/* Create Incident Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent className="w-full sm:max-w-xl bg-white dark:bg-gray-800">
          <SheetHeader>
            <SheetTitle className="text-gray-900 dark:text-white">Report New Incident</SheetTitle>
          </SheetHeader>
          <IncidentForm onSuccess={handleCreateSuccess} />
        </SheetContent>
      </Sheet>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {/* Pagination component */}
      <div className="w-full bg-gray-50 dark:bg-gray-900 p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {paginationInfo}
              </div>
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Page Size Selector */}
          <div className="w-full sm:w-auto">
            <Select 
              value={pageSize.toString()} 
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-full sm:w-[140px] bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 border-red-300 focus:ring-red-200">
                <SelectValue placeholder={`${pageSize} entries`} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()} className="dark:text-gray-200">
                    {size} entries
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-0">
              Page {currentPage} of {totalPages}
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-full sm:w-auto border-red-300 text-red-600 dark:text-red-400 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-full sm:w-auto border-red-300 text-red-600 dark:text-red-400 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 disabled:opacity-50"
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

