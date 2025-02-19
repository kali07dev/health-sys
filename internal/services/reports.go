package services

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type ReportService struct {
	db *gorm.DB
}

// ReportType defines the available report types
type ReportType string

const (
	SafetyPerformance   ReportType = "safety_performance"
	IncidentTrends      ReportType = "incident_trends"
	LocationAnalysis    ReportType = "location_analysis"
	ComplianceReport    ReportType = "compliance_report"
	DepartmentSummary   ReportType = "department_summary"
	RiskAssessment      ReportType = "risk_assessment"
	TrainingCompliance  ReportType = "training_compliance"
)

type ReportRequest struct {
	ReportType    ReportType  `json:"reportType"`
	StartDate     time.Time   `json:"startDate"`
	EndDate       time.Time   `json:"endDate"`
	Department    string      `json:"department,omitempty"`
	Location      string      `json:"location,omitempty"`
	EmployeeID    *uuid.UUID  `json:"employeeID,omitempty"`
	Format        string      `json:"format"` // pdf or excel
}

type SafetyPerformanceData struct {
	Period                string  `json:"period"`
	TotalIncidents       int     `json:"totalIncidents"`
	IncidentsByType      map[string]int `json:"incidentsByType"`
	IncidentsBySeverity  map[string]int `json:"incidentsBySeverity"`
	ResolutionRate       float64 `json:"resolutionRate"`
	AverageResponseTime  float64 `json:"averageResponseTime"`
	ComplianceRate       float64 `json:"complianceRate"`
	CriticalFindings     int     `json:"criticalFindings"`
}

type IncidentTrendsData struct {
	CommonHazards        []HazardFrequency    `json:"commonHazards"`
	TrendsByMonth        []MonthlyTrend       `json:"trendsByMonth"`
	RiskPatterns         []RiskPattern        `json:"riskPatterns"`
	RecurringIssues      []RecurringIssue     `json:"recurringIssues"`
}

type ComplianceData struct {
	OverallCompliance    float64              `json:"overallCompliance"`
	ActionsByStatus      map[string]int       `json:"actionsByStatus"`
	OverdueActions       []OverdueAction      `json:"overdueActions"`
	DepartmentCompliance []DepartmentMetrics  `json:"departmentCompliance"`
	ImprovementTrends    []ComplianceTrend    `json:"improvementTrends"`
}

func (s *ReportService) GenerateReport(req ReportRequest) (interface{}, error) {
	switch req.ReportType {
	case SafetyPerformance:
		return s.generateSafetyPerformanceReport(req)
	case IncidentTrends:
		return s.generateIncidentTrendsReport(req)
	case LocationAnalysis:
		return s.generateLocationAnalysisReport(req)
	case ComplianceReport:
		return s.generateComplianceReport(req)
	default:
		return nil, errors.New("unsupported report type")
	}
}

func (s *ReportService) generateSafetyPerformanceReport(req ReportRequest) (*SafetyPerformanceData, error) {
	var query string
	var args []interface{}

	query = `
		WITH incident_metrics AS (
			SELECT 
				COUNT(*) as total_incidents,
				SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_incidents,
				AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_response_time
			FROM incidents
			WHERE occurred_at BETWEEN ? AND ?
	`
	args = append(args, req.StartDate, req.EndDate)

	if req.EmployeeID != nil {
		query += ` AND (reported_by = ? OR assigned_to = ?)`
		args = append(args, req.EmployeeID, req.EmployeeID)
	}

	if req.Department != "" {
		query += ` AND reported_by IN (SELECT id FROM employees WHERE department = ?)`
		args = append(args, req.Department)
	}

	query += `)`

	var data SafetyPerformanceData
	if err := s.db.Raw(query, args...).Scan(&data).Error; err != nil {
		return nil, err
	}

	// Additional metrics calculations...
	return &data, nil
}

func (s *ReportService) generateIncidentTrendsReport(req ReportRequest) (*IncidentTrendsData, error) {
	var data IncidentTrendsData

	// Get common hazards
	hazardsQuery := `
		SELECT 
			type,
			COUNT(*) as frequency,
			AVG(CASE 
				WHEN severity_level = 'critical' THEN 4
				WHEN severity_level = 'high' THEN 3
				WHEN severity_level = 'medium' THEN 2
				ELSE 1
			END) as risk_score
		FROM incidents
		WHERE occurred_at BETWEEN ? AND ?
		GROUP BY type
		ORDER BY frequency DESC, risk_score DESC
		LIMIT 10
	`

	if err := s.db.Raw(hazardsQuery, req.StartDate, req.EndDate).Scan(&data.CommonHazards).Error; err != nil {
		return nil, err
	}

	// Additional trend calculations...
	return &data, nil
}

func (s *ReportService) ExportToExcel(data interface{}, reportType ReportType) (*excelize.File, error) {
	f := excelize.NewFile()
	
	switch reportType {
	case SafetyPerformance:
		return s.exportSafetyPerformance(f, data.(*SafetyPerformanceData))
	case IncidentTrends:
		return s.exportIncidentTrends(f, data.(*IncidentTrendsData))
	default:
		return nil, errors.New("unsupported export type")
	}
}

func (s *ReportService) exportSafetyPerformance(f *excelize.File, data *SafetyPerformanceData) (*excelize.File, error) {
	// Set headers
	headers := []string{"Metric", "Value"}
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue("Sheet1", cell, header)
	}

	// Add data rows
	rows := [][]interface{}{
		{"Total Incidents", data.TotalIncidents},
		{"Resolution Rate", fmt.Sprintf("%.2f%%", data.ResolutionRate)},
		{"Average Response Time", fmt.Sprintf("%.2f hours", data.AverageResponseTime)},
		{"Compliance Rate", fmt.Sprintf("%.2f%%", data.ComplianceRate)},
		{"Critical Findings", data.CriticalFindings},
	}

	for i, row := range rows {
		f.SetCellValue("Sheet1", fmt.Sprintf("A%d", i+2), row[0])
		f.SetCellValue("Sheet1", fmt.Sprintf("B%d", i+2), row[1])
	}

	return f, nil
}