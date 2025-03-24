package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2/log"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"gorm.io/gorm"
)

type SafetyDashboardService struct {
	db *gorm.DB
}

func NewSafetyDashboardService(db *gorm.DB) *SafetyDashboardService {
	return &SafetyDashboardService{db: db}
}
func (r *SafetyDashboardService) GetEmployeeByUserID(userID uuid.UUID) (*models.Employee, error) {
	var employee models.Employee

	// Query the database for the employee with the given UserID
	result := r.db.Where("user_id = ?", userID).First(&employee)
	if result.Error != nil {
		return nil, result.Error
	}

	// Return the retrieved employee
	return &employee, nil
}

// GetEmployeeDashboard returns incidents and metrics relevant to a specific employee
func (s *SafetyDashboardService) GetEmployeeDashboard(userID uuid.UUID, timeRange string) (*models.DashboardResponse, error) {
	var employee models.Employee
	if err := s.db.First(&employee, "user_id = ?", userID).Error; err != nil {
		return nil, errors.New("employee not found")
	}

	employeeID := employee.ID

	timeFilter := s.getTimeFilter(timeRange)
	log.Info(timeFilter)

	// Get incidents reported by or assigned to the employee
	var incidents []models.Incident
	query := s.db.Where("(reported_by = ? OR assigned_to = ?) AND occurred_at >= ?",
		employeeID, employeeID, timeFilter)

	if err := query.Find(&incidents).Error; err != nil {
		return nil, err
	}

	// Get corrective actions assigned to the employee
	var actions []models.CorrectiveAction
	if err := s.db.Where("assigned_to = ? AND due_date >= ?",
		employeeID, timeFilter).Find(&actions).Error; err != nil {
		return nil, err
	}

	metrics := s.calculateMetrics(incidents)

	return &models.DashboardResponse{
		Incidents:         incidents,
		Metrics:           metrics,
		CorrectiveActions: actions,
	}, nil
}

// GetAdminDashboard returns system-wide safety metrics and incidents
func (s *SafetyDashboardService) GetAdminDashboard(filters models.DashboardFilters) (*models.AdminDashboardResponse, error) {
	timeFilter := s.getTimeFilter(filters.TimeRange)

	query := s.db.Model(&models.Incident{}).Where("occurred_at >= ?", timeFilter)

	// Apply optional filters
	if filters.DepartmentName != "" {
		query = query.Joins("JOIN employees ON incidents.reported_by = employees.id").
			Where("employees.department = ?", filters.DepartmentName)
	}

	if filters.IncidentType != "" {
		query = query.Where("type = ?", filters.IncidentType)
	}

	if filters.SeverityLevel != "" {
		query = query.Where("severity_level = ?", filters.SeverityLevel)
	}

	var incidents []models.Incident
	if err := query.Find(&incidents).Error; err != nil {
		return nil, err
	}

	// Calculate department-wise metrics
	var departmentMetrics []models.DepartmentMetrics
	if err := s.db.Raw(`
		SELECT 
			e.department as department_name,
			COUNT(i.id) as incident_count,
			SUM(CASE WHEN i.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_count,
			SUM(CASE WHEN i.status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as unresolved_count,
			SUM(CASE WHEN i.severity_level = 'critical' THEN 1 ELSE 0 END) as critical_incidents
		FROM incidents i
		JOIN employees e ON i.reported_by = e.id
		WHERE i.occurred_at >= ?
		GROUP BY e.department`, timeFilter).
		Scan(&departmentMetrics).Error; err != nil {
		return nil, err
	}

	// Get top hazards
	// Get top hazards
	var topHazards []models.HazardSummary
	if err := s.db.Raw(`
    SELECT 
        type,
        COUNT(*) as frequency,
        AVG(CASE 
            WHEN severity_level = 'critical' THEN 4
            WHEN severity_level = 'high' THEN 3
            WHEN severity_level = 'medium' THEN 2
            WHEN severity_level = 'low' THEN 1
            ELSE 0
        END) as average_severity,
        MAX(occurred_at) as last_reported_at,
        STRING_AGG(DISTINCT e.department, ',') as affected_departments
    FROM incidents
    JOIN employees e ON incidents.reported_by = e.id
    WHERE incidents.occurred_at >= ?
    GROUP BY type
    ORDER BY frequency DESC
    LIMIT 5`, timeFilter).
		Scan(&topHazards).Error; err != nil {
		return nil, err
	}
	for i := range topHazards {
		if topHazards[i].AffectedDepartments != "" {
			topHazards[i].Departments = strings.Split(topHazards[i].AffectedDepartments, ",")
		} else {
			topHazards[i].Departments = []string{}
		}
	}

	// Get trend analysis
	trendAnalysis, err := s.calculateTrendAnalysis(filters.TimeRange)
	if err != nil {
		return nil, err
	}

	return &models.AdminDashboardResponse{
		SystemMetrics:     s.calculateMetrics(incidents),
		DepartmentMetrics: s.calculateResolutionRate(departmentMetrics),
		RecentIncidents:   incidents,
		TopHazards:        topHazards,
		TrendAnalysis:     trendAnalysis,
	}, nil
}

