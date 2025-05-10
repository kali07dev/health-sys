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

func (s *ReportService) addSectionTitlePDF(pdf *fpdf.Fpdf, title string) {
	pdf.SetFillColor(204, 0, 0)     // Dark Red (#CC0000)
	pdf.SetTextColor(255, 255, 255) // White
	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(0, 8, " "+title, "", 1, "L", true, 0, "") // Added space for padding
	pdf.SetTextColor(0, 0, 0)                                // Reset to black for subsequent text
	pdf.Ln(5)
}

// Helper function to sum elements of a float64 slice
func sumFloat64(nums []float64) float64 {
	sum := 0.0
	for _, n := range nums {
		sum += n
	}
	return sum
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
	pdf.AddPage() // Start a new page; header/footer drawn by `setupPdfPage` (called by orchestrator)

	// Main Report Title
	reportTitle := "Compliance Report"
	pdf.SetFont("Helvetica", "B", 18)
	pdf.SetTextColor(0, 0, 0) // Black text
	pdf.CellFormat(0, 10, reportTitle, "", 1, "C", false, 0, "")
	pdf.Ln(8)

	// Overall Compliance Section
	s.addSectionTitlePDF(pdf, "Overall Compliance")
	pdf.SetFont("Helvetica", "B", 11)
	pdf.CellFormat(60, 8, "Overall Rate:", "1", 0, "L", false, 0, "") // Added border
	pdf.SetFont("Helvetica", "", 11)
	pdf.SetFillColor(255, 238, 238)                                                               // Light Pink (#FFEEEE) for value background
	pdf.CellFormat(0, 8, fmt.Sprintf("%.2f%%", data.OverallCompliance), "1", 1, "R", true, 0, "") // Added border, right align
	pdf.SetFillColor(255, 255, 255)                                                               // Reset fill
	pdf.Ln(8)

	// Actions by Status Section
	if len(data.ActionsByStatus) > 0 {
		s.addSectionTitlePDF(pdf, "Actions by Status")

		// Table Headers
		pdf.SetFont("Helvetica", "B", 10)
		pdf.SetFillColor(204, 0, 0)     // Header BG: Dark Red (#CC0000)
		pdf.SetTextColor(255, 255, 255) // Header Text: White
		pdf.CellFormat(95, 8, "Status", "1", 0, "C", true, 0, "")
		pdf.CellFormat(85, 8, "Count", "1", 1, "C", true, 0, "") // Total 180, within 170 if margins are 20

		// Table Data
		pdf.SetFont("Helvetica", "", 10)
		pdf.SetTextColor(0, 0, 0) // Body Text: Black
		isEvenRow := false
		for status, count := range data.ActionsByStatus {
			if isEvenRow {
				pdf.SetFillColor(255, 238, 238) // Zebra Stripe: Light Pink (#FFEEEE)
			} else {
				pdf.SetFillColor(255, 255, 255) // White
			}
			pdf.CellFormat(95, 8, status, "1", 0, "L", true, 0, "")
			pdf.CellFormat(85, 8, fmt.Sprintf("%d", count), "1", 1, "C", true, 0, "")
			isEvenRow = !isEvenRow
		}
		pdf.SetFillColor(255, 255, 255) // Reset fill
		pdf.Ln(10)
	}

	// Overdue Actions Section
	if len(data.OverdueActions) > 0 {
		s.addSectionTitlePDF(pdf, "Overdue Actions")

		headers := []string{"Description", "Due Date", "Days Overdue", "Priority"}
		// Printable width = 210 (A4) - 20 (L margin) - 20 (R margin) = 170
		widths := []float64{70, 30, 35, 35} // Sum = 170

		// Table Headers
		pdf.SetFont("Helvetica", "B", 10)
		pdf.SetFillColor(204, 0, 0)
		pdf.SetTextColor(255, 255, 255)
		for i, header := range headers {
			pdf.CellFormat(widths[i], 8, header, "1", 0, "C", true, 0, "")
		}
		pdf.Ln(-1) // gofpdf trick to continue table rows without gap

		// Table Data
		pdf.SetFont("Helvetica", "", 10)
		pdf.SetTextColor(0, 0, 0)
		isEvenRow := false
		for _, action := range data.OverdueActions {
			if isEvenRow {
				pdf.SetFillColor(255, 238, 238)
			} else {
				pdf.SetFillColor(255, 255, 255)
			}
			// For Description, use MultiCell if it can be long
			currentY := pdf.GetY()
			pdf.MultiCell(widths[0], 8, action.Description, "1", "L", true)
			currentX := pdf.GetX() + widths[0]
			pdf.SetXY(currentX, currentY) // Reset Y to start of row for other cells

			pdf.CellFormat(widths[1], 8, action.DueDate.Format("2006-01-02"), "1", 0, "C", true, 0, "")
			pdf.CellFormat(widths[2], 8, fmt.Sprintf("%d", action.DaysOverdue), "1", 0, "C", true, 0, "")
			pdf.CellFormat(widths[3], 8, action.Priority, "1", 1, "C", true, 0, "") // This Ln(1) moves to next line

			// Ensure Y pos is consistent if MultiCell caused variable height (more advanced handling needed)
			// For now, assuming single line or MultiCell is the last one / simple cases
			isEvenRow = !isEvenRow
		}
		pdf.SetFillColor(255, 255, 255) // Reset fill
		pdf.Ln(5)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate PDF for Compliance Report: %w", err)
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
	pdf.AddPage()

	reportTitle := "Location Analysis Report"
	pdf.SetFont("Helvetica", "B", 18)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(0, 10, reportTitle, "", 1, "C", false, 0, "")
	pdf.Ln(8)

	s.addSectionTitlePDF(pdf, "Location Summaries")

	headers := []string{"Location", "Incidents", "Risk Score", "Last Incident"}
	colWidths := []float64{60, 30, 30, 50} // Total 170

	// Table Headers
	pdf.SetFont("Helvetica", "B", 10)
	pdf.SetFillColor(204, 0, 0)
	pdf.SetTextColor(255, 255, 255)
	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 8, header, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Table Data
	pdf.SetFont("Helvetica", "", 10)
	pdf.SetTextColor(0, 0, 0)

	for _, summary := range data.LocationSummaries {
		// Determine row background color (alternating)
		// Since sub-rows for HazardTypes are added, manage striping carefully.
		// For simplicity, apply striping only to the main data row.
		isEvenRow := (pdf.GetY() / 8) // Approximation, better to use a counter
		if int(isEvenRow)%2 == 0 {
			pdf.SetFillColor(255, 238, 238)
		} else {
			pdf.SetFillColor(255, 255, 255)
		}

		// Store Y before drawing main row cells, manage height if content wraps
		startY := pdf.GetY()
		cellHeight := 8.0 // Default cell height

		// Render main row cells
		// Handling potential wrapping for 'Location' by using MultiCell
		pdf.MultiCell(colWidths[0], cellHeight, summary.Location, "1", "L", true)
		xAfterLocation := pdf.GetX() + colWidths[0]
		yAfterLocation := pdf.GetY() // Y might have changed due to MultiCell

		// Reset Y for other cells to align with the start of the 'Location' cell content
		pdf.SetXY(xAfterLocation, startY)
		pdf.CellFormat(colWidths[1], cellHeight, fmt.Sprintf("%d", summary.IncidentCount), "1", 0, "C", true, 0, "")
		pdf.CellFormat(colWidths[2], cellHeight, fmt.Sprintf("%.2f", summary.RiskScore), "1", 0, "C", true, 0, "")
		pdf.CellFormat(colWidths[3], cellHeight, summary.LastIncident.Format("2006-01-02"), "1", 0, "C", true, 0, "") // No Ln yet

		// Ensure we move to the Y position after the potentially tallest cell (Location)
		if yAfterLocation > pdf.GetY() {
			pdf.SetY(yAfterLocation)
		}
		pdf.Ln(cellHeight) // Ensure we are on a new line after the row

		// Hazard types: Rendered as a sub-list below the main row
		if len(summary.HazardTypes) > 0 {
			pdf.SetFillColor(255, 255, 255) // White background for this sub-section
			pdf.SetFont("Helvetica", "I", 9)
			pdf.CellFormat(10, 6, "", "", 0, "L", false, 0, "")                                                                   // Indentation
			pdf.MultiCell(sumFloat64(colWidths)-10, 6, "Hazard Types: "+strings.Join(summary.HazardTypes, ", "), "B", "L", false) // Bottom border for separation
			pdf.SetFont("Helvetica", "", 10)                                                                                      // Reset font
			pdf.Ln(2)                                                                                                             // Small space after hazard types
		}
	}
	pdf.SetFillColor(255, 255, 255) // Reset fill
	pdf.Ln(5)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate PDF for Location Analysis: %w", err)
	}
	return &buf, nil
}

