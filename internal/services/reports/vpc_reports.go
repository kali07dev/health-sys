package reports

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	// "github.com/google/uuid" // Not used directly in the provided snippet, but often useful
	"github.com/jung-kurt/gofpdf"
	"gorm.io/gorm"

	"github.com/hopkali04/health-sys/internal/models"
)

// ReportService handles VPC report generation
type ReportService struct {
	DB *gorm.DB
}
func NewVPCReportService(db *gorm.DB) *ReportService {
	return &ReportService{DB: db}
}
// ReportOptions contains customization parameters for report generation
type ReportOptions struct {
	StartDate    *time.Time
	EndDate      *time.Time
	UserRole     string // "admin", "safety_officer", "manager", "employee"
	OutputFormat string // "pdf" or "html"
	IncludeStats bool
}

// VPCReportData represents all data needed for a VPC report
type VPCReportData struct {
	VPC                *models.VPC
	Attachments        []models.VPCAttachment
	Creator            models.Employee
	Reporter           models.Employee
	ReportingManagers  []models.Employee
	DepartmentStats    DepartmentStatistics
	CompanyStats       CompanyStatistics
	ReportID           string
	GeneratedTimestamp time.Time
}

// DepartmentStatistics contains safety statistics for a department
type DepartmentStatistics struct {
	TotalVPCs         int
	SafeVPCs          int
	UnsafeVPCs        int
	Last90DaysVPCs    int
	CategoryBreakdown map[string]int
}

// CompanyStatistics contains company-wide statistics
type CompanyStatistics struct {
	TotalVPCs         int
	SafeVPCs          int
	UnsafeVPCs        int
	DepartmentRanking []DepartmentRank
}

// DepartmentRank represents a department's safety ranking
type DepartmentRank struct {
	Department  string
	TotalVPCs   int
	SafetyRatio float64 // SafeVPCs / TotalVPCs
}

// GenerateVPCReport creates a formatted report for a VPC
func (s *ReportService) GenerateVPCReport(c *fiber.Ctx, vpcID string, options ReportOptions) error {
	// Get VPC data with related entities
	reportData, err := s.gatherReportData(vpcID)
	if err != nil {
		// It's good practice to log the error on the server side as well
		// For example: log.Printf("Error gathering report data for VPC %s: %v", vpcID, err)
		// Return a user-friendly error, or handle specific errors (e.g., gorm.ErrRecordNotFound)
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusNotFound).SendString(fmt.Sprintf("VPC with ID %s not found", vpcID))
		}
		return c.Status(fiber.StatusInternalServerError).SendString(fmt.Sprintf("Error generating report: %v", err))
	}

	// Generate report based on output format
	switch options.OutputFormat {
	case "pdf":
		return s.generatePDFReport(c, reportData, options)
	case "html":
		return s.generateHTMLReport(c, reportData, options)
	default:
		return c.Status(fiber.StatusBadRequest).SendString("Invalid output format specified. Supported formats: pdf, html.")
	}
}

// gatherReportData collects all data required for the report
func (s *ReportService) gatherReportData(vpcID string) (*VPCReportData, error) {
	var vpc models.VPC
	result := s.DB.Preload("Attachments.Uploader").Where("id = ?", vpcID).First(&vpc)
	if result.Error != nil {
		return nil, result.Error
	}

	var attachments []models.VPCAttachment
	if err := s.DB.Where("vpc_id = ?", vpcID).Preload("Uploader").Find(&attachments).Error; err != nil {
		// Log error but proceed, attachments might not be critical for all reports
		fmt.Printf("Warning: could not load attachments for VPC %s: %v\n", vpcID, err)
	}

	var creator models.Employee
	if err := s.DB.Where("id = ?", vpc.CreatedBy).First(&creator).Error; err != nil {
		// Handle case where creator might not be found, or set to a default
		fmt.Printf("Warning: could not load creator for VPC %s (creator ID %s): %v\n", vpcID, vpc.CreatedBy, err)
		// Potentially set creator to a placeholder if this is acceptable
	}

	var reporter models.Employee
	if err := s.DB.Where("employee_number = ?", vpc.ReportedBy).First(&reporter).Error; err != nil {
		fmt.Printf("Warning: could not load reporter for VPC %s (reporter number %s): %v\n", vpcID, vpc.ReportedBy, err)
		// Potentially set reporter to a placeholder
	}

	reportManagers := s.getReportingManagers(&reporter) // Pass reporter even if not fully loaded, getReportingManagers handles nil ReportingManagerID

	deptStats := s.calculateDepartmentStatistics(vpc.Department)
	companyStats := s.calculateCompanyStatistics()

	reportID := fmt.Sprintf("%s-%s", vpc.VpcNumber, time.Now().Format("20060102-150405"))

	return &VPCReportData{
		VPC:                &vpc,
		Attachments:        attachments,
		Creator:            creator,
		Reporter:           reporter,
		ReportingManagers:  reportManagers,
		DepartmentStats:    deptStats,
		CompanyStats:       companyStats,
		ReportID:           reportID,
		GeneratedTimestamp: time.Now(),
	}, nil
}

