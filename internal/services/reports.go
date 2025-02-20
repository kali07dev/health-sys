package services

import (
	"bytes"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type ReportService struct {
	db *gorm.DB
}

func NewReportService(db *gorm.DB) *ReportService {
	return &ReportService{db: db}
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
	severityRows, err := s.db.Raw(`
        SELECT 
            severity_level,
            COUNT(*) as count,
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600) as avg_response
        FROM incidents
        WHERE occurred_at BETWEEN ? AND ?
        GROUP BY severity_level
    `, req.StartDate, req.EndDate).Rows()
	if err != nil {
		return nil, err
	}
	defer severityRows.Close()

	data.IncidentsBySeverity = make(map[string]int)
	for severityRows.Next() {
		var severityLevel string
		var count int
		var avgResponse float64
		if err := severityRows.Scan(&severityLevel, &count, &avgResponse); err != nil {
			return nil, err
		}
		data.IncidentsBySeverity[severityLevel] = count
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

	query += `
        )
        SELECT * FROM incident_metrics
    `

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
	case LocationAnalysis:
		return s.exportLocationAnalysis(f, data.(*LocationAnalysisData))
	case ComplianceReport:
		return s.exportComplianceReport(f, data.(*ComplianceData))
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

// Location analysis implementation
type LocationSummary struct {
	Location      string    `json:"location" gorm:"column:location"`
	IncidentCount int       `json:"incidentCount" gorm:"column:incident_count"`
	RiskScore     float64   `json:"riskScore" gorm:"column:risk_score"`
	HazardTypes   []string  `json:"hazardTypes" gorm:"column:hazard_types;type:text[]"`
	LastIncident  time.Time `json:"lastIncident" gorm:"column:last_incident"`
}

type LocationAnalysisData struct {
	LocationSummaries []LocationSummary `json:"locationSummaries"`
}

func (s *ReportService) generateLocationAnalysisReport(req ReportRequest) (*LocationAnalysisData, error) {
	data := &LocationAnalysisData{
		LocationSummaries: make([]LocationSummary, 0),
	}

	// Query to get location summaries with risk scores and incident counts
	query := `
        WITH location_metrics AS (
            SELECT 
                location,
                COUNT(*) as incident_count,
                ROUND(AVG(CASE 
                    WHEN severity_level = 'critical' THEN 4
                    WHEN severity_level = 'high' THEN 3
                    WHEN severity_level = 'medium' THEN 2
                    ELSE 1
                END)::numeric, 2) as risk_score,
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
        SELECT location, incident_count, risk_score, hazard_types, last_incident 
        FROM location_metrics
    `

	rows, err := s.db.Raw(query, args...).Rows()
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var summary LocationSummary
		var hazardTypesArray []byte // for scanning array

		err := rows.Scan(
			&summary.Location,
			&summary.IncidentCount,
			&summary.RiskScore,
			&hazardTypesArray,
			&summary.LastIncident,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		// Parse the text array format into string slice
		hazardTypesStr := string(hazardTypesArray)
		// Remove the curly braces and split by comma
		hazardTypesStr = strings.Trim(hazardTypesStr, "{}")
		if hazardTypesStr != "" {
			summary.HazardTypes = strings.Split(hazardTypesStr, ",")
		} else {
			summary.HazardTypes = make([]string, 0)
		}

		data.LocationSummaries = append(data.LocationSummaries, summary)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return data, nil
}

func (s *ReportService) generateComplianceReport(req ReportRequest) (*ComplianceData, error) {
	data := &ComplianceData{
		ActionsByStatus: make(map[string]int),
	}

	// Calculate overall compliance rate - no changes needed here
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

	// Get actions by status - no changes needed here
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

	// Get overdue actions - fixed column names and added joins
	if err := s.db.Raw(`
        SELECT 
            ca.id,
            ca.description,
            ca.due_date,
            ca.priority,
            e.name as assigned_to,
            e.department,
            EXTRACT(DAY FROM (NOW() - ca.due_date)) as days_overdue
        FROM corrective_actions ca
        JOIN employees e ON ca.assigned_to = e.id
        WHERE 
            ca.status != 'completed' 
            AND ca.due_date < NOW()
            AND ca.created_at BETWEEN ? AND ?
        ORDER BY ca.due_date ASC
    `, req.StartDate, req.EndDate).
		Scan(&data.OverdueActions).Error; err != nil {
		return nil, err
	}

	// Get department compliance metrics - fixed join condition
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
            JOIN employees e ON ca.assigned_to = e.id
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

	// Get compliance improvement trends - no changes needed here
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
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)

	switch reportType {
	case SafetyPerformance:
		return s.exportSafetyPerformancePDF(pdf, data.(*SafetyPerformanceData))
	case IncidentTrends:
		return s.exportIncidentTrendsPDF(pdf, data.(*IncidentTrendsData))
	case LocationAnalysis:
		return s.exportLocationAnalysisPDF(pdf, data.(*LocationAnalysisData))
	case ComplianceReport:
		return s.exportComplianceReportPDF(pdf, data.(*ComplianceData))
	default:
		return nil, errors.New("unsupported export type")
	}
}
func (s *ReportService) exportComplianceReportPDF(pdf *fpdf.Fpdf, data *ComplianceData) (*bytes.Buffer, error) {
	// Title
	pdf.CellFormat(190, 10, "Compliance Report", "", 1, "C", false, 0, "")
	pdf.Ln(10)

	// Overall Compliance
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, fmt.Sprintf("Overall Compliance Rate: %.2f%%", data.OverallCompliance), "", 1, "L", false, 0, "")
	pdf.Ln(5)

	// Status Breakdown
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, "Actions by Status", "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)
	for status, count := range data.ActionsByStatus {
		pdf.CellFormat(95, 8, status, "", 0, "L", false, 0, "")
		pdf.CellFormat(95, 8, fmt.Sprintf("%d", count), "", 1, "L", false, 0, "")
	}
	pdf.Ln(10)

	// Overdue Actions
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, "Overdue Actions", "", 1, "L", false, 0, "")
	pdf.SetFont("Arial", "", 10)

	headers := []string{"Description", "Due Date", "Days Overdue", "Priority"}
	widths := []float64{80, 30, 30, 30}

	// Headers
	for i, header := range headers {
		pdf.CellFormat(widths[i], 8, header, "1", 0, "C", false, 0, "")
	}
	pdf.Ln(-1)

	// Data
	for _, action := range data.OverdueActions {
		pdf.CellFormat(widths[0], 8, action.Description, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[1], 8, action.DueDate.Format("2006-01-02"), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[2], 8, fmt.Sprintf("%d", action.DaysOverdue), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[3], 8, action.Priority, "1", 1, "C", false, 0, "")
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}

	return &buf, nil
}
func (s *ReportService) exportLocationAnalysis(f *excelize.File, data *LocationAnalysisData) (*excelize.File, error) {
	// Rename default sheet
	f.SetSheetName("Sheet1", "Location Analysis")

	// Set headers
	headers := []string{"Location", "Incident Count", "Risk Score", "Hazard Types", "Last Incident"}
	for i, header := range headers {
		cell := fmt.Sprintf("%s1", string(rune('A'+i)))
		f.SetCellValue("Location Analysis", cell, header)
	}

	// Add data rows
	for i, summary := range data.LocationSummaries {
		row := i + 2
		f.SetCellValue("Location Analysis", fmt.Sprintf("A%d", row), summary.Location)
		f.SetCellValue("Location Analysis", fmt.Sprintf("B%d", row), summary.IncidentCount)
		f.SetCellValue("Location Analysis", fmt.Sprintf("C%d", row), summary.RiskScore)
		f.SetCellValue("Location Analysis", fmt.Sprintf("D%d", row), strings.Join(summary.HazardTypes, ", "))
		f.SetCellValue("Location Analysis", fmt.Sprintf("E%d", row), summary.LastIncident.Format("2006-01-02 15:04"))
	}

	// Auto-fit columns
	for i := range headers {
		col := string(rune('A' + i))
		width := 15.0 // default width
		if i == 3 {   // Hazard Types column
			width = 30.0
		}
		f.SetColWidth("Location Analysis", col, col, width)
	}

	return f, nil
}
func (s *ReportService) exportLocationAnalysisPDF(pdf *fpdf.Fpdf, data *LocationAnalysisData) (*bytes.Buffer, error) {
	// Title
	pdf.CellFormat(190, 10, "Location Analysis Report", "", 1, "C", false, 0, "")
	pdf.Ln(10)

	// Set up table headers
	pdf.SetFont("Arial", "B", 11)
	headers := []string{"Location", "Incidents", "Risk Score", "Last Incident"}
	colWidths := []float64{50, 30, 30, 40}

	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 10, header, "1", 0, "C", false, 0, "")
	}
	pdf.Ln(-1)

	// Add data rows
	pdf.SetFont("Arial", "", 10)
	for _, summary := range data.LocationSummaries {
		// Main row
		pdf.CellFormat(colWidths[0], 10, summary.Location, "1", 0, "L", false, 0, "")
		pdf.CellFormat(colWidths[1], 10, fmt.Sprintf("%d", summary.IncidentCount), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[2], 10, fmt.Sprintf("%.2f", summary.RiskScore), "1", 0, "C", false, 0, "")
		pdf.CellFormat(colWidths[3], 10, summary.LastIncident.Format("2006-01-02"), "1", 0, "C", false, 0, "")
		pdf.Ln(-1)

		// Hazard types (indented on next line)
		if len(summary.HazardTypes) > 0 {
			currentX := pdf.GetX()
			currentY := pdf.GetY()
			pdf.SetX(currentX + 10) // Indent
			pdf.SetFont("Arial", "I", 9)
			pdf.CellFormat(170, 8, "Hazard Types: "+strings.Join(summary.HazardTypes, ", "), "LR", 1, "L", false, 0, "")
			pdf.SetFont("Arial", "", 10)
			pdf.SetY(currentY + 8)
		}
	}

	// Create buffer and write PDF
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, fmt.Errorf("failed to generate PDF: %w", err)
	}

	return &buf, nil
}
func (s *ReportService) exportSafetyPerformancePDF(pdf *fpdf.Fpdf, data *SafetyPerformanceData) (*bytes.Buffer, error) {
	// Header
	pdf.CellFormat(190, 10, "Safety Performance Report", "", 1, "L", false, 0, "")
	pdf.Ln(15)

	// Summary Section
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, "Summary Metrics", "", 1, "L", false, 0, "")
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
		pdf.CellFormat(95, 8, m.label, "", 0, "L", false, 0, "")
		pdf.CellFormat(95, 8, m.value, "", 1, "L", false, 0, "")
	}

	// Create buffer and write PDF
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return &buf, nil
}