func (s *ReportService) exportSafetyPerformancePDF(pdf *fpdf.Fpdf, data *SafetyPerformanceData) (*bytes.Buffer, error) {
	pdf.AddPage()

	reportTitle := "Safety Performance Report"
	pdf.SetFont("Helvetica", "B", 18)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(0, 10, reportTitle, "", 1, "C", false, 0, "")
	pdf.Ln(8)

	s.addSectionTitlePDF(pdf, "Summary Metrics")

	metrics := []struct {
		label string
		value string
	}{
		{"Total Incidents:", fmt.Sprintf("%d", data.TotalIncidents)},
		{"Resolution Rate:", fmt.Sprintf("%.2f%%", data.ResolutionRate)},
		{"Compliance Rate:", fmt.Sprintf("%.2f%%", data.ComplianceRate)},
		{"Critical Findings:", fmt.Sprintf("%d", data.CriticalFindings)},
	}

	// Table-like display for metrics
	pdf.SetFont("Helvetica", "B", 10) // Header for this pseudo-table (optional or integrate)

	isEvenRow := false
	for _, m := range metrics {
		if isEvenRow {
			pdf.SetFillColor(255, 238, 238) // Light Pink
		} else {
			pdf.SetFillColor(255, 255, 255) // White
		}
		pdf.SetFont("Helvetica", "B", 10) // Label bold
		pdf.CellFormat(85, 8, m.label, "1", 0, "L", true, 0, "")
		pdf.SetFont("Helvetica", "", 10)                         // Value normal
		pdf.CellFormat(85, 8, m.value, "1", 1, "R", true, 0, "") // Right align value
		isEvenRow = !isEvenRow
	}
	pdf.SetFillColor(255, 255, 255) // Reset fill
	pdf.Ln(5)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate PDF for Safety Performance: %w", err)
	}
	return &buf, nil
}

