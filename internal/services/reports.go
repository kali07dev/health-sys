package services

import (
	"bytes"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type ReportService struct {
	db *gorm.DB
}

// ReportType defines the available report types
type ReportType string

const (
	SafetyPerformance  ReportType = "safety_performance"
	IncidentTrends     ReportType = "incident_trends"
	LocationAnalysis   ReportType = "location_analysis"
	ComplianceReport   ReportType = "compliance_report"
	DepartmentSummary  ReportType = "department_summary"
	RiskAssessment     ReportType = "risk_assessment"
	TrainingCompliance ReportType = "training_compliance"
)

type ReportRequest struct {
	ReportType ReportType `json:"reportType"`
	StartDate  time.Time  `json:"startDate"`
	EndDate    time.Time  `json:"endDate"`
	Department string     `json:"department,omitempty"`
	Location   string     `json:"location,omitempty"`
	EmployeeID *uuid.UUID `json:"employeeID,omitempty"`
	Format     string     `json:"format"` // pdf or excel
}

type SafetyPerformanceData struct {
	Period              string         `json:"period"`
	TotalIncidents      int            `json:"totalIncidents"`
	IncidentsByType     map[string]int `json:"incidentsByType"`
	IncidentsBySeverity map[string]int `json:"incidentsBySeverity"`
	ResolutionRate      float64        `json:"resolutionRate"`
	AverageResponseTime float64        `json:"averageResponseTime"`
	ComplianceRate      float64        `json:"complianceRate"`
	CriticalFindings    int            `json:"criticalFindings"`
}

type IncidentTrendsData struct {
	CommonHazards   []models.HazardFrequency `json:"commonHazards"`
	TrendsByMonth   []models.MonthlyTrend    `json:"trendsByMonth"`
	RiskPatterns    []models.RiskPattern     `json:"riskPatterns"`
	RecurringIssues []models.RecurringIssue  `json:"recurringIssues"`
}

type ComplianceData struct {
	OverallCompliance    float64                    `json:"overallCompliance"`
	ActionsByStatus      map[string]int             `json:"actionsByStatus"`
	OverdueActions       []models.OverdueAction     `json:"overdueActions"`
	DepartmentCompliance []models.DepartmentMetrics `json:"departmentCompliance"`
	ImprovementTrends    []models.ComplianceTrend   `json:"improvementTrends"`
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
	// Get basic metrics using the previous query
	data, err := s.getBasicMetrics(req)
	if err != nil {
		return nil, err
	}

	// Calculate incident types distribution
	incidentTypes, err := s.db.Raw(`
		SELECT type, COUNT(*) as count
		FROM incidents
		WHERE occurred_at BETWEEN ? AND ?
		GROUP BY type
	`, req.StartDate, req.EndDate).Rows()
	if err != nil {
		return nil, err
	}
	defer incidentTypes.Close()

	data.IncidentsByType = make(map[string]int)
	for incidentTypes.Next() {
		var t string
		var count int
		if err := incidentTypes.Scan(&t, &count); err != nil {
			return nil, err
		}
		data.IncidentsByType[t] = count
	}

	// Calculate severity distribution
	if err := s.db.Raw(`
		SELECT 
			severity_level,
			COUNT(*) as count,
			AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_response
		FROM incidents
		WHERE occurred_at BETWEEN ? AND ?
		GROUP BY severity_level
	`, req.StartDate, req.EndDate).
		Scan(&data.IncidentsBySeverity).Error; err != nil {
		return nil, err
	}

	// Calculate compliance rate
	if err := s.db.Raw(`
		SELECT 
			COALESCE(
				(SUM(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 ELSE 0 END)::float / 
				NULLIF(COUNT(*), 0) * 100),
				0
			) as compliance_rate
		FROM corrective_actions
		WHERE created_at BETWEEN ? AND ?
	`, req.StartDate, req.EndDate).
		Scan(&data.ComplianceRate).Error; err != nil {
		return nil, err
	}

	return data, nil
}

func (s *ReportService) getBasicMetrics(req ReportRequest) (*SafetyPerformanceData, error) {
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

	return &data, nil
}

func (s *ReportService) generateIncidentTrendsReport(req ReportRequest) (*IncidentTrendsData, error) {
	data := &IncidentTrendsData{}

	// Get common hazards (previously implemented)
	if err := s.getCommonHazards(req, data); err != nil {
		return nil, err
	}

	// Calculate monthly trends
	if err := s.db.Raw(`
		WITH monthly AS (
			SELECT 
				DATE_TRUNC('month', occurred_at) as month,
				COUNT(*) as incident_count,
				AVG(CASE 
					WHEN severity_level = 'critical' THEN 4
					WHEN severity_level = 'high' THEN 3
					WHEN severity_level = 'medium' THEN 2
					ELSE 1
				END) as severity_score,
				SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_count,
				COUNT(DISTINCT type) as new_hazards
			FROM incidents
			WHERE occurred_at BETWEEN ? AND ?
			GROUP BY DATE_TRUNC('month', occurred_at)
			ORDER BY month
		)
		SELECT * FROM monthly
	`, req.StartDate, req.EndDate).
		Scan(&data.TrendsByMonth).Error; err != nil {
		return nil, err
	}

	// Get risk patterns
	if err := s.db.Raw(`
		WITH risk_data AS (
			SELECT 
				type as category,
				COUNT(*) as frequency,
				MODE() WITHIN GROUP (ORDER BY severity_level) as severity,
				array_agg(DISTINCT department) as departments,
				array_agg(DISTINCT root_cause) as root_causes
			FROM incidents i
			JOIN investigations inv ON i.id = inv.incident_id
			JOIN employees e ON i.reported_by = e.id
			WHERE i.occurred_at BETWEEN ? AND ?
			GROUP BY type
			HAVING COUNT(*) > 1
			ORDER BY frequency DESC
			LIMIT 10
		)
		SELECT * FROM risk_data
	`, req.StartDate, req.EndDate).
		Scan(&data.RiskPatterns).Error; err != nil {
		return nil, err
	}

	// Get recurring issues
	if err := s.db.Raw(`
		SELECT 
			description,
			COUNT(*) as frequency,
			MAX(occurred_at) as last_occurred,
			MODE() WITHIN GROUP (ORDER BY status) as status,
			MODE() WITHIN GROUP (ORDER BY severity_level) as priority,
			array_agg(DISTINCT location) as locations
		FROM incidents
		WHERE occurred_at BETWEEN ? AND ?
		GROUP BY description
		HAVING COUNT(*) > 1
		ORDER BY frequency DESC
		LIMIT 10
	`, req.StartDate, req.EndDate).
		Scan(&data.RecurringIssues).Error; err != nil {
		return nil, err
	}

	return data, nil
}

func (s *ReportService) getCommonHazards(req ReportRequest, data *IncidentTrendsData) error {
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
		return err
	}

	return nil
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

func (s *ReportService) generateLocationAnalysisReport(req ReportRequest) (*LocationAnalysisData, error) {
    data := &LocationAnalysisData{}

    // Query to get location summaries with risk scores and incident counts
    query := `
        WITH location_metrics AS (
            SELECT 
                location,
                COUNT(*) as incident_count,
                AVG(CASE 
                    WHEN severity_level = 'critical' THEN 4
                    WHEN severity_level = 'high' THEN 3
                    WHEN severity_level = 'medium' THEN 2
                    ELSE 1
                END) as risk_score,
                array_agg(DISTINCT type) as hazard_types,
                MAX(occurred_at) as last_incident
            FROM incidents
            WHERE occurred_at BETWEEN ? AND ?
    `
    args := []interface{}{req.StartDate, req.EndDate}

    if req.Department != "" {
        query += ` AND reported_by IN (SELECT id FROM employees WHERE department = ?)`
        args = append(args, req.Department)
    }

    query += `
            GROUP BY location
            ORDER BY incident_count DESC, risk_score DESC
        )
        SELECT * FROM location_metrics
    `

    if err := s.db.Raw(query, args...).Scan(&data.LocationSummaries).Error; err != nil {
        return nil, err
    }

    return data, nil
}

func (s *ReportService) generateComplianceReport(req ReportRequest) (*ComplianceData, error) {
    data := &ComplianceData{
        ActionsByStatus: make(map[string]int),
    }

    // Calculate overall compliance rate
    if err := s.db.Raw(`
        SELECT 
            COALESCE(
                (SUM(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 ELSE 0 END)::float / 
                NULLIF(COUNT(*), 0) * 100),
                0
            ) as overall_compliance
        FROM corrective_actions
        WHERE created_at BETWEEN ? AND ?
    `, req.StartDate, req.EndDate).
        Scan(&data.OverallCompliance).Error; err != nil {
        return nil, err
    }

    // Get actions by status
    statusQuery := `
        SELECT 
            status,
            COUNT(*) as count
        FROM corrective_actions
        WHERE created_at BETWEEN ? AND ?
        GROUP BY status
    `
    rows, err := s.db.Raw(statusQuery, req.StartDate, req.EndDate).Rows()
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    for rows.Next() {
        var status string
        var count int
        if err := rows.Scan(&status, &count); err != nil {
            return nil, err
        }
        data.ActionsByStatus[status] = count
    }

    // Get overdue actions
    if err := s.db.Raw(`
        SELECT 
            id,
            description,
            due_date,
            priority,
            responsible_party,
            EXTRACT(DAY FROM (NOW() - due_date)) as days_overdue
        FROM corrective_actions
        WHERE 
            status != 'completed' 
            AND due_date < NOW()
            AND created_at BETWEEN ? AND ?
        ORDER BY due_date ASC
    `, req.StartDate, req.EndDate).
        Scan(&data.OverdueActions).Error; err != nil {
        return nil, err
    }

    // Get department compliance metrics
    if err := s.db.Raw(`
        WITH dept_metrics AS (
            SELECT 
                e.department,
                COUNT(ca.id) as total_actions,
                SUM(CASE WHEN ca.status = 'completed' AND ca.completed_at <= ca.due_date THEN 1 ELSE 0 END) as completed_on_time,
                AVG(CASE WHEN ca.status = 'completed' THEN 
                    EXTRACT(EPOCH FROM (ca.completed_at - ca.created_at))/86400 
                    ELSE NULL 
                END) as avg_completion_days
            FROM corrective_actions ca
            JOIN employees e ON ca.responsible_party = e.id
            WHERE ca.created_at BETWEEN ? AND ?
            GROUP BY e.department
        )
        SELECT 
            department,
            total_actions,
            completed_on_time,
            COALESCE((completed_on_time::float / NULLIF(total_actions, 0) * 100), 0) as compliance_rate,
            COALESCE(avg_completion_days, 0) as avg_completion_days
        FROM dept_metrics
        ORDER BY compliance_rate DESC
    `, req.StartDate, req.EndDate).
        Scan(&data.DepartmentCompliance).Error; err != nil {
        return nil, err
    }

    // Get compliance improvement trends
    if err := s.db.Raw(`
        WITH monthly_compliance AS (
            SELECT 
                DATE_TRUNC('month', created_at) as month,
                COUNT(*) as total_actions,
                SUM(CASE WHEN status = 'completed' AND completed_at <= due_date THEN 1 ELSE 0 END) as completed_on_time
            FROM corrective_actions
            WHERE created_at BETWEEN ? AND ?
            GROUP BY DATE_TRUNC('month', created_at)
            ORDER BY month
        )
        SELECT 
            month,
            total_actions,
            completed_on_time,
            COALESCE((completed_on_time::float / NULLIF(total_actions, 0) * 100), 0) as compliance_rate
        FROM monthly_compliance
    `, req.StartDate, req.EndDate).
        Scan(&data.ImprovementTrends).Error; err != nil {
        return nil, err
    }

    return data, nil
}


// Location analysis implementation
type LocationSummary struct {
	Location      string    `json:"location"`
	IncidentCount int       `json:"incidentCount"`
	RiskScore     float64   `json:"riskScore"`
	HazardTypes   []string  `json:"hazardTypes"`
	LastIncident  time.Time `json:"lastIncident"`
}

type LocationAnalysisData struct {
	LocationSummaries []LocationSummary `json:"locationSummaries"`
}

func (s *ReportService) exportIncidentTrends(f *excelize.File, data *IncidentTrendsData) (*excelize.File, error) {
	// Common Hazards Sheet
	f.SetSheetName("Sheet1", "Common Hazards")
	headers := []string{"Hazard Type", "Frequency", "Risk Score", "Trend Change", "Top Locations"}
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue("Common Hazards", cell, header)
	}

	for i, hazard := range data.CommonHazards {
		row := i + 2
		f.SetCellValue("Common Hazards", fmt.Sprintf("A%d", row), hazard.Type)
		f.SetCellValue("Common Hazards", fmt.Sprintf("B%d", row), hazard.Frequency)
		f.SetCellValue("Common Hazards", fmt.Sprintf("C%d", row), hazard.RiskScore)
		f.SetCellValue("Common Hazards", fmt.Sprintf("D%d", row), fmt.Sprintf("%.2f%%", hazard.TrendChange))
		f.SetCellValue("Common Hazards", fmt.Sprintf("E%d", row), strings.Join(hazard.TopLocations, ", "))
	}

	// Monthly Trends Sheet
	f.NewSheet("Monthly Trends")
	monthlyHeaders := []string{"Month", "Incidents", "Severity Score", "Resolved", "New Hazards"}
	for i, header := range monthlyHeaders {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue("Monthly Trends", cell, header)
	}

	for i, trend := range data.TrendsByMonth {
		row := i + 2
		f.SetCellValue("Monthly Trends", fmt.Sprintf("A%d", row), trend.Month.Format("Jan 2006"))
		f.SetCellValue("Monthly Trends", fmt.Sprintf("B%d", row), trend.IncidentCount)
		f.SetCellValue("Monthly Trends", fmt.Sprintf("C%d", row), trend.SeverityScore)
		f.SetCellValue("Monthly Trends", fmt.Sprintf("D%d", row), trend.ResolvedCount)
		f.SetCellValue("Monthly Trends", fmt.Sprintf("E%d", row), trend.NewHazards)
	}

	return f, nil
}