func (s *ReportService) exportIncidentTrendsPDF(pdf *fpdf.Fpdf, data *IncidentTrendsData) (*bytes.Buffer, error) {
	// Header
	pdf.SetFont("Arial", "B", 16)
	pdf.CellFormat(190, 10, "Incident Trends Report", "", 1, "L", false, 0, "")
	pdf.Ln(15)

	// Common Hazards Section
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, "Common Hazards", "", 1, "L", false, 0, "")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 10)
	hazardHeaders := []string{"Type", "Frequency", "Risk Score"}
	// Set up table header
	for _, header := range hazardHeaders {
		pdf.CellFormat(63, 8, header, "", 0, "L", false, 0, "")
	}
	pdf.Ln(8)

	// Add hazard data
	for _, hazard := range data.CommonHazards {
		pdf.CellFormat(63, 8, hazard.Type, "", 0, "L", false, 0, "")
		pdf.CellFormat(63, 8, fmt.Sprintf("%d", hazard.Frequency), "", 0, "L", false, 0, "")
		pdf.CellFormat(63, 8, fmt.Sprintf("%.2f", hazard.RiskScore), "", 1, "L", false, 0, "")
	}
	pdf.Ln(10)

	// Monthly Trends Section
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, "Monthly Trends", "", 1, "L", false, 0, "")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 10)
	trendHeaders := []string{"Month", "Incidents", "Severity", "Resolved", "New Hazards"}
	// Set up table header
	for _, header := range trendHeaders {
		pdf.CellFormat(38, 8, header, "", 0, "L", false, 0, "")
	}
	pdf.Ln(8)

	// Add monthly trend data
	for _, trend := range data.TrendsByMonth {
		pdf.CellFormat(38, 8, trend.Month.Format("Jan 2006"), "", 0, "L", false, 0, "")
		pdf.CellFormat(38, 8, fmt.Sprintf("%d", trend.IncidentCount), "", 0, "L", false, 0, "")
		pdf.CellFormat(38, 8, fmt.Sprintf("%.2f", trend.SeverityScore), "", 0, "L", false, 0, "")
		pdf.CellFormat(38, 8, fmt.Sprintf("%d", trend.ResolvedCount), "", 0, "L", false, 0, "")
		pdf.CellFormat(38, 8, fmt.Sprintf("%d", trend.NewHazards), "", 1, "L", false, 0, "")
	}
	pdf.Ln(10)

	// Risk Patterns Section
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, "Risk Patterns", "", 1, "L", false, 0, "")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 10)
	for _, pattern := range data.RiskPatterns {
		pdf.CellFormat(190, 8, fmt.Sprintf("Category: %s", pattern.Category), "", 1, "L", false, 0, "")
		pdf.CellFormat(190, 8, fmt.Sprintf("Frequency: %d | Severity: %s", pattern.Frequency, pattern.Severity), "", 1, "L", false, 0, "")
		pdf.CellFormat(190, 8, fmt.Sprintf("Departments: %s", strings.Join(pattern.Departments, ", ")), "", 1, "L", false, 0, "")
		pdf.CellFormat(190, 8, fmt.Sprintf("Root Causes: %s", strings.Join(pattern.RootCauses, ", ")), "", 1, "L", false, 0, "")
		pdf.Ln(4)
	}

	// Recurring Issues Section
	pdf.SetFont("Arial", "B", 12)
	pdf.CellFormat(190, 10, "Recurring Issues", "", 1, "L", false, 0, "")
	pdf.Ln(10)

	pdf.SetFont("Arial", "", 10)
	for _, issue := range data.RecurringIssues {
		pdf.CellFormat(190, 8, fmt.Sprintf("Description: %s", issue.Description), "", 1, "L", false, 0, "")
		pdf.CellFormat(190, 8, fmt.Sprintf("Frequency: %d | Last Occurred: %s",
			issue.Frequency,
			issue.LastOccurred.Format("2006-01-02")), "", 1, "L", false, 0, "")
		pdf.CellFormat(190, 8, fmt.Sprintf("Status: %s | Priority: %s", issue.Status, issue.Priority), "", 1, "L", false, 0, "")
		pdf.CellFormat(190, 8, fmt.Sprintf("Locations: %s", strings.Join(issue.Locations, ", ")), "", 1, "L", false, 0, "")
		pdf.Ln(4)
	}

	// Create buffer and write PDF
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return &buf, nil
}
func (s *ReportService) exportComplianceReport(f *excelize.File, data *ComplianceData) (*excelize.File, error) {
	// Overall Summary Sheet
	f.SetSheetName("Sheet1", "Compliance Summary")

	// Summary Section
	f.SetCellValue("Compliance Summary", "A1", "Overall Compliance Rate")
	f.SetCellValue("Compliance Summary", "B1", fmt.Sprintf("%.2f%%", data.OverallCompliance))

	// Status Breakdown
	f.SetCellValue("Compliance Summary", "A3", "Status Breakdown")
	row := 4
	for status, count := range data.ActionsByStatus {
		f.SetCellValue("Compliance Summary", fmt.Sprintf("A%d", row), status)
		f.SetCellValue("Compliance Summary", fmt.Sprintf("B%d", row), count)
		row++
	}

	// Overdue Actions Sheet
	f.NewSheet("Overdue Actions")
	headers := []string{"ID", "Description", "Due Date", "Days Overdue", "Priority", "Assigned To", "Department"}
	for i, header := range headers {
		col := string(rune('A' + i))
		f.SetCellValue("Overdue Actions", fmt.Sprintf("%s1", col), header)
	}

	for i, action := range data.OverdueActions {
		row := i + 2
		f.SetCellValue("Overdue Actions", fmt.Sprintf("A%d", row), action.ID.String())
		f.SetCellValue("Overdue Actions", fmt.Sprintf("B%d", row), action.Description)
		f.SetCellValue("Overdue Actions", fmt.Sprintf("C%d", row), action.DueDate.Format("2006-01-02"))
		f.SetCellValue("Overdue Actions", fmt.Sprintf("D%d", row), action.DaysOverdue)
		f.SetCellValue("Overdue Actions", fmt.Sprintf("E%d", row), action.Priority)
		f.SetCellValue("Overdue Actions", fmt.Sprintf("F%d", row), action.AssignedTo)
		f.SetCellValue("Overdue Actions", fmt.Sprintf("G%d", row), action.Department)
	}

	// Department Compliance Sheet
	f.NewSheet("Department Compliance")
	deptHeaders := []string{"Department", "Incident Count", "Resolved Count", "Unresolved Count", "Resolution Rate", "Critical Incidents"}
	for i, header := range deptHeaders {
		col := string(rune('A' + i))
		f.SetCellValue("Department Compliance", fmt.Sprintf("%s1", col), header)
	}

	for i, dept := range data.DepartmentCompliance {
		row := i + 2
		f.SetCellValue("Department Compliance", fmt.Sprintf("A%d", row), dept.DepartmentName)
		f.SetCellValue("Department Compliance", fmt.Sprintf("B%d", row), dept.IncidentCount)
		f.SetCellValue("Department Compliance", fmt.Sprintf("C%d", row), dept.ResolvedCount)
		f.SetCellValue("Department Compliance", fmt.Sprintf("C%d", row), dept.UnresolvedCount)
		f.SetCellValue("Department Compliance", fmt.Sprintf("D%d", row), fmt.Sprintf("%.2f%%", dept.ResolutionRate))
		f.SetCellValue("Department Compliance", fmt.Sprintf("C%d", row), dept.CriticalIncidents)
	}

	return f, nil
}