func (s *ReportService) exportIncidentTrendsPDF(pdf *fpdf.Fpdf, data *IncidentTrendsData) (*bytes.Buffer, error) {
	pdf.AddPage()

	reportTitle := "Incident Trends Report"
	pdf.SetFont("Helvetica", "B", 18)
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(0, 10, reportTitle, "", 1, "C", false, 0, "")
	pdf.Ln(8)

	// Common Hazards Section
	if len(data.CommonHazards) > 0 {
		s.addSectionTitlePDF(pdf, "Common Hazards")
		hazardHeaders := []string{"Type", "Frequency", "Risk Score"}
		hazardWidths := []float64{90, 40, 40} // Total 170

		pdf.SetFont("Helvetica", "B", 10)
		pdf.SetFillColor(204, 0, 0)
		pdf.SetTextColor(255, 255, 255)
		for i, header := range hazardHeaders {
			pdf.CellFormat(hazardWidths[i], 8, header, "1", 0, "C", true, 0, "")
		}
		pdf.Ln(-1)

		pdf.SetFont("Helvetica", "", 10)
		pdf.SetTextColor(0, 0, 0)
		isEvenRow := false
		for _, hazard := range data.CommonHazards {
			if isEvenRow {
				pdf.SetFillColor(255, 238, 238)
			} else {
				pdf.SetFillColor(255, 255, 255)
			}
			pdf.CellFormat(hazardWidths[0], 8, hazard.Type, "1", 0, "L", true, 0, "")
			pdf.CellFormat(hazardWidths[1], 8, fmt.Sprintf("%d", hazard.Frequency), "1", 0, "C", true, 0, "")
			pdf.CellFormat(hazardWidths[2], 8, fmt.Sprintf("%.2f", hazard.RiskScore), "1", 1, "C", true, 0, "")
			isEvenRow = !isEvenRow
		}
		pdf.SetFillColor(255, 255, 255)
		pdf.Ln(10)
	}

	// Monthly Trends Section
	if len(data.TrendsByMonth) > 0 {
		s.addSectionTitlePDF(pdf, "Monthly Trends")
		trendHeaders := []string{"Month", "Incidents", "Avg. Severity", "Resolved", "New Hazards"}
		trendWidths := []float64{30, 30, 35, 30, 45} // Total 170

		pdf.SetFont("Helvetica", "B", 10)
		pdf.SetFillColor(204, 0, 0)
		pdf.SetTextColor(255, 255, 255)
		for i, header := range trendHeaders {
			pdf.CellFormat(trendWidths[i], 8, header, "1", 0, "C", true, 0, "")
		}
		pdf.Ln(-1)

		pdf.SetFont("Helvetica", "", 10)
		pdf.SetTextColor(0, 0, 0)
		isEvenRow := false
		for _, trend := range data.TrendsByMonth {
			if isEvenRow {
				pdf.SetFillColor(255, 238, 238)
			} else {
				pdf.SetFillColor(255, 255, 255)
			}
			pdf.CellFormat(trendWidths[0], 8, trend.Month.Format("Jan 2006"), "1", 0, "L", true, 0, "")
			pdf.CellFormat(trendWidths[1], 8, fmt.Sprintf("%d", trend.IncidentCount), "1", 0, "C", true, 0, "")
			pdf.CellFormat(trendWidths[2], 8, fmt.Sprintf("%.2f", trend.SeverityScore), "1", 0, "C", true, 0, "")
			pdf.CellFormat(trendWidths[3], 8, fmt.Sprintf("%d", trend.ResolvedCount), "1", 0, "C", true, 0, "")
			pdf.CellFormat(trendWidths[4], 8, fmt.Sprintf("%d", trend.NewHazards), "1", 1, "C", true, 0, "")
			isEvenRow = !isEvenRow
		}
		pdf.SetFillColor(255, 255, 255)
		pdf.Ln(10)
	}

	// Risk Patterns Section
	if len(data.RiskPatterns) > 0 {
		s.addSectionTitlePDF(pdf, "Risk Patterns")
		pdf.SetFont("Helvetica", "", 10)
		for i, pattern := range data.RiskPatterns {
			if i > 0 { // Add a separator line
				pdf.SetDrawColor(255, 153, 153) // Soft Red (#FF9999)
				currentY := pdf.GetY()
				// Draw line from current X (margin) to page width - margin X
				pdf.Line(pdf.GetX(), currentY, 210-pdf.GetCellMargin()-20, currentY) // Assuming 20mm right margin
				pdf.Ln(3)
				pdf.SetDrawColor(0, 0, 0) // Reset draw color
			}

			pdf.SetFillColor(245, 245, 245) // Light gray background (#F5F5F5)
			pdf.SetFont("Helvetica", "B", 10)
			pdf.MultiCell(0, 7, "Category: "+pattern.Category, "TLR", "L", true) // Top, Left, Right borders
			pdf.SetFont("Helvetica", "", 10)
			pdf.MultiCell(0, 7, fmt.Sprintf("  Frequency: %d  |  Severity: %s", pattern.Frequency, pattern.Severity), "LR", "L", true)
			pdf.MultiCell(0, 7, "  Departments: "+strings.Join(pattern.Departments, ", "), "LR", "L", true)
			pdf.MultiCell(0, 7, "  Root Causes: "+strings.Join(pattern.RootCauses, ", "), "LRB", "L", true) // Bottom border to close box
			pdf.Ln(5)                                                                                       // Spacing after each pattern block
		}
		pdf.SetFillColor(255, 255, 255) // Reset fill
		pdf.Ln(5)
	}

	// Recurring Issues Section
	if len(data.RecurringIssues) > 0 {
		s.addSectionTitlePDF(pdf, "Recurring Issues")
		pdf.SetFont("Helvetica", "", 10)
		for i, issue := range data.RecurringIssues {
			if i > 0 { // Add a separator line
				pdf.SetDrawColor(255, 153, 153) // Soft Red (#FF9999)
				currentY := pdf.GetY()
				pdf.Line(pdf.GetX(), currentY, 210-pdf.GetCellMargin()-20, currentY)
				pdf.Ln(3)
				pdf.SetDrawColor(0, 0, 0)
			}
			pdf.SetFillColor(245, 245, 245) // Light gray background (#F5F5F5)
			pdf.SetFont("Helvetica", "B", 10)
			pdf.MultiCell(0, 7, "Issue: "+issue.Description, "TLR", "L", true)
			pdf.SetFont("Helvetica", "", 10)
			pdf.MultiCell(0, 7, fmt.Sprintf("  Frequency: %d  |  Last Occurred: %s", issue.Frequency, issue.LastOccurred.Format("2006-01-02")), "LR", "L", true)
			pdf.MultiCell(0, 7, fmt.Sprintf("  Status: %s  |  Priority: %s", issue.Status, issue.Priority), "LR", "L", true)
			pdf.MultiCell(0, 7, "  Locations: "+strings.Join(issue.Locations, ", "), "LRB", "L", true)
			pdf.Ln(5) // Spacing after each issue block
		}
		pdf.SetFillColor(255, 255, 255) // Reset fill
		pdf.Ln(5)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to generate PDF for Incident Trends: %w", err)
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