// calculateTrendAnalysis calculates incident trends over time
func (s *SafetyDashboardService) calculateTrendAnalysis(timeRange string) (models.TrendAnalysis, error) {
	// Determine time period based on the filter
	timePeriod := "monthly" // Default
	if timeRange == "week" {
		timePeriod = "weekly"
	} else if timeRange == "quarter" {
		timePeriod = "quarterly"
	} else if timeRange == "year" {
		timePeriod = "monthly"
	}

	// Get the starting point for our analysis
	startDate := s.getTimeFilter(timeRange)
	now := time.Now()

	// Determine how to split the period
	var intervals []time.Time
	var intervalLabels []string

	switch timePeriod {
	case "weekly":
		// Create weekly intervals
		numWeeks := int(now.Sub(startDate).Hours()/(24*7)) + 1
		for i := 0; i < numWeeks; i++ {
			intervalDate := now.AddDate(0, 0, -7*i)
			intervals = append(intervals, intervalDate)
			intervalLabels = append(intervalLabels, intervalDate.Format("Jan 02"))
		}
	case "monthly":
		// Create monthly intervals
		numMonths := int(now.Sub(startDate).Hours()/(24*30)) + 1
		for i := 0; i < numMonths; i++ {
			intervalDate := now.AddDate(0, -i, 0)
			intervals = append(intervals, intervalDate)
			intervalLabels = append(intervalLabels, intervalDate.Format("Jan 2006"))
		}
	case "quarterly":
		// Create quarterly intervals
		numQuarters := int(now.Sub(startDate).Hours()/(24*30*3)) + 1
		for i := 0; i < numQuarters; i++ {
			intervalDate := now.AddDate(0, -3*i, 0)
			intervals = append(intervals, intervalDate)

			// Format quarter label (e.g., "Q1 2023")
			quarter := (int(intervalDate.Month())-1)/3 + 1
			quarterLabel := fmt.Sprintf("Q%d %d", quarter, intervalDate.Year())
			intervalLabels = append(intervalLabels, quarterLabel)
		}
	}

	// Reverse intervals and labels to have chronological order
	for i, j := 0, len(intervals)-1; i < j; i, j = i+1, j-1 {
		intervals[i], intervals[j] = intervals[j], intervals[i]
		intervalLabels[i], intervalLabels[j] = intervalLabels[j], intervalLabels[i]
	}


	intervals = append(intervals, now.AddDate(0, 0, 1))

	// Initialize trend analysis with time period
	trendAnalysis := models.TrendAnalysis{
		TimePeriod:      timePeriod,
		IncidentTrend:   make([]models.TimeSeriesPoint, 0, len(intervalLabels)),
		ResolutionTrend: make([]models.TimeSeriesPoint, 0, len(intervalLabels)),
		SeverityTrend:   make([]models.TimeSeriesPoint, 0, len(intervalLabels)),
	}

	// For each interval, collect data
	for i := 0; i < len(intervalLabels); i++ {
		startInterval := intervals[i]
		endInterval := intervals[i+1]

		// Ensure the intervals are valid
		if startInterval.IsZero() || endInterval.IsZero() {
			return models.TrendAnalysis{}, errors.New("invalid time interval")
		}

		// Count incidents in this interval
		var incidentCount int64
		var resolvedCount int64
		var criticalCount int64
		var totalSeverity int64

		// Get total incidents
		if err := s.db.Model(&models.Incident{}).
			Where("occurred_at >= ? AND occurred_at < ?", startInterval, endInterval).
			Count(&incidentCount).Error; err != nil {
			return models.TrendAnalysis{}, err
		}

		// Get resolved incidents
		if err := s.db.Model(&models.Incident{}).
			Where("occurred_at >= ? AND occurred_at < ? AND status IN ('resolved', 'closed')",
				startInterval, endInterval).
			Count(&resolvedCount).Error; err != nil {
			return models.TrendAnalysis{}, err
		}

		// Get critical incidents
		if err := s.db.Model(&models.Incident{}).
			Where("occurred_at >= ? AND occurred_at < ?", startInterval, endInterval).
			Count(&totalSeverity).Error; err != nil {
			return models.TrendAnalysis{}, err
		}

		if err := s.db.Model(&models.Incident{}).
			Where("occurred_at >= ? AND occurred_at < ? AND severity_level = 'critical'",
				startInterval, endInterval).
			Count(&criticalCount).Error; err != nil {
			return models.TrendAnalysis{}, err
		}

		// Calculate severity value based on defined severity levels
		var severityValue float64
		if incidentCount > 0 {
			// Query to calculate weighted severity
			var result struct {
				WeightedSeverity float64
			}
			if err := s.db.Raw(`
                SELECT 
                    SUM(CASE 
                        WHEN severity_level = 'critical' THEN 3
                        WHEN severity_level = 'major' THEN 2
                        ELSE 1
                    END) / COUNT(*) as weighted_severity
                FROM incidents
                WHERE occurred_at >= ? AND occurred_at < ?
            `, startInterval, endInterval).Scan(&result).Error; err != nil {
				return models.TrendAnalysis{}, err
			}
			severityValue = result.WeightedSeverity
		}

		// Calculate resolution rate
		resolutionRate := 0.0
		if incidentCount > 0 {
			resolutionRate = float64(resolvedCount) / float64(incidentCount) * 100
		}

		// Add data points to trends
		trendAnalysis.IncidentTrend = append(trendAnalysis.IncidentTrend, models.TimeSeriesPoint{
			Label: intervalLabels[i],
			Timestamp: startInterval, 
			Value:     float64(incidentCount),
		})

		trendAnalysis.ResolutionTrend = append(trendAnalysis.ResolutionTrend, models.TimeSeriesPoint{
			Label: intervalLabels[i],
			Timestamp: startInterval, 
			Value:     resolutionRate,
		})

		trendAnalysis.SeverityTrend = append(trendAnalysis.SeverityTrend, models.TimeSeriesPoint{
			Label: intervalLabels[i],
			Timestamp: startInterval, 
			Value:     severityValue,
		})
	}

	return trendAnalysis, nil
}

