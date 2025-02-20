package services

import (
	"errors"
	"time"

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

// GetEmployeeDashboard returns incidents and metrics relevant to a specific employee
func (s *SafetyDashboardService) GetEmployeeDashboard(employeeID uuid.UUID, timeRange string) (*models.DashboardResponse, error) {
	var employee models.Employee
	if err := s.db.First(&employee, "id = ?", employeeID).Error; err != nil {
		return nil, errors.New("employee not found")
	}

	timeFilter := s.getTimeFilter(timeRange)

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
			SUM(CASE WHEN i.status NOT IN ('resolved', 'closed') THEN 1 ELSE 0 END) as unresolved_count
		FROM incidents i
		JOIN employees e ON i.reported_by = e.id
		WHERE i.occurred_at >= ?
		GROUP BY e.department`, timeFilter).
		Scan(&departmentMetrics).Error; err != nil {
		return nil, err
	}

	return &models.AdminDashboardResponse{
		SystemMetrics:     s.calculateMetrics(incidents),
		DepartmentMetrics: departmentMetrics,
		RecentIncidents:   incidents,
	}, nil
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
		return now.AddDate(0, -1, 0) // Default to last month
	}
}

func (s *SafetyDashboardService) calculateMetrics(incidents []models.Incident) models.IncidentMetrics {
	total := len(incidents)
	resolved := 0
	critical := 0

	for _, incident := range incidents {
		if incident.Status == "resolved" || incident.Status == "closed" {
			resolved++
		}
		if incident.SeverityLevel == "critical" {
			critical++
		}
	}

	return models.IncidentMetrics{
		TotalIncidents:      total,
		ResolvedIncidents:   resolved,
		UnresolvedIncidents: total - resolved,
		CriticalIncidents:   critical,
		ResolutionRate:      float64(resolved) / float64(total) * 100,
	}
}