// getReportingManagers retrieves the chain of managers for an employee
func (s *ReportService) getReportingManagers(employee *models.Employee) []models.Employee {
	var managers []models.Employee

	if employee == nil || employee.ReportingManagerID == nil { // Check if employee itself is nil
		return managers
	}

	var currentManager models.Employee
	managerID := *employee.ReportingManagerID
	
	// Follow the reporting chain up to 5 levels
	for i := 0; i < 5; i++ {
		if err := s.DB.Where("id = ?", managerID).First(&currentManager).Error; err != nil {
			break
		}

		managers = append(managers, currentManager)

		if currentManager.ReportingManagerID == nil {
			break
		}
		managerID = *currentManager.ReportingManagerID
	}

	return managers
}

// calculateDepartmentStatistics calculates safety stats for a department
func (s *ReportService) calculateDepartmentStatistics(department string) DepartmentStatistics {
	var stats DepartmentStatistics
	stats.CategoryBreakdown = make(map[string]int)
	var totalVPCs, safeVPCs, unsafeVPCs, last90DaysVPCs int64 // Use int64 for gorm Count

	s.DB.Model(&models.VPC{}).Where("department = ?", department).Count(&totalVPCs)
	stats.TotalVPCs = int(totalVPCs)

	s.DB.Model(&models.VPC{}).Where("department = ? AND vpc_type = ?", department, "safe").Count(&safeVPCs)
	stats.SafeVPCs = int(safeVPCs)

	s.DB.Model(&models.VPC{}).Where("department = ? AND vpc_type = ?", department, "unsafe").Count(&unsafeVPCs)
	stats.UnsafeVPCs = int(unsafeVPCs)

	ninetyDaysAgo := time.Now().AddDate(0, 0, -90)
	s.DB.Model(&models.VPC{}).Where("department = ? AND created_at >= ?", department, ninetyDaysAgo).Count(&last90DaysVPCs)
	stats.Last90DaysVPCs = int(last90DaysVPCs)

	var vpcs []models.VPC
	s.DB.Where("department = ?", department).Find(&vpcs) // Consider selecting only IncidentRelatesTo for efficiency if other fields aren't needed

	for _, vpc := range vpcs {
		if vpc.IncidentRelatesTo != "" { // Ensure key is not empty
			stats.CategoryBreakdown[vpc.IncidentRelatesTo]++
		}
	}

	return stats
}

// calculateCompanyStatistics computes company-wide safety statistics
func (s *ReportService) calculateCompanyStatistics() CompanyStatistics {
	var stats CompanyStatistics
	var totalVPCs, safeVPCs, unsafeVPCs int64 // Use int64 for gorm Count

	s.DB.Model(&models.VPC{}).Count(&totalVPCs)
	stats.TotalVPCs = int(totalVPCs)

	s.DB.Model(&models.VPC{}).Where("vpc_type = ?", "safe").Count(&safeVPCs)
	stats.SafeVPCs = int(safeVPCs)

	s.DB.Model(&models.VPC{}).Where("vpc_type = ?", "unsafe").Count(&unsafeVPCs)
	stats.UnsafeVPCs = int(unsafeVPCs)

	var departments []string
	s.DB.Model(&models.VPC{}).Distinct().Pluck("department", &departments)

	for _, dept := range departments {
		if dept == "" { // Skip if department name is empty
			continue
		}
		var total, safe int64
		s.DB.Model(&models.VPC{}).Where("department = ?", dept).Count(&total)
		s.DB.Model(&models.VPC{}).Where("department = ? AND vpc_type = ?", dept, "safe").Count(&safe)

		safetyRatio := 0.0
		if total > 0 {
			safetyRatio = float64(safe) / float64(total)
		}

		stats.DepartmentRanking = append(stats.DepartmentRanking, DepartmentRank{
			Department:  dept,
			TotalVPCs:   int(total),
			SafetyRatio: safetyRatio,
		})
	}
	// Optionally sort DepartmentRanking
	// sort.Slice(stats.DepartmentRanking, func(i, j int) bool {
	// 	return stats.DepartmentRanking[i].SafetyRatio > stats.DepartmentRanking[j].SafetyRatio // Descending by safety ratio
	// })
	return stats
}