func (s *SafetyDashboardService) getTimeFilter(timeRange string) time.Time {
	now := time.Now()
	switch timeRange {
	case "week":
		return now.AddDate(0, 0, -7)
	case "month":
		return now.AddDate(0, -1, 0)
	case "quarter":
		return now.AddDate(0, -3, 0)
	case "year":
		return now.AddDate(-1, 0, 0)
	default:
		return now.AddDate(0, -2, 0) // Default to last month
	}
}

func (s *SafetyDashboardService) calculateMetrics(incidents []models.Incident) models.IncidentMetrics {
	if len(incidents) == 0 {
		return models.IncidentMetrics{
			IncidentsByType:     make(map[string]int),
			IncidentsBySeverity: make(map[string]int),
		}
	}

	total := len(incidents)
	resolved := 0
	critical := 0

	// Initialize maps
	incidentsByType := make(map[string]int)
	incidentsBySeverity := make(map[string]int)

	// For calculating average resolution time
	var totalResolutionTime time.Duration
	resolvedCount := 0

	for _, incident := range incidents {
		// Count resolved and critical incidents
		if incident.Status == "resolved" || incident.Status == "closed" {
			resolved++

			// Calculate resolution time for resolved incidents
			if !incident.ClosedAt.IsZero() {
				resolutionTime := incident.ClosedAt.Sub(incident.CreatedAt)
				totalResolutionTime += resolutionTime
				resolvedCount++
			}
		}
		if incident.SeverityLevel == "critical" {
			critical++
		}

		// Count incidents by type
		incidentsByType[incident.Type]++

		// Count incidents by severity
		incidentsBySeverity[incident.SeverityLevel]++
	}

	// Calculate average resolution time in hours
	var avgResolutionTime float64
	if resolvedCount > 0 {
		avgResolutionTime = totalResolutionTime.Hours() / float64(resolvedCount)
	}

	// Calculate resolution rate, handling division by zero
	var resolutionRate float64
	if total > 0 {
		resolutionRate = float64(resolved) / float64(total) * 100
	}

	return models.IncidentMetrics{
		TotalIncidents:        total,
		ResolvedIncidents:     resolved,
		UnresolvedIncidents:   total - resolved,
		CriticalIncidents:     critical,
		ResolutionRate:        resolutionRate,
		AverageResolutionTime: avgResolutionTime,
		IncidentsByType:       incidentsByType,
		IncidentsBySeverity:   incidentsBySeverity,
	}
}
func (s *SafetyDashboardService) calculateResolutionRate(departmentMetrics []models.DepartmentMetrics) []models.DepartmentMetrics {
	for i := range departmentMetrics {
		// Calculate resolution rate, handling division by zero
		if departmentMetrics[i].IncidentCount > 0 {
			departmentMetrics[i].ResolutionRate = float64(departmentMetrics[i].ResolvedCount) / float64(departmentMetrics[i].IncidentCount) * 100
		} else {
			departmentMetrics[i].ResolutionRate = 0
		}
	}
	return departmentMetrics
}
