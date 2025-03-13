"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format, formatDistance } from "date-fns";
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
    X
} from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  // CardDescription,
  // CardHeader,
  // CardTitle,
} from "@/components/ui/dashCard";
import type { Incident } from "@/interfaces/incidents";
import IncidentForm from "./IncidentForm";
import IncidentDetails from "./IncidentDetails";
import { toast } from "react-hot-toast";
import InfoPanel from "@/components/ui/InfoPanel";
import { CalendarClock, Plus, FileText } from "lucide-react";

interface IncidentsTableProps {
  incidents: Incident[];
  userRole: string;
}

// Type definitions for sorting and filtering
type SortField = 'title' | 'location' | 'type' | 'severityLevel' | 'status' | 'occurredAt';
type SortDirection = 'asc' | 'desc';
type FilterState = {
  search: string;
  type: string;
  status: string;
  severity: string;
  dateRange: {
    from: string | null;
    to: string | null;
  };
};

export const IncidentsTable = ({ incidents: initialIncidents, userRole }: IncidentsTableProps) => {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading] = useState(false);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('occurredAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Filtering state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    status: '',
    severity: '',
    dateRange: {
      from: null,
      to: null
    }
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleViewIncident = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  const handleCreateSuccess = (newIncident: Incident) => {
    setIncidents([...incidents, newIncident]);
    setIsCreateModalOpen(false);
    toast.success("Incident Successfully Created");
  };

    // Enhanced formatting helpers
    const formatIncidentType = (type: string) => {
        return type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };
    
      const getTimeAgo = (dateString: string) => {
        try {
          return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
        } catch (e) {
            console.log(e)
          return 'Unknown time';
        }
      };
  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter handlers
  const handleFilterChange = (key: keyof FilterState, value: string | { from: string | null; to: string | null }) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDateRangeChange = (key: 'from' | 'to', value: string | null) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [key]: value
      }
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      severity: '',
      dateRange: {
        from: null,
        to: null
      }
    });
  };

  // Apply sorting and filtering
  const filteredAndSortedIncidents = useMemo(() => {
    // First apply filters
    let result = [...incidents];
    
    // Text search across multiple fields
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(incident => 
        incident.referenceNumber.toLowerCase().includes(searchTerm) ||
        incident.title.toLowerCase().includes(searchTerm) ||
        incident.description.toLowerCase().includes(searchTerm) ||
        incident.location.toLowerCase().includes(searchTerm)
      );
    }
    
    // Type filter
    if (filters.type) {
      result = result.filter(incident => incident.type === filters.type);
    }
    
    // Status filter
    if (filters.status) {
      result = result.filter(incident => incident.status === filters.status);
    }
    
    // Severity filter
    if (filters.severity) {
      result = result.filter(incident => incident.severityLevel === filters.severity);
    }
    
    // Date range filter
    if (filters.dateRange.from) {
      const fromDate = new Date(filters.dateRange.from);
      result = result.filter(incident => new Date(incident.occurredAt) >= fromDate);
    }
    
    if (filters.dateRange.to) {
      const toDate = new Date(filters.dateRange.to);
      toDate.setHours(23, 59, 59, 999); // Set to end of day
      result = result.filter(incident => new Date(incident.occurredAt) <= toDate);
    }
    
    // Then sort
    return result.sort((a, b) => {
      let valueA: string | number | undefined;
      let valueB: string | number | undefined;
      
      switch (sortField) {
        case 'title':
          valueA = a.title;
          valueB = b.title;
          break;
        case 'location':
            valueA = a.location;
            valueB = b.location;
            break;
        case 'type':
          valueA = a.type;
          valueB = b.type;
          break;
        case 'severityLevel':
          // Sort by severity level with custom order
          const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          valueA = severityOrder[a.severityLevel as keyof typeof severityOrder];
          valueB = severityOrder[b.severityLevel as keyof typeof severityOrder];
          break;
        case 'status':
          // Sort by status with custom order
          const statusOrder = { new: 1, investigating: 2, action_required: 3, resolved: 4, closed: 5 };
          valueA = statusOrder[a.status as keyof typeof statusOrder];
          valueB = statusOrder[b.status as keyof typeof statusOrder];
          break;
        case 'occurredAt':
          valueA = new Date(a.occurredAt).getTime();
          valueB = new Date(b.occurredAt).getTime();
          break;
        default:
          valueA = a[sortField];
          valueB = b[sortField];
      }
      
      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [incidents, sortField, sortDirection, filters]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      console.log(e)
      return 'Invalid date';
    }
  };

  // Helper for getting active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.type) count++;
    if (filters.status) count++;
    if (filters.severity) count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Incidents</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all incidents in your organization including their reference number, type, severity, and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
            Report New Incident
          </Button>
        </div>
      </div>
      <InfoPanel 
        title="Incident Reporting Tools" 
        icon={<FileText className="h-5 w-5 text-blue-600" />}
      >
        <p>
          This page allows you to create, view, and manage safety incidents. 
          Use the <strong>New Incident</strong> button to report new issues. 
          All incidents require review within 24 hours of submission.
        </p>
        <div className="flex gap-4 mt-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Incident
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white text-blue-700 border-blue-200 hover:bg-blue-50"
          >
            <CalendarClock className="h-4 w-4 mr-1" />
            View Reports
          </Button>
        </div>
      </InfoPanel>
      
      {/* Search and Filter Bar */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search incidents..."
            className="pl-8 w-full"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          {filters.search && (
            <button 
              className="absolute right-2 top-2.5"
              onClick={() => handleFilterChange('search', '')}
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
        
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge className="ml-1 bg-red-600">{getActiveFiltersCount()}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4">
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
                <Select
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="injury">Injury</SelectItem>
                    <SelectItem value="near_miss">Near Miss</SelectItem>
                    <SelectItem value="property_damage">Property Damage</SelectItem>
                    <SelectItem value="environmental">Environmental</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="action_required">Action Required</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="severity-filter">Severity</Label>
                <Select
                  value={filters.severity}
                  onValueChange={(value) => handleFilterChange('severity', value)}
                >
                  <SelectTrigger id="severity-filter">
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All severities</SelectItem>
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
                    <Label htmlFor="date-from" className="text-xs">From</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={filters.dateRange.from || ''}
                      onChange={(e) => handleDateRangeChange('from', e.target.value || null)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="date-to" className="text-xs">To</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={filters.dateRange.to || ''}
                      onChange={(e) => handleDateRangeChange('to', e.target.value || null)}
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
        <Card className="mt-8 border-2 border-dotted border-red-300">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="rounded-full bg-red-100 p-3 mb-4">
              <Search className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Incidents Found</h3>
            <p className="text-gray-500 text-center max-w-md">
              {incidents.length === 0 
                ? "No incidents are currently reported in the system." 
                : "No incidents match your current filter criteria."}
            </p>
            {incidents.length > 0 && filteredAndSortedIncidents.length === 0 && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={clearFilters}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer"
                        onClick={() => handleSort('title')}
                      >
                        <div className="flex items-center gap-1">
                          Incident Details
                          <span className="ml-1">
                            {sortField === 'title' ? (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            ) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell cursor-pointer"
                        onClick={() => handleSort('location')}
                      >
                        <div className="flex items-center gap-1">
                          Location
                          <span className="ml-1">
                            {sortField === 'location' ? (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            ) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden md:table-cell cursor-pointer"
                        onClick={() => handleSort('type')}
                      >
                        <div className="flex items-center gap-1">
                          Type
                          <span className="ml-1">
                            {sortField === 'type' ? (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            ) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer"
                        onClick={() => handleSort('severityLevel')}
                      >
                        <div className="flex items-center gap-1">
                          Severity
                          <span className="ml-1">
                            {sortField === 'severityLevel' ? (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            ) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                          </span>
                        </div>
                      </th>
                      <th 
                        className="whitespace-nowrap px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden lg:table-cell cursor-pointer"
                        onClick={() => handleSort('occurredAt')}
                      >
                        <div className="flex items-center gap-1">
                          Timing
                          <span className="ml-1">
                            {sortField === 'occurredAt' ? (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            ) : <ArrowUpDown className="h-4 w-4 opacity-50" />}
                          </span>
                        </div>
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredAndSortedIncidents.map((incident) => (
                      <tr 
                        key={incident.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            <div>
                              <div className="font-medium text-gray-900">
                                {incident.title}
                              </div>
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
                        <td className="whitespace-nowrap px-3 py-4 text-sm hidden md:table-cell">
                          <Badge
                            className={
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
                            {incident.status.replace('_', ' ').replace(
                              /\w\S*/g,
                              (txt) => txt.charAt(0).toUpperCase() + txt.substr(1)
                            )}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden lg:table-cell">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                            <div>
                              <div>{formatDate(incident.occurredAt)}</div>
                              <div className="text-xs text-gray-500">
                                {getTimeAgo(incident.occurredAt)}
                              </div>
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
                          {userRole !== "employee" && (
                            <Link
                              href={`/incidents/${incident.id}/review`}
                              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-red-600 hover:text-red-900 h-10 px-4 py-2"
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
    )}

      {/* View Incident Slide-over */}
      <Sheet open={!!selectedIncident} onOpenChange={() => setSelectedIncident(null)}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Incident Details</SheetTitle>
          </SheetHeader>
          {selectedIncident && <IncidentDetails incident={selectedIncident} />}
        </SheetContent>
      </Sheet>

      {/* Create Incident Modal */}
      <Sheet open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Report New Incident</SheetTitle>
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
    </div>
  );
};