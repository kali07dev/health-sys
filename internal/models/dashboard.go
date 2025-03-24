package models

import (
	"time"
)

type DashboardFilters struct {
	TimeRange      string    `query:"timeRange"` // week, month, quarter, year
	DepartmentName string    `query:"department"`
	IncidentType   string    `query:"incidentType"`
	SeverityLevel  string    `query:"severityLevel"`
	StartDate      time.Time `query:"startDate"`
	EndDate        time.Time `query:"endDate"`
}

// DashboardResponse represents the employee dashboard data
type DashboardResponse struct {
	Incidents         []Incident         `json:"incidents"`
	Metrics           IncidentMetrics    `json:"metrics"`
	CorrectiveActions []CorrectiveAction `json:"correctiveActions"`
}

// AdminDashboardResponse represents the admin dashboard data
type AdminDashboardResponse struct {
	SystemMetrics     IncidentMetrics     `json:"systemMetrics"`
	DepartmentMetrics []DepartmentMetrics `json:"departmentMetrics"`
	RecentIncidents   []Incident          `json:"recentIncidents"`
	TopHazards        []HazardSummary     `json:"topHazards"`
	TrendAnalysis     TrendAnalysis       `json:"trendAnalysis"`
}

// IncidentMetrics contains aggregated incident statistics
type IncidentMetrics struct {
	TotalIncidents        int            `json:"totalIncidents"`
	ResolvedIncidents     int            `json:"resolvedIncidents"`
	UnresolvedIncidents   int            `json:"unresolvedIncidents"`
	CriticalIncidents     int            `json:"criticalIncidents"`
	ResolutionRate        float64        `json:"resolutionRate"`
	AverageResolutionTime float64        `json:"averageResolutionTime"`
	IncidentsByType       map[string]int `json:"incidentsByType"`
	IncidentsBySeverity   map[string]int `json:"incidentsBySeverity"`
}

// DepartmentMetrics contains department-specific metrics
type DepartmentMetrics struct {
	DepartmentName    string  `json:"departmentName"`
	IncidentCount     int     `json:"incidentCount"`
	ResolvedCount     int     `json:"resolvedCount"`
	UnresolvedCount   int     `json:"unresolvedCount"`
	ResolutionRate    float64 `json:"resolutionRate"`
	CriticalIncidents int     `json:"criticalIncidents"`
}

// HazardSummary represents summarized hazard information
type HazardSummary struct {
	Type                string    `json:"type"`
	Frequency           int       `json:"frequency"`
	AverageSeverity     float64   `json:"averageSeverity"`
	LastReportedAt      time.Time `json:"lastReportedAt"`
	AffectedDepartments string    `json:"-"`                  
	Departments         []string  `json:"affectedDepartments"` 
}

// TrendAnalysis contains trend-related data
type TrendAnalysis struct {
	TimePeriod      string            `json:"timePeriod"` // weekly, monthly, quarterly
	IncidentTrend   []TimeSeriesPoint `json:"incidentTrend"`
	ResolutionTrend []TimeSeriesPoint `json:"resolutionTrend"`
	SeverityTrend   []TimeSeriesPoint `json:"severityTrend"`
}

// TimeSeriesPoint represents a single point in time series data
type TimeSeriesPoint struct {
	Timestamp time.Time `json:"timestamp"`
	Value     float64   `json:"value"`
	Label     string    `json:"label,omitempty"`
}