// generatePDFReport creates a PDF report
func (s *ReportService) generatePDFReport(c *fiber.Ctx, data *VPCReportData, options ReportOptions) error {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(20, 20, 20)
	pdf.AddPage()
	pdf.SetAutoPageBreak(true, 20) // Enable auto page break

	// Helper function for writing a cell with font setting
	writeCell := func(fontFace string, fontSize float64, width float64, height float64, text string, borderStr string, ln int, alignStr string, fill bool) {
		pdf.SetFont("Helvetica", fontFace, fontSize)
		pdf.CellFormat(width, height, text, borderStr, ln, alignStr, fill, 0, "")
	}
	// Helper function for MultiCell
	writeMultiCell := func(fontFace string, fontSize float64, width float64, height float64, text string, borderStr string, alignStr string, fill bool) {
		pdf.SetFont("Helvetica", fontFace, fontSize)
		pdf.MultiCell(width, height, text, borderStr, alignStr, fill)
	}

	// Add watermark based on VPCType
	if data.VPC.VpcType == "unsafe" {
		pdf.SetTextColor(200, 0, 0)
		pdf.SetFont("Helvetica", "B", 80)
		pdf.TransformBegin()
		pdf.TransformRotate(45, pdf.GetX()+50, pdf.GetY()+100) // Adjust position relative to current cursor for robustness
		pdf.Text(pdf.GetX()+10, pdf.GetY()+150, "UNSAFE")      // Adjust text position
		pdf.TransformEnd()
		pdf.SetTextColor(0, 0, 0)
	} else {
		pdf.SetTextColor(0, 150, 0)
		pdf.SetFont("Helvetica", "B", 80)
		pdf.TransformBegin()
		pdf.TransformRotate(45, pdf.GetX()+50, pdf.GetY()+100)
		pdf.Text(pdf.GetX()+20, pdf.GetY()+150, "SAFE")
		pdf.TransformEnd()
		pdf.SetTextColor(0, 0, 0)
	}

	// Add header
	writeCell("B", 16, 0, 10, "VPC Safety Report", "", 1, "C", false)
	pdf.Ln(5)

	// Add institution branding
	writeCell("", 10, 0, 6, "Your Company Name", "", 1, "C", false)
	writeCell("", 10, 0, 6, "123 Business Street, City, Country", "", 1, "C", false)
	writeCell("", 10, 0, 6, "Phone: (123) 456-7890 | Email: safety@company.com", "", 1, "C", false)
	pdf.Ln(10)

	// Add report ID and generation timestamp
	writeCell("B", 10, 50, 6, "Report ID:", "", 0, "L", false)
	writeCell("", 10, 0, 6, data.ReportID, "", 1, "L", false)

	writeCell("B", 10, 50, 6, "Generated on:", "", 0, "L", false)
	writeCell("", 10, 0, 6, data.GeneratedTimestamp.Format("January 02, 2006 15:04:05"), "", 1, "L", false)
	pdf.Ln(10)

	// Add VPC information section title
	pdf.SetFillColor(240, 240, 240)
	writeCell("B", 12, 0, 8, "Incident Summary", "1", 1, "L", true)
	pdf.Ln(5)

	// Add VPC details
	writeCell("B", 10, 50, 6, "VPC Number:", "", 0, "L", false)
	writeCell("", 10, 0, 6, data.VPC.VpcNumber, "", 1, "L", false)

	writeCell("B", 10, 50, 6, "Reported Date:", "", 0, "L", false)
	writeCell("", 10, 0, 6, data.VPC.ReportedDate.Format("January 02, 2006 15:04:05"), "", 1, "L", false)

	writeCell("B", 10, 50, 6, "Department:", "", 0, "L", false)
	writeCell("", 10, 0, 6, data.VPC.Department, "", 1, "L", false)

	writeCell("B", 10, 50, 6, "Incident Relates To:", "", 0, "L", false)
	writeCell("", 10, 0, 6, data.VPC.IncidentRelatesTo, "", 1, "L", false)

	writeCell("B", 10, 50, 6, "Safety Type:", "", 0, "L", false)
	originalTextColorR, originalTextColorG, originalTextColorB := pdf.GetTextColor()
	if data.VPC.VpcType == "unsafe" {
		pdf.SetTextColor(200, 0, 0)
		writeCell("B", 10, 0, 6, "UNSAFE", "", 1, "L", false)
	} else {
		pdf.SetTextColor(0, 150, 0)
		writeCell("B", 10, 0, 6, "SAFE", "", 1, "L", false)
	}
	pdf.SetTextColor(originalTextColorR, originalTextColorG, originalTextColorB)
	pdf.Ln(5)

	// Add narrative analysis section title
	pdf.SetFillColor(240, 240, 240)
	writeCell("B", 12, 0, 8, "Narrative Analysis", "1", 1, "L", true)
	pdf.Ln(5)

	writeCell("B", 10, 0, 6, "Description:", "", 1, "L", false)
	writeMultiCell("I", 10, 0, 6, fmt.Sprintf("\"%s\"", data.VPC.Description), "", "L", false)
	pdf.Ln(5)

	writeCell("B", 10, 0, 6, "Action Taken:", "", 1, "L", false)
	steps := strings.Split(data.VPC.ActionTaken, "\n")
	for i, step := range steps {
		step = strings.TrimSpace(step)
		if step != "" {
			writeCell("", 10, 10, 6, fmt.Sprintf("%d.", i+1), "", 0, "L", false)
			writeMultiCell("", 10, 0, 6, step, "", "L", false) // Use MultiCell for potentially long steps
		}
	}
	pdf.Ln(5)

	if len(data.Attachments) > 0 {
		writeCell("B", 10, 0, 6, "Attachments:", "", 1, "L", false)
		pdf.Ln(2)

		for _, attachment := range data.Attachments {
			fileTypeIcon := "📄" // Default document icon
			switch {
			case strings.Contains(attachment.FileType, "image"):
				fileTypeIcon = "🖼️"
			case strings.Contains(attachment.FileType, "pdf"):
				fileTypeIcon = "📕"
			case strings.Contains(attachment.FileType, "video"):
				fileTypeIcon = "🎬"
			case strings.Contains(attachment.FileType, "audio"):
				fileTypeIcon = "🔊"
			}
			uploaderName := "N/A"
			if attachment.Uploader.EmployeeNumber != "" {
				uploaderName = attachment.Uploader.EmployeeNumber
			}

			pdf.SetFont("Helvetica", "", 10) // Ensure font is set for icon
			pdf.CellFormat(10, 6, fileTypeIcon, "", 0, "L", false, 0, "")
			pdf.CellFormat(80, 6, attachment.FileName, "", 0, "L", false, 0, "") // Adjusted width
			pdf.CellFormat(30, 6, fmt.Sprintf("%.2f MB", float64(attachment.FileSize)/1024/1024), "", 0, "R", false, 0, "")
			pdf.CellFormat(0, 6, fmt.Sprintf("By: %s", uploaderName), "", 1, "L", false, 0, "")

			if strings.Contains(attachment.FileType, "image") && attachment.FileSize < 5*1024*1024 {
				pdf.Ln(2)
				pdf.SetFont("Helvetica", "I", 8)
				pdf.CellFormat(0, 6, "(Image preview would be displayed here if content was loaded)", "", 1, "L", false, 0, "")
				pdf.Ln(2)
			}
		}
	}
	pdf.Ln(5)

	pdf.SetFillColor(240, 240, 240)
	writeCell("B", 12, 0, 8, "Personnel Matrix", "1", 1, "L", true)
	pdf.Ln(5)

	writeCell("B", 10, 50, 6, "Reported By:", "", 0, "L", false)
	reporterName := "N/A"
	if data.Reporter.FirstName != "" {
		reporterName = fmt.Sprintf("%s %s (%s)", data.Reporter.FirstName, data.Reporter.LastName, data.Reporter.Position)
	}
	writeCell("", 10, 0, 6, reporterName, "", 1, "L", false)

	writeCell("B", 10, 50, 6, "Created By:", "", 0, "L", false)
	creatorName := "N/A"
	if data.Creator.FirstName != "" {
		creatorName = fmt.Sprintf("%s %s (%s)", data.Creator.FirstName, data.Creator.LastName, data.Creator.Role)
	}
	writeCell("", 10, 0, 6, creatorName, "", 1, "L", false)
	pdf.Ln(5)

	if options.IncludeStats {
		pdf.AddPage() // Consider adding a page only if content warrants it
		pdf.SetFillColor(240, 240, 240)
		writeCell("B", 12, 0, 8, "Department Statistics", "1", 1, "L", true)
		pdf.Ln(5)

		writeCell("B", 10, 0, 6, fmt.Sprintf("Department: %s", data.VPC.Department), "", 1, "L", false)
		pdf.Ln(2)

		writeCell("", 10, 100, 6, "Total VPCs:", "", 0, "L", false)
		writeCell("", 10, 0, 6, fmt.Sprintf("%d", data.DepartmentStats.TotalVPCs), "", 1, "L", false)

		safePercent := 0.0
		if data.DepartmentStats.TotalVPCs > 0 {
			safePercent = (float64(data.DepartmentStats.SafeVPCs) / float64(data.DepartmentStats.TotalVPCs)) * 100
		}
		writeCell("", 10, 100, 6, "Safe VPCs:", "", 0, "L", false)
		writeCell("", 10, 0, 6, fmt.Sprintf("%d (%.1f%%)", data.DepartmentStats.SafeVPCs, safePercent), "", 1, "L", false)

		unsafePercent := 0.0
		if data.DepartmentStats.TotalVPCs > 0 {
			unsafePercent = (float64(data.DepartmentStats.UnsafeVPCs) / float64(data.DepartmentStats.TotalVPCs)) * 100
		}
		writeCell("", 10, 100, 6, "Unsafe VPCs:", "", 0, "L", false)
		writeCell("", 10, 0, 6, fmt.Sprintf("%d (%.1f%%)", data.DepartmentStats.UnsafeVPCs, unsafePercent), "", 1, "L", false)

		writeCell("", 10, 100, 6, "VPCs in last 90 days:", "", 0, "L", false)
		writeCell("", 10, 0, 6, fmt.Sprintf("%d", data.DepartmentStats.Last90DaysVPCs), "", 1, "L", false)
		pdf.Ln(5)

		writeCell("B", 10, 0, 6, "Category Breakdown:", "", 1, "L", false)
		pdf.Ln(2)
		for category, count := range data.DepartmentStats.CategoryBreakdown {
			writeCell("", 10, 100, 6, category+":", "", 0, "L", false)
			writeCell("", 10, 0, 6, fmt.Sprintf("%d", count), "", 1, "L", false)
		}
		pdf.Ln(5)

		// Role-specific content
		var roleSpecificTitle, roleSpecificContent string
		switch options.UserRole {
		case "safety_officer":
			roleSpecificTitle = "Emergency Protocols"
			roleSpecificContent = "This section contains emergency protocols visible only to safety officers. [Details of protocols specific to this type of incident, e.g., evacuation routes, contact persons, first aid procedures relevant to the reported incident category.]"
		case "manager":
			roleSpecificTitle = "Department Performance & Actions"
			roleSpecificContent = "Manager View: This section highlights trends and actionable insights for the department. [Comparison with department averages, suggested discussion points for team meetings, reminders for follow-up actions on similar past incidents.]"
		case "admin":
			roleSpecificTitle = "System & Data Integrity View"
			roleSpecificContent = "Admin View: This section provides system-level information and data audit trails. [Link to raw data export, system logs related to this VPC entry, configuration details relevant at the time of reporting.]"
		}

		if roleSpecificTitle != "" {
			pdf.AddPage()
			pdf.SetFillColor(240, 240, 240)
			writeCell("B", 12, 0, 8, roleSpecificTitle, "1", 1, "L", true)
			pdf.Ln(5)
			writeMultiCell("", 10, 0, 6, roleSpecificContent, "", "L", false)
			pdf.Ln(5)
		}
	}

	if len(data.ReportingManagers) > 0 {
		pdf.AddPage()
		pdf.SetFillColor(240, 240, 240)
		writeCell("B", 12, 0, 8, "Escalation Path", "1", 1, "L", true)
		pdf.Ln(5)

		reporterNameEsc := "N/A"
		if data.Reporter.FirstName != "" {
			reporterNameEsc = fmt.Sprintf("%s %s (%s)", data.Reporter.FirstName, data.Reporter.LastName, data.Reporter.Position)
		}
		writeCell("", 10, 0, 6, fmt.Sprintf("Initial Reporter: %s", reporterNameEsc), "", 1, "L", false)

		for i, manager := range data.ReportingManagers {
			managerName := "N/A"
			if manager.FirstName != "" {
				managerName = fmt.Sprintf("%s %s (%s)", manager.FirstName, manager.LastName, manager.Position)
			}
			writeCell("", 10, 0, 6, fmt.Sprintf("Level %d Manager: %s", i+1, managerName), "", 1, "L", false)
		}
	}

	// Output PDF
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to generate PDF buffer")
	}

	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"vpc-report-%s.pdf\"", data.VPC.VpcNumber))
	return c.Send(buf.Bytes())
}