func (s *ReportService) ExportToPDF(data interface{}, reportType ReportType) (*bytes.Buffer, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)

	switch reportType {
	case SafetyPerformance:
		return s.exportSafetyPerformancePDF(pdf, data.(*SafetyPerformanceData))
	case IncidentTrends:
		return s.exportIncidentTrendsPDF(pdf, data.(*IncidentTrendsData))
	default:
		return nil, errors.New("unsupported export type")
	}
}

func (s *ReportService) exportSafetyPerformancePDF(pdf *gofpdf.Pdf, data *SafetyPerformanceData) (*bytes.Buffer, error) {
	// Header
	pdf.Cell(190, 10, "Safety Performance Report")
	pdf.Ln(15)

	// Summary Section
	pdf.SetFont("Arial", "B", 12)
	pdf.Cell(190, 10, "Summary Metrics")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 10)
	metrics := []struct {
		label string
		value string
	}{
		{"Total Incidents", fmt.Sprintf("%d", data.TotalIncidents)},
		{"Resolution Rate", fmt.Sprintf("%.2f%%", data.ResolutionRate)},
		{"Compliance Rate", fmt.Sprintf("%.2f%%", data.ComplianceRate)},
		{"Critical Findings", fmt.Sprintf("%d", data.CriticalFindings)},
	}

	for _, m := range metrics {
		pdf.Cell(95, 8, m.label)
		pdf.Cell(95, 8, m.value)
		pdf.Ln(8)
	}

	// Create buffer and write PDF
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return &buf, nil
}