// generateHTMLReport creates an HTML report
func (s *ReportService) generateHTMLReport(c *fiber.Ctx, data *VPCReportData, options ReportOptions) error {
	var html strings.Builder

	// Begin HTML document
	html.WriteString("<!DOCTYPE html>\n")
	html.WriteString("<html lang=\"en\">\n<head>\n")
	html.WriteString("  <meta charset=\"UTF-8\">\n")
	html.WriteString("  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n")
	html.WriteString(fmt.Sprintf("  <title>VPC Safety Report - %s</title>\n", data.VPC.VpcNumber))
	html.WriteString("  <style>\n")
	html.WriteString("    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }\n")
	html.WriteString("    .report-container { max-width: 850px; margin: 20px auto; background-color: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 0 15px rgba(0,0,0,0.1); position: relative; overflow: hidden; }\n")
	html.WriteString("    .header, .footer { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #eee; }\n")
	html.WriteString("    .footer { border-top: 1px solid #eee; border-bottom: none; margin-top: 30px; padding-top: 15px; font-size: 0.9em; color: #777; }\n")
	html.WriteString("    .header h1 { margin: 0 0 10px 0; color: #2c3e50; }\n")
	html.WriteString("    .header p { margin: 4px 0; font-size: 0.95em; color: #555; }\n")
	html.WriteString("    .section { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #fdfdfd; }\n")
	html.WriteString("    .section-title { font-size: 1.3em; font-weight: bold; color: #3498db; margin-top: 0; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #3498db; }\n")
	html.WriteString("    .label { font-weight: bold; width: 180px; display: inline-block; color: #333; }\n")
	html.WriteString("    .row { margin-bottom: 8px; display: flex; align-items: flex-start; }\n")
	html.WriteString("    .row .label { flex-shrink: 0; }\n")
	html.WriteString("    .row .value { flex-grow: 1; }\n")
	html.WriteString("    .description, .steps { margin-top: 10px; padding: 10px; background-color: #f9f9f9; border-left: 3px solid #bdc3c7; line-height: 1.6; }\n")
	html.WriteString("    .steps ol { padding-left: 20px; margin-top: 5px; }\n")
	html.WriteString("    .steps li { margin-bottom: 5px; }\n")
	html.WriteString("    .attachments-gallery { display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; }\n")
	html.WriteString("    .attachment-item { border: 1px solid #ddd; padding: 12px; width: calc(50% - 25px); box-sizing: border-box; border-radius: 4px; background-color: #fff; }\n")
	html.WriteString("    .attachment-item p { margin: 4px 0; font-size: 0.9em; }\n")
	html.WriteString("    .attachment-icon { font-size: 28px; margin-right: 8px; vertical-align: middle; }\n")
	html.WriteString("    .stats-table { width: 100%; border-collapse: collapse; margin-top: 10px; }\n")
	html.WriteString("    .stats-table th, .stats-table td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }\n")
	html.WriteString("    .stats-table th { background-color: #ecf0f1; color: #34495e; }\n")

	if data.VPC.VpcType == "unsafe" {
		html.WriteString("    .watermark { position: absolute; font-size: 12vw; font-weight: bold; color: rgba(231, 76, 60, 0.08); transform: rotate(-35deg); top: 30%; left: 5%; z-index: 0; pointer-events: none; }\n")
		html.WriteString("    .report-container { border-left: 5px solid #e74c3c; }\n")
		html.WriteString("    .safety-badge { background-color: #e74c3c; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; display: inline-block; }\n")
		html.WriteString("    .section-title { color: #c0392b; border-bottom-color: #c0392b; }\n")
	} else {
		html.WriteString("    .watermark { position: absolute; font-size: 12vw; font-weight: bold; color: rgba(39, 174, 96, 0.08); transform: rotate(-35deg); top: 30%; left: 5%; z-index: 0; pointer-events: none; }\n")
		html.WriteString("    .report-container { border-left: 5px solid #27ae60; }\n")
		html.WriteString("    .safety-badge { background-color: #27ae60; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; display: inline-block; }\n")
		html.WriteString("    .section-title { color: #16a085; border-bottom-color: #16a085; }\n")
	}
	html.WriteString("    @media (max-width: 768px) { .attachment-item { width: 100%; } .label { width: 120px;} }\n")
	html.WriteString("  </style>\n</head>\n<body>\n")

	html.WriteString("<div class=\"report-container\">\n")
	if data.VPC.VpcType == "unsafe" {
		html.WriteString("  <div class=\"watermark\">UNSAFE</div>\n")
	} else {
		html.WriteString("  <div class=\"watermark\">SAFE</div>\n")
	}

	html.WriteString("  <div class=\"header\">\n")
	html.WriteString("    <h1>VPC Safety Report</h1>\n")
	html.WriteString("    <p>Your Company Name</p>\n")
	html.WriteString("    <p>123 Business Street, City, Country</p>\n")
	html.WriteString("    <p>Phone: (123) 456-7890 | Email: safety@company.com</p>\n")
	html.WriteString(fmt.Sprintf("    <p><strong>Report ID:</strong> %s</p>\n", data.ReportID))
	html.WriteString(fmt.Sprintf("    <p><strong>Generated on:</strong> %s</p>\n", data.GeneratedTimestamp.Format("January 02, 2006 03:04:05 PM")))
	html.WriteString("  </div>\n")

	html.WriteString("  <div class=\"section\">\n")
	html.WriteString("    <h2 class=\"section-title\">Incident Summary</h2>\n")
	html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">VPC Number:</span> <span class=\"value\">%s</span></div>\n", data.VPC.VpcNumber))
	html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">Reported Date:</span> <span class=\"value\">%s</span></div>\n", data.VPC.ReportedDate.Format("January 02, 2006 03:04:05 PM")))
	html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">Department:</span> <span class=\"value\">%s</span></div>\n", data.VPC.Department))
	html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">Incident Relates To:</span> <span class=\"value\">%s</span></div>\n", data.VPC.IncidentRelatesTo))
	html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">Safety Type:</span> <span class=\"value\"><span class=\"safety-badge\">%s</span></span></div>\n", strings.ToUpper(data.VPC.VpcType)))
	html.WriteString("  </div>\n")

	html.WriteString("  <div class=\"section\">\n")
	html.WriteString("    <h2 class=\"section-title\">Narrative Analysis</h2>\n")
	html.WriteString("    <div><strong>Description:</strong></div>\n")
	html.WriteString(fmt.Sprintf("    <div class=\"description\">\"%s\"</div>\n", data.VPC.Description))
	html.WriteString("    <div><strong>Action Taken:</strong></div>\n")
	html.WriteString("    <div class=\"steps\">\n      <ol>\n")
	steps := strings.Split(data.VPC.ActionTaken, "\n")
	for _, step := range steps {
		step = strings.TrimSpace(step)
		if step != "" {
			html.WriteString(fmt.Sprintf("        <li>%s</li>\n", step))
		}
	}
	html.WriteString("      </ol>\n    </div>\n")

	if len(data.Attachments) > 0 {
		html.WriteString("    <div style=\"margin-top: 20px;\"><strong>Attachments:</strong></div>\n")
		html.WriteString("    <div class=\"attachments-gallery\">\n")
		for _, attachment := range data.Attachments {
			html.WriteString("      <div class=\"attachment-item\">\n")
			fileTypeIcon := "📄" // Default document icon
			switch {
			case strings.Contains(attachment.FileType, "image"):
				fileTypeIcon = "🖼️"
			case strings.Contains(attachment.FileType, "pdf"):
				fileTypeIcon = "📕"
			case strings.Contains(attachment.FileType, "video"):
				fileTypeIcon = "🎬"
			case strings.Contains(attachment.FileType, "audio"):
				fileTypeIcon = "🔊"
			case strings.Contains(attachment.FileType, "word"): // Example for docx
				fileTypeIcon = "📜"
			case strings.Contains(attachment.FileType, "excel") || strings.Contains(attachment.FileType, "spreadsheet"): // Example for xlsx
				fileTypeIcon = "📊"
			}
			uploaderName := "N/A"
			if attachment.Uploader.EmployeeNumber != "" {
				uploaderName = attachment.Uploader.EmployeeNumber
			}
			html.WriteString(fmt.Sprintf("        <p><span class=\"attachment-icon\">%s</span> <strong>%s</strong></p>\n", fileTypeIcon, attachment.FileName))
			html.WriteString(fmt.Sprintf("        <p>Size: %.2f MB</p>\n", float64(attachment.FileSize)/1024/1024))
			html.WriteString(fmt.Sprintf("        <p>Uploaded by: %s</p>\n", uploaderName))
			// In a real app, StoragePath would be a URL to download/view the attachment
			// html.WriteString(fmt.Sprintf("        <p><a href=\"%s\" target=\"_blank\">View/Download</a></p>\n", attachment.StoragePath))
			if strings.Contains(attachment.FileType, "image") && attachment.FileSize < 5*1024*1024 {
				// For actual image preview:
				// html.WriteString(fmt.Sprintf("        <img src=\"%s\" alt=\"%s\" style=\"max-width:100%%; height:auto; margin-top:10px;\">\n", attachment.StoragePath, attachment.FileName))
				html.WriteString("        <p style=\"font-size:0.8em; color:#777;\">(Image preview would be here if linked)</p>\n")
			}
			html.WriteString("      </div>\n")
		}
		html.WriteString("    </div>\n")
	}
	html.WriteString("  </div>\n")

	html.WriteString("  <div class=\"section\">\n")
	html.WriteString("    <h2 class=\"section-title\">Personnel Matrix</h2>\n")
	reporterName := "N/A"
	if data.Reporter.FirstName != "" {
		reporterName = fmt.Sprintf("%s %s (%s)", data.Reporter.FirstName, data.Reporter.LastName, data.Reporter.Position)
	}
	html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">Reported By:</span> <span class=\"value\">%s</span></div>\n", reporterName))

	creatorName := "N/A"
	if data.Creator.FirstName != "" {
		creatorName = fmt.Sprintf("%s %s (%s)", data.Creator.FirstName, data.Creator.LastName, data.Creator.Role)
	}
	html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">VPC Created By:</span> <span class=\"value\">%s</span></div>\n", creatorName))
	html.WriteString("  </div>\n")

	if options.IncludeStats {
		html.WriteString("  <div class=\"section\">\n")
		html.WriteString(fmt.Sprintf("    <h2 class=\"section-title\">Department Statistics: %s</h2>\n", data.VPC.Department))
		html.WriteString("    <table class=\"stats-table\">\n")
		html.WriteString("      <thead><tr><th>Metric</th><th>Value</th></tr></thead>\n")
		html.WriteString("      <tbody>\n")
		html.WriteString(fmt.Sprintf("        <tr><td>Total VPCs</td><td>%d</td></tr>\n", data.DepartmentStats.TotalVPCs))
		safePercent := 0.0
		if data.DepartmentStats.TotalVPCs > 0 {
			safePercent = (float64(data.DepartmentStats.SafeVPCs) / float64(data.DepartmentStats.TotalVPCs)) * 100
		}
		html.WriteString(fmt.Sprintf("        <tr><td>Safe VPCs</td><td>%d (%.1f%%)</td></tr>\n", data.DepartmentStats.SafeVPCs, safePercent))
		unsafePercent := 0.0
		if data.DepartmentStats.TotalVPCs > 0 {
			unsafePercent = (float64(data.DepartmentStats.UnsafeVPCs) / float64(data.DepartmentStats.TotalVPCs)) * 100
		}
		html.WriteString(fmt.Sprintf("        <tr><td>Unsafe VPCs</td><td>%d (%.1f%%)</td></tr>\n", data.DepartmentStats.UnsafeVPCs, unsafePercent))
		html.WriteString(fmt.Sprintf("        <tr><td>VPCs in last 90 days</td><td>%d</td></tr>\n", data.DepartmentStats.Last90DaysVPCs))
		html.WriteString("      </tbody>\n")
		html.WriteString("    </table>\n")

		if len(data.DepartmentStats.CategoryBreakdown) > 0 {
			html.WriteString("    <h3 style=\"margin-top:20px; font-size: 1.1em; color: #555;\">Category Breakdown:</h3>\n")
			html.WriteString("    <table class=\"stats-table\">\n")
			html.WriteString("      <thead><tr><th>Category</th><th>Count</th></tr></thead>\n")
			html.WriteString("      <tbody>\n")
			for category, count := range data.DepartmentStats.CategoryBreakdown {
				html.WriteString(fmt.Sprintf("        <tr><td>%s</td><td>%d</td></tr>\n", category, count))
			}
			html.WriteString("      </tbody>\n")
			html.WriteString("    </table>\n")
		}
		html.WriteString("  </div>\n") // End of department stats section

		// Role-specific content
		var roleSpecificTitle, roleSpecificContent string
		switch options.UserRole {
		case "safety_officer":
			roleSpecificTitle = "Emergency Protocols & Safety Guidelines"
			roleSpecificContent = "<p>This section contains emergency protocols and safety guidelines relevant to this incident, visible only to safety officers.</p><ul><li>Review immediate response checklist for similar incidents.</li><li>Ensure all involved personnel are aware of reporting follow-ups.</li><li>Verify safety equipment status related to this incident category.</li></ul>"
		case "manager":
			roleSpecificTitle = "Managerial Overview & Department Actions"
			roleSpecificContent = fmt.Sprintf("<p>Manager View: Insights for %s department.</p><ul><li>Discuss this VPC in the next team safety briefing.</li><li>Identify any trends by comparing with previous %d VPCs in the last 90 days.</li><li>Consider if additional training or resources are needed based on the 'Action Taken'.</li></ul>", data.VPC.Department, data.DepartmentStats.Last90DaysVPCs)
		case "admin":
			roleSpecificTitle = "Administrative Data & System Logs"
			roleSpecificContent = "<p>Admin View: System-level information for this VPC.</p><ul><li>VPC Entry Timestamp: [Placeholder for actual creation timestamp from DB if different from reported_date]</li><li>Last Modified: [Placeholder for last_modified timestamp]</li><li>Audit Trail: [Link or summary of audit trail if available]</li></ul><p><a href='#'>Export Raw Data for this VPC (Admin only link)</a></p>"
		}

		if roleSpecificTitle != "" {
			html.WriteString("  <div class=\"section\">\n")
			html.WriteString(fmt.Sprintf("    <h2 class=\"section-title\">%s</h2>\n", roleSpecificTitle))
			html.WriteString(fmt.Sprintf("    <div>%s</div>\n", roleSpecificContent))
			html.WriteString("  </div>\n")
		}
	}

	if len(data.ReportingManagers) > 0 {
		html.WriteString("  <div class=\"section\">\n")
		html.WriteString("    <h2 class=\"section-title\">Escalation Path</h2>\n")
		reporterNameEsc := "N/A"
		if data.Reporter.FirstName != "" {
			reporterNameEsc = fmt.Sprintf("%s %s (%s)", data.Reporter.FirstName, data.Reporter.LastName, data.Reporter.Position)
		}
		html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">Initial Reporter:</span> <span class=\"value\">%s</span></div>\n", reporterNameEsc))
		for i, manager := range data.ReportingManagers {
			managerName := "N/A"
			if manager.FirstName != "" {
				managerName = fmt.Sprintf("%s %s (%s)", manager.FirstName, manager.LastName, manager.Position)
			}
			html.WriteString(fmt.Sprintf("    <div class=\"row\"><span class=\"label\">Level %d Manager:</span> <span class=\"value\">%s</span></div>\n", i+1, managerName))
		}
		html.WriteString("  </div>\n")
	}

	html.WriteString("  <div class=\"footer\">\n")
	html.WriteString(fmt.Sprintf("    <p>Report generated by HealthSys © %d. Confidential.</p>\n", time.Now().Year()))
	html.WriteString("  </div>\n")
	html.WriteString("</div>\n") // End report-container
	html.WriteString("</body>\n</html>\n")

	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.SendString(html.String())
}