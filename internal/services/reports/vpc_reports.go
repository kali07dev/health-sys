package reports

import (
	"bytes"
	"fmt"
	"html/template"
	"sort"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"

	// "github.com/google/uuid"
	"github.com/jung-kurt/gofpdf"
	"gorm.io/gorm"

	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/utils"
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
	VPCID            string // Specific VPC ID for single reports
	StartDate        *time.Time
	EndDate          *time.Time
	UserRole         string // "admin", "safety_officer", "manager", "employee"
	OutputFormat     string // "pdf", "html", or "preview" (for lightweight HTML snippet)
	IncludeStats     bool
	DepartmentFilter string // For summary reports, e.g., "Operations" or "all"
	VPCTypeFilter    string // For summary reports, e.g., "safe", "unsafe", or "all"
	AggregationLevel string // For summary reports, e.g., "none", "daily", "weekly", "monthly"
	IsSummaryReport  bool   // Flag to distinguish summary from single VPC report
}

type SummaryReportData struct {
	Filters            ReportOptions // To show what filters were applied
	TotalVPCs          int64
	VPCsByType         map[string]int64
	VPCsByDepartment   map[string]int64 // If not filtering by a single department
	DateRangeCovered   string
	DataCompleteness   string // e.g., "Full data" or "Partial data based on filters"
	GeneratedTimestamp time.Time
	ReportTitle        string
	RecordCount        int    // For the >100 records warning
	EstimatedTime      string // For generation time hint
}

type PreviewTemplateData struct {
	VPC         *models.VPC        // For single VPC preview
	ReportData  *VPCReportData     // For single VPC preview, if more data needed
	SummaryData *SummaryReportData // For summary preview
	IsSummary   bool
	// Add any other fields your HTML templates might need
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
func (s *ReportService) GenerateVPCReport(c *fiber.Ctx, options ReportOptions) error {
	if options.IsSummaryReport {
		return s.generateSummaryReport(c, options)
	}
	return s.generateSingleVPCReport(c, options)
}

func (s *ReportService) generateSingleVPCReport(c *fiber.Ctx, options ReportOptions) error {
	if options.VPCID == "" {
		utils.LogError("VPCID is required for single VPC report", map[string]interface{}{"error": "VPCID is required for single VPC report"})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "VPCID is required for single VPC report"})
	}

	reportData, err := s.gatherReportData(options.VPCID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.LogError("Failed to find VPC record in ", map[string]interface{}{"error": err})
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": fmt.Sprintf("VPC with ID %s not found", options.VPCID)})
		}
		utils.LogError("Failed to find VPC record ", map[string]interface{}{"error": err})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("Error gathering data: %v", err)})
	}

	switch options.OutputFormat {
	case "pdf":
		return s.generateSingleVPCPDF(c, reportData, options)
	case "html":
		return s.generateSingleVPCHTML(c, reportData, options)
	case "preview":
		return s.generateSingleVPCPreview(c, reportData, options)
	default:
		utils.LogError( "Invalid output format for single VPC report", map[string]interface{}{"error":  "Invalid output format for single VPC report"})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid output format for single VPC report"})
	}
}

// gatherReportData collects all data required for the report
func (s *ReportService) gatherReportData(vpcID string) (*VPCReportData, error) {
	var vpc models.VPC
	result := s.DB.Preload("Attachments.Uploader").Where("id = ?", vpcID).First(&vpc)
	if result.Error != nil {
		utils.LogError("Failed to find VPC record in ", map[string]interface{}{"error": result.Error})
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

	// Get reporter employee details (if ReportedBy is Employee Number)
	var reporter models.Employee
	if err := s.DB.Where("id = ?", vpc.CreatedBy).First(&reporter).Error; err != nil {
		fmt.Printf("Warning: could not load reporter for VPC %s (reporter number %s): %v\n", vpcID, vpc.ReportedBy, err)
		// Potentially set reporter to a placeholder
	}

	reportManagers := s.getReportingManagers(&reporter) // Pass reporter even if not fully loaded, getReportingManagers handles nil ReportingManagerID

	deptStats := s.calculateDepartmentStatistics(vpc.Department)
	companyStats := s.calculateCompanyStatistics()

	reportID := fmt.Sprintf("%s-%s", vpc.VpcNumber, time.Now().Format("20060102-150405"))

	return &VPCReportData{
		VPC:                &vpc,
		Attachments:        vpc.Attachments, 
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
	if employee == nil || employee.ReportingManagerID == nil || *employee.ReportingManagerID == uuid.Nil {
		return managers
	}
	currentManagerID := *employee.ReportingManagerID
	for i := 0; i < 5; i++ {
		var manager models.Employee
		if err := s.DB.Where("id = ?", currentManagerID).First(&manager).Error; err != nil {
			break
		}
		managers = append(managers, manager)
		if manager.ReportingManagerID == nil || *manager.ReportingManagerID == uuid.Nil {
			break
		}
		currentManagerID = *manager.ReportingManagerID
	}
	return managers
}

// calculateDepartmentStatistics calculates safety stats for a department
func (s *ReportService) calculateDepartmentStatistics(department string) DepartmentStatistics {
	var stats DepartmentStatistics
	stats.CategoryBreakdown = make(map[string]int)
	var totalVPCs, safeVPCs, unsafeVPCs, last90DaysVPCs int64

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
	s.DB.Where("department = ?", department).Find(&vpcs)
	for _, vpc := range vpcs {
		if vpc.IncidentRelatesTo != "" {
			stats.CategoryBreakdown[vpc.IncidentRelatesTo]++
		}
	}
	return stats
}

// calculateCompanyStatistics computes company-wide safety statistics
func (s *ReportService) calculateCompanyStatistics() CompanyStatistics {
	var stats CompanyStatistics
	var totalVPCs, safeVPCs, unsafeVPCs int64
	s.DB.Model(&models.VPC{}).Count(&totalVPCs)
	stats.TotalVPCs = int(totalVPCs)
	s.DB.Model(&models.VPC{}).Where("vpc_type = ?", "safe").Count(&safeVPCs)
	stats.SafeVPCs = int(safeVPCs)
	s.DB.Model(&models.VPC{}).Where("vpc_type = ?", "unsafe").Count(&unsafeVPCs)
	stats.UnsafeVPCs = int(unsafeVPCs)
	var departments []string
	s.DB.Model(&models.VPC{}).Distinct().Pluck("department", &departments)
	for _, dept := range departments {
		if dept == "" { continue }
		var totalDeptVPCs, safeDeptVPCs int64
		s.DB.Model(&models.VPC{}).Where("department = ?", dept).Count(&totalDeptVPCs)
		s.DB.Model(&models.VPC{}).Where("department = ? AND vpc_type = ?", dept, "safe").Count(&safeDeptVPCs)
		safetyRatio := 0.0
		if totalDeptVPCs > 0 {
			safetyRatio = float64(safeDeptVPCs) / float64(totalDeptVPCs)
		}
		stats.DepartmentRanking = append(stats.DepartmentRanking, DepartmentRank{
			Department:  dept, TotalVPCs: int(totalDeptVPCs), SafetyRatio: safetyRatio,
		})
	}
	sort.Slice(stats.DepartmentRanking, func(i, j int) bool {
		return stats.DepartmentRanking[i].SafetyRatio > stats.DepartmentRanking[j].SafetyRatio
	})
	return stats
}

func (s *ReportService) generateSingleVPCPreview(c *fiber.Ctx, data *VPCReportData, options ReportOptions) error {
	// (Content from previous response, this is for NEW feature and should be fine)
	tmplString := `
        <div class="report-snippet p-4 bg-white rounded shadow-md">
            <meta name="record-count" content="1">
            <meta name="estimated-time" content="~1 sec">
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-semibold text-red-600">{{.VPC.VpcNumber}}</h3>
                <span class="px-2 py-0.5 text-xs font-medium rounded-full {{ if eq .VPC.VpcType "unsafe" }}bg-red-100 text-red-700{{ else }}bg-green-100 text-green-700{{ end }}">
                    {{.VPC.VpcType | ToUpper}}
                </span>
            </div>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-700 mb-3">
                <p><strong>Department:</strong> {{.VPC.Department}}</p>
                <p><strong>Reported:</strong> {{.VPC.ReportedDate.Format "Jan 02, 2006"}}</p>
                <p><strong>Category:</strong> {{.VPC.IncidentRelatesTo}}</p>
                <p><strong>Reported by:</strong> {{.ReportData.Reporter.FirstName}} {{.ReportData.Reporter.LastName}}</p>
            </div>
            <p class="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200"><strong>Description:</strong> {{.VPC.Description | Truncate 200}}</p>
            {{if .Options.IncludeStats}}
                {{if .ReportData.DepartmentStats.TotalVPCs }}
                <div class="mt-4 pt-3 border-t border-slate-200">
                    <h4 class="text-md font-medium text-slate-700 mb-1">Stats for {{.VPC.Department}}</h4>
                    <p class="text-xs text-slate-500">
                        Total: {{.ReportData.DepartmentStats.TotalVPCs}} |
                        Safe: {{.ReportData.DepartmentStats.SafeVPCs}} |
                        Unsafe: {{.ReportData.DepartmentStats.UnsafeVPCs}} |
                        Last 90 Days: {{.ReportData.DepartmentStats.Last90DaysVPCs}}
                    </p>
                </div>
                {{end}}
            {{end}}
        </div>
    `
	funcMap := template.FuncMap{
		"ToUpper": strings.ToUpper,
		"Truncate": func(s string, maxLen int) string {
			if len(s) <= maxLen { return s }
			runes := []rune(s)
			if len(runes) <= maxLen { return s }
			if maxLen < 3 { maxLen = 3 }
			return string(runes[0:maxLen-3]) + "..."
		},
	}
	tmpl, err := template.New("singleVPCPreview").Funcs(funcMap).Parse(tmplString)
	if err != nil { 
		utils.LogError("Error parsing preview template", map[string]interface{}{"error": err})
		return c.Status(500).SendString("Error parsing preview template: " + err.Error()) 
	}
	var buf bytes.Buffer
    templateData := struct {VPC *models.VPC; ReportData *VPCReportData; Options ReportOptions}{
        VPC: data.VPC, ReportData: data, Options: options,
    }
	if err := tmpl.Execute(&buf, templateData); err != nil { 
		utils.LogError("Error executing preview template", map[string]interface{}{"error": err})
		return c.Status(500).SendString("Error executing preview template: " + err.Error()) 
	}
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.Send(buf.Bytes())
}

func (s *ReportService) generateSingleVPCPDF(c *fiber.Ctx, data *VPCReportData, options ReportOptions) error {
	pdfBytes, err := s.createSinglePdfContent(data, options) // Calls the migrated original PDF logic
	if err != nil {
		utils.LogError("Failed to generate PDF content", map[string]interface{}{"error": err})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate PDF content: " + err.Error()})
	}
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"vpc-report-%s.pdf\"", data.VPC.VpcNumber))
	return c.Send(pdfBytes)
}

// generatePDFReport creates a PDF report
func (s *ReportService) createSinglePdfContent(data *VPCReportData, options ReportOptions) ([]byte, error) {
    pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(20, 20, 20)
	pdf.AddPage()
	pdf.SetAutoPageBreak(true, 20)
	
	// Add watermark based on VPCType (FROM ORIGINAL SNIPPET)
	if data.VPC.VpcType == "unsafe" {
		pdf.SetTextColor(200, 0, 0)
		pdf.SetFont("Helvetica", "B", 80)
		// pdf.SetXY(30, 100) // Original SetXY might need adjustment depending on when it's called
		pdf.TransformBegin()
		// Centering rotation point might be better: (page_width/2, page_height/2)
		// A4 width is 210mm, height is 297mm. Margins 20mm.
		// Printable width 170, height 257.
		// Center of page (approx): 105, 148
		// Center of printable area: (20+170/2), (20+257/2) = 105, 148.5
		pdf.TransformRotate(45, 105, 148) // Rotate around center of page
		pdf.Text(30, 150, "UNSAFE") // Adjust X, Y for rotated text placement
		pdf.TransformEnd()
		pdf.SetTextColor(0, 0, 0)
	} else {
		pdf.SetTextColor(0, 150, 0)
		pdf.SetFont("Helvetica", "B", 80)
		pdf.TransformBegin()
		pdf.TransformRotate(45, 105, 148)
		pdf.Text(40, 150, "SAFE")
		pdf.TransformEnd()
		pdf.SetTextColor(0, 0, 0)
	}
	
	// Add header (FROM ORIGINAL SNIPPET)
	pdf.SetFont("Helvetica", "B", 16)
	pdf.Cell(0, 10, "VPC Safety Report")
	pdf.Ln(10)
	
	// Add institution branding (FROM ORIGINAL SNIPPET)
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(0, 6, "Your Company Name") // Replace
	pdf.Ln(6)
	pdf.Cell(0, 6, "123 Business Street, City, Country") // Replace
	pdf.Ln(6)
	pdf.Cell(0, 6, "Phone: (123) 456-7890 | Email: safety@company.com") // Replace
	pdf.Ln(10)
	
	// Add report ID and generation timestamp (FROM ORIGINAL SNIPPET)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "Report ID:")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(0, 6, data.ReportID)
	pdf.Ln(6)
	
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "Generated on:")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(0, 6, data.GeneratedTimestamp.Format("January 02, 2006 15:04:05"))
	pdf.Ln(10)
	
	// Section Title Helper
	addSectionTitle := func(title string) {
		pdf.SetFillColor(240, 240, 240)
		pdf.SetFont("Helvetica", "B", 12)
		pdf.CellFormat(0, 8, title, "1", 1, "L", true, 0, "")
		pdf.Ln(5)
	}

	// Add VPC information section title (FROM ORIGINAL SNIPPET)
    addSectionTitle("Incident Summary")
	
	// Add VPC details (FROM ORIGINAL SNIPPET)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "VPC Number:")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(0, 6, data.VPC.VpcNumber)
	pdf.Ln(6)
	
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "Reported Date:")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(0, 6, data.VPC.ReportedDate.Format("January 02, 2006 15:04:05"))
	pdf.Ln(6)
	
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "Department:")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(0, 6, data.VPC.Department)
	pdf.Ln(6)
	
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "Incident Relates To:")
	pdf.SetFont("Helvetica", "", 10)
	pdf.Cell(0, 6, data.VPC.IncidentRelatesTo)
	pdf.Ln(6)
	
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "Safety Type:")
	pdf.SetFont("Helvetica", "B", 10) // Make type bold
	if data.VPC.VpcType == "unsafe" {
		currentR, currentG, currentB := pdf.GetTextColor()
		pdf.SetTextColor(200, 0, 0)
		pdf.Cell(0, 6, "UNSAFE")
		pdf.SetTextColor(currentR, currentG, currentB)
	} else {
		currentR, currentG, currentB := pdf.GetTextColor()
		pdf.SetTextColor(0, 150, 0)
		pdf.Cell(0, 6, "SAFE")
		pdf.SetTextColor(currentR, currentG, currentB)
	}
	pdf.Ln(10)
	
	// Add narrative analysis section title (FROM ORIGINAL SNIPPET)
    addSectionTitle("Narrative Analysis")
	
	// Add description (FROM ORIGINAL SNIPPET)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(0, 6, "Description:")
	pdf.Ln(6)
	pdf.SetFont("Helvetica", "I", 10)
	pdf.MultiCell(0, 6, fmt.Sprintf("\"%s\"", data.VPC.Description), "", "L", false)
	pdf.Ln(5)
	
	// Add action taken (FROM ORIGINAL SNIPPET)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(0, 6, "Action Taken:")
	pdf.Ln(6)
	pdf.SetFont("Helvetica", "", 10)
	steps := strings.Split(data.VPC.ActionTaken, "\n")
	for i, step := range steps {
		step = strings.TrimSpace(step)
		if step != "" {
			pdf.CellFormat(10, 6, fmt.Sprintf("%d.", i+1), "", 0, "L", false, 0, "")
			pdf.MultiCell(0, 6, step, "", "L", false)
		}
	}
	pdf.Ln(5)
	
	// Add attachments gallery (FROM ORIGINAL SNIPPET)
	if len(data.Attachments) > 0 {
        addSectionTitle("Attachments")
		pdf.SetFont("Helvetica", "B", 10)
		// pdf.Cell(0, 6, "Attachments:") // Title now added by addSectionTitle
		// pdf.Ln(8) // Spacing adjusted by addSectionTitle
		
		for _, attachment := range data.Attachments {
			fileTypeIcon := "📄"
			switch {
			case strings.Contains(attachment.FileType, "image"): fileTypeIcon = "🖼️"
			case strings.Contains(attachment.FileType, "pdf"): fileTypeIcon = "📕"
			case strings.Contains(attachment.FileType, "video"): fileTypeIcon = "🎬"
			case strings.Contains(attachment.FileType, "audio"): fileTypeIcon = "🔊"
			}
			
            uploaderName := "N/A"
            if attachment.Uploader.ID != uuid.Nil { // Check if uploader has been loaded
                 uploaderName = fmt.Sprintf("%s %s (%s)", attachment.Uploader.FirstName, attachment.Uploader.LastName, attachment.Uploader.EmployeeNumber)
            } else if attachment.UploadedBy != uuid.Nil { // Fallback to UploadedByID if Uploader object not loaded
                 // You might want to fetch uploader details here if critical and not preloaded
                 uploaderName = fmt.Sprintf("ID: %s", attachment.UploadedBy.String())
            }


			pdf.SetFont("Helvetica", "", 10) // Font for icon
			pdf.CellFormat(10, 6, fileTypeIcon, "", 0, "L", false, 0, "")
			pdf.SetFont("Helvetica", "", 10) // Font for text
			pdf.CellFormat(80, 6, attachment.FileName, "", 0, "L", false, 0, "") // Filename
			pdf.CellFormat(30, 6, fmt.Sprintf("%.2f MB", float64(attachment.FileSize)/1024/1024), "", 0, "R", false, 0, "") // Size
			pdf.CellFormat(0, 6, fmt.Sprintf("By: %s", uploaderName), "", 1, "L", false, 0, "") // Uploader

			if strings.Contains(attachment.FileType, "image") && attachment.FileSize < 5*1024*1024 {
				pdf.Ln(2)
				pdf.SetFont("Helvetica", "I", 8)
				pdf.CellFormat(0, 6, "(Image preview placeholder - actual image loading not implemented here)", "", 1, "L", false, 0, "")
				pdf.Ln(4)
			}
		}
        pdf.Ln(5)
	}
	
	// Add personnel matrix section title (FROM ORIGINAL SNIPPET)
    addSectionTitle("Personnel Matrix")
	
	// Add reporter information (FROM ORIGINAL SNIPPET)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "Reported By:")
	pdf.SetFont("Helvetica", "", 10)
    reporterFullName := "N/A"
    if data.Reporter.ID != uuid.Nil {
        reporterFullName = fmt.Sprintf("%s %s (%s)", data.Reporter.FirstName, data.Reporter.LastName, data.Reporter.Position)
    }
	pdf.Cell(0, 6, reporterFullName)
	pdf.Ln(6)
	
	// Add creator information (FROM ORIGINAL SNIPPET)
	pdf.SetFont("Helvetica", "B", 10)
	pdf.Cell(50, 6, "VPC Created By:")
	pdf.SetFont("Helvetica", "", 10)
    creatorFullName := "N/A"
    if data.Creator.ID != uuid.Nil {
        creatorFullName = fmt.Sprintf("%s %s (%s)", data.Creator.FirstName, data.Creator.LastName, data.Creator.Role)
    }
	pdf.Cell(0, 6, creatorFullName)
	pdf.Ln(10)
	
	// Add statistics if requested (FROM ORIGINAL SNIPPET)
	if options.IncludeStats {
        if pdf.GetY() > 220 { pdf.AddPage() } // Check space before adding new section
        addSectionTitle(fmt.Sprintf("Department Statistics (%s)", data.VPC.Department))
		
		pdf.SetFont("Helvetica", "B", 10)
		// pdf.Cell(0, 6, fmt.Sprintf("Department: %s", data.VPC.Department)) // Already in title
		// pdf.Ln(8)
		
		pdf.SetFont("Helvetica", "", 10)
		pdf.CellFormat(100, 6, "Total VPCs:", "", 0, "L", false, 0, "")
		pdf.CellFormat(0, 6, fmt.Sprintf("%d", data.DepartmentStats.TotalVPCs), "", 1, "R", false, 0, "")
		
        safePercent := 0.0
        if data.DepartmentStats.TotalVPCs > 0 { safePercent = (float64(data.DepartmentStats.SafeVPCs) / float64(data.DepartmentStats.TotalVPCs)) * 100 }
		pdf.CellFormat(100, 6, "Safe VPCs:", "", 0, "L", false, 0, "")
		pdf.CellFormat(0, 6, fmt.Sprintf("%d (%.1f%%)", data.DepartmentStats.SafeVPCs, safePercent), "", 1, "R", false, 0, "")
		
        unsafePercent := 0.0
        if data.DepartmentStats.TotalVPCs > 0 { unsafePercent = (float64(data.DepartmentStats.UnsafeVPCs) / float64(data.DepartmentStats.TotalVPCs)) * 100 }
		pdf.CellFormat(100, 6, "Unsafe VPCs:", "", 0, "L", false, 0, "")
		pdf.CellFormat(0, 6, fmt.Sprintf("%d (%.1f%%)", data.DepartmentStats.UnsafeVPCs, unsafePercent), "", 1, "R", false, 0, "")
		
		pdf.CellFormat(100, 6, "VPCs in last 90 days:", "", 0, "L", false, 0, "")
		pdf.CellFormat(0, 6, fmt.Sprintf("%d", data.DepartmentStats.Last90DaysVPCs), "", 1, "R", false, 0, "")
		pdf.Ln(5)
		
		pdf.SetFont("Helvetica", "B", 10)
		pdf.Cell(0, 6, "Category Breakdown:")
		pdf.Ln(6)
		pdf.SetFont("Helvetica", "", 10)
		for category, count := range data.DepartmentStats.CategoryBreakdown {
			pdf.CellFormat(100, 6, category+":", "", 0, "L", false, 0, "")
			pdf.CellFormat(0, 6, fmt.Sprintf("%d", count), "", 1, "R", false, 0, "")
		}
        pdf.Ln(5)
		
		// Add role-specific content (FROM ORIGINAL SNIPPET - placeholder text)
        // This part can be dynamic based on options.UserRole
		if options.UserRole == "safety_officer" {
            if pdf.GetY() > 220 { pdf.AddPage() }
			addSectionTitle("Emergency Protocols (Safety Officer View)")
			pdf.SetFont("Helvetica", "", 10)
			pdf.MultiCell(0, 6, "This section would contain emergency protocols visible only to safety officers. Specific details relevant to the incident category and severity would be listed here, including contact persons, evacuation procedures if applicable, and first aid guidance related to potential hazards.", "", "L", false)
			pdf.Ln(5)
		} else if options.UserRole == "manager" {
            if pdf.GetY() > 220 { pdf.AddPage() }
            addSectionTitle("Department Comparison & Actions (Manager View)")
			pdf.SetFont("Helvetica", "", 10)
			pdf.MultiCell(0, 6, "This section would contain department comparison charts, trend analysis, and actionable insights for managers. It might include safety performance relative to other departments or past periods, and suggestions for team discussions or follow-up actions.", "", "L", false)
			pdf.Ln(5)
		} else if options.UserRole == "admin" {
            if pdf.GetY() > 220 { pdf.AddPage() }
            addSectionTitle("Raw Data Access & Audit (Admin View)")
			pdf.SetFont("Helvetica", "", 10)
			pdf.MultiCell(0, 6, "This section would provide options for raw data export, system logs related to this VPC entry, and audit trails. It's designed for administrative oversight and data integrity checks.", "", "L", false)
			pdf.Ln(5)
		}
	}
	
	// Add escalation path if available (FROM ORIGINAL SNIPPET)
	if len(data.ReportingManagers) > 0 {
        if pdf.GetY() > 230 { pdf.AddPage() }
        addSectionTitle("Escalation Path")
		pdf.SetFont("Helvetica", "", 10)
        reporterEscName := "N/A"
        if data.Reporter.ID != uuid.Nil {
             reporterEscName = fmt.Sprintf("%s %s (%s)", data.Reporter.FirstName, data.Reporter.LastName, data.Reporter.Position)
        }
		pdf.Cell(0, 6, fmt.Sprintf("Initial Reporter: %s", reporterEscName))
		pdf.Ln(6)
		
		for i, manager := range data.ReportingManagers {
            managerEscName := "N/A"
            if manager.ID != uuid.Nil {
                managerEscName = fmt.Sprintf("%s %s (%s)", manager.FirstName, manager.LastName, manager.Position)
            }
			pdf.Cell(0, 6, fmt.Sprintf("Level %d Manager: %s", i+1, managerEscName))
			pdf.Ln(6)
		}
	}
	
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
func (s *ReportService) generateSingleVPCHTML(c *fiber.Ctx, data *VPCReportData, options ReportOptions) error {
	htmlString, err := s.createSingleHtmlContent(data, options) // Calls the migrated original HTML logic
	if err != nil {
		utils.LogError("Failed to generate HTML content", map[string]interface{}{"error": err})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate HTML content: " + err.Error()})
	}
	c.Set("Content-Type", "text/html; charset=utf-8")
	// For full HTML page, usually served directly, not as attachment for direct viewing
	// c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"vpc-report-%s.html\"", data.VPC.VpcNumber))
	return c.SendString(htmlString)
}

// generateHTMLReport creates an HTML report
func (s *ReportService) createSingleHtmlContent(data *VPCReportData, options ReportOptions) (string, error) {
    var html strings.Builder

	// Begin HTML document (FROM ORIGINAL SNIPPET)
	html.WriteString("<!DOCTYPE html>\n")
	html.WriteString("<html lang=\"en\">\n<head>\n")
	html.WriteString("<meta charset=\"UTF-8\">\n")
	html.WriteString("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n")
	html.WriteString(fmt.Sprintf("<title>VPC Safety Report - %s</title>\n", data.VPC.VpcNumber)) // Dynamic title
	// Enhanced CSS for a cleaner look (FROM ORIGINAL SNIPPET, with some improvements)
	html.WriteString("<style>\n")
	html.WriteString("body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f7f6; color: #333; }\n")
	html.WriteString(".report-container { max-width: 800px; margin: 20px auto; background-color: #fff; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: relative; }\n")
	html.WriteString(".header { text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; }\n")
    html.WriteString(".header h1 { margin-bottom: 5px; } \n")
    html.WriteString(".header p { margin: 3px 0; font-size: 0.9em; color: #555; } \n")
	html.WriteString(".section { margin-bottom: 25px; }\n")
	html.WriteString(".section-title { font-size: 1.2em; font-weight: bold; color: #333; background-color: #f0f0f0; padding: 10px; border: 1px solid #ddd; border-radius: 4px 4px 0 0; margin-top:0; margin-bottom:0; }\n")
    html.WriteString(".section-content { padding: 15px; border: 1px solid #ddd; border-top:none; border-radius: 0 0 4px 4px; }\n")
	html.WriteString(".label { font-weight: bold; width: 170px; display: inline-block; color: #444; }\n")
	html.WriteString(".row { margin-bottom: 8px; display: flex; }\n")
    html.WriteString(".row .label { flex-shrink: 0; } \n")
    html.WriteString(".row .value { flex-grow: 1; } \n")
	html.WriteString(".description { font-style: italic; margin: 10px 0; padding:10px; background-color:#f9f9f9; border-left: 3px solid #ccc; }\n")
	html.WriteString(".steps ol { margin-left: 0; padding-left: 20px; }\n")
    html.WriteString(".steps li { margin-bottom: 5px; }\n")
	html.WriteString(".attachments-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top:10px; }\n")
	html.WriteString(".attachment-item { border: 1px solid #e0e0e0; padding: 12px; border-radius: 4px; background-color: #fdfdfd; }\n")
    html.WriteString(".attachment-item p { margin: 3px 0; font-size: 0.9em; } \n")
	html.WriteString(".attachment-icon { font-size: 24px; margin-right: 8px; }\n")

	if data.VPC.VpcType == "unsafe" {
		html.WriteString(".watermark { position: absolute; font-size: 10vw; font-weight:bold; color: rgba(255, 0, 0, 0.08); transform: rotate(-35deg); top: 35%; left: 10%; z-index: 0; pointer-events:none; }\n")
		html.WriteString(".report-container { border-top: 5px solid #d32f2f; }\n") // Red accent
		html.WriteString(".safety-badge { background-color: #d32f2f; color: white; padding: 5px 10px; border-radius: 15px; font-size:0.9em; display:inline-block; }\n")
	} else {
		html.WriteString(".watermark { position: absolute; font-size: 10vw; font-weight:bold; color: rgba(0, 150, 0, 0.08); transform: rotate(-35deg); top: 35%; left: 10%; z-index: 0; pointer-events:none; }\n")
		html.WriteString(".report-container { border-top: 5px solid #388e3c; }\n") // Green accent
		html.WriteString(".safety-badge { background-color: #388e3c; color: white; padding: 5px 10px; border-radius: 15px; font-size:0.9em; display:inline-block; }\n")
	}
	html.WriteString("</style>\n</head>\n<body>\n")

	html.WriteString("<div class=\"report-container\">\n")
	if data.VPC.VpcType == "unsafe" { html.WriteString("<div class=\"watermark\">UNSAFE</div>\n") } else { html.WriteString("<div class=\"watermark\">SAFE</div>\n") }

	html.WriteString("<div class=\"header\">\n")
	html.WriteString("<h1>VPC Safety Report</h1>\n")
	html.WriteString("<p>Your Company Name</p>\n") // Replace
	html.WriteString("<p>123 Business Street, City, Country</p>\n") // Replace
	html.WriteString("<p>Phone: (123) 456-7890 | Email: safety@company.com</p>\n") // Replace
	html.WriteString("<p><strong>Report ID:</strong> " + data.ReportID + "</p>\n")
	html.WriteString("<p><strong>Generated on:</strong> " + data.GeneratedTimestamp.Format("January 02, 2006 15:04:05") + "</p>\n")
	html.WriteString("</div>\n")

    html.WriteString("<div class=\"section\">\n<h2 class=\"section-title\">Incident Summary</h2><div class=\"section-content\">\n")
	html.WriteString("<div class=\"row\"><span class=\"label\">VPC Number:</span> <span class=\"value\">" + data.VPC.VpcNumber + "</span></div>\n")
	html.WriteString("<div class=\"row\"><span class=\"label\">Reported Date:</span> <span class=\"value\">" + data.VPC.ReportedDate.Format("January 02, 2006 15:04:05") + "</span></div>\n")
	html.WriteString("<div class=\"row\"><span class=\"label\">Department:</span> <span class=\"value\">" + data.VPC.Department + "</span></div>\n")
	html.WriteString("<div class=\"row\"><span class=\"label\">Incident Relates To:</span> <span class=\"value\">" + data.VPC.IncidentRelatesTo + "</span></div>\n")
	html.WriteString("<div class=\"row\"><span class=\"label\">Safety Type:</span> <span class=\"value\"><span class=\"safety-badge\">" + strings.ToUpper(data.VPC.VpcType) + "</span></span></div>\n")
	html.WriteString("</div></div>\n")

    html.WriteString("<div class=\"section\">\n<h2 class=\"section-title\">Narrative Analysis</h2><div class=\"section-content\">\n")
	html.WriteString("<div><strong>Description:</strong></div>\n")
	html.WriteString("<div class=\"description\">\"" + data.VPC.Description + "\"</div>\n")
	html.WriteString("<div style=\"margin-top:15px;\"><strong>Action Taken:</strong></div>\n")
	html.WriteString("<div class=\"steps\"><ol>\n")
	actionSteps := strings.Split(data.VPC.ActionTaken, "\n")
	for _, step := range actionSteps {
        s := strings.TrimSpace(step)
		if s != "" { html.WriteString("<li>" + s + "</li>\n") }
	}
	html.WriteString("</ol></div>\n")
    html.WriteString("</div></div>\n")

	if len(data.Attachments) > 0 {
        html.WriteString("<div class=\"section\">\n<h2 class=\"section-title\">Attachments</h2><div class=\"section-content\">\n")
		html.WriteString("<div class=\"attachments-gallery\">\n")
		for _, attachment := range data.Attachments {
			html.WriteString("<div class=\"attachment-item\">\n")
			fileTypeIcon := "📄";
            if strings.Contains(attachment.FileType, "image") { fileTypeIcon = "🖼️" }
            if strings.Contains(attachment.FileType, "pdf") { fileTypeIcon = "📕" }
            if strings.Contains(attachment.FileType, "video") { fileTypeIcon = "🎬" }
            if strings.Contains(attachment.FileType, "audio") { fileTypeIcon = "🔊" }
            uploaderName := "N/A"
            if attachment.Uploader.ID != uuid.Nil { uploaderName = fmt.Sprintf("%s %s (%s)", attachment.Uploader.FirstName, attachment.Uploader.LastName, attachment.Uploader.EmployeeNumber) }

			html.WriteString("<p><span class=\"attachment-icon\">" + fileTypeIcon + "</span><strong>" + attachment.FileName + "</strong></p>\n")
            html.WriteString(fmt.Sprintf("<p><small>Size: %.2f MB | Uploaded by: %s</small></p>\n", float64(attachment.FileSize)/1024/1024, uploaderName))
			// Image preview placeholder for HTML (actual image serving not included here)
			if strings.Contains(attachment.FileType, "image") && attachment.FileSize < 5*1024*1024 {
                html.WriteString("<p><small><em>(Image preview would be here)</em></small></p>\n")
            }
			html.WriteString("</div>\n")
		}
		html.WriteString("</div>\n</div></div>\n")
	}

    html.WriteString("<div class=\"section\">\n<h2 class=\"section-title\">Personnel Matrix</h2><div class=\"section-content\">\n")
    reporterFullName := "N/A"; if data.Reporter.ID != uuid.Nil { reporterFullName = fmt.Sprintf("%s %s (%s)", data.Reporter.FirstName, data.Reporter.LastName, data.Reporter.Position) }
    creatorFullName := "N/A"; if data.Creator.ID != uuid.Nil { creatorFullName = fmt.Sprintf("%s %s (%s)", data.Creator.FirstName, data.Creator.LastName, data.Creator.Role) }
	html.WriteString("<div class=\"row\"><span class=\"label\">Reported By:</span> <span class=\"value\">" + reporterFullName + "</span></div>\n")
	html.WriteString("<div class=\"row\"><span class=\"label\">VPC Created By:</span> <span class=\"value\">" + creatorFullName + "</span></div>\n")
	html.WriteString("</div></div>\n")

	if options.IncludeStats {
        html.WriteString("<div class=\"section\">\n<h2 class=\"section-title\">Department Statistics: " + data.VPC.Department + "</h2><div class=\"section-content\">\n")
        html.WriteString("<table style='width:100%; border-collapse:collapse; font-size:0.9em;'><thead><tr style='background-color:#f0f0f0;'><th style='border:1px solid #ddd; padding:8px;'>Metric</th><th style='border:1px solid #ddd; padding:8px;'>Value</th></tr></thead><tbody>\n")
        html.WriteString(fmt.Sprintf("<tr><td style='border:1px solid #ddd; padding:8px;'>Total VPCs</td><td style='border:1px solid #ddd; padding:8px;'>%d</td></tr>\n", data.DepartmentStats.TotalVPCs))
        safePercent := 0.0; if data.DepartmentStats.TotalVPCs > 0 { safePercent = (float64(data.DepartmentStats.SafeVPCs) / float64(data.DepartmentStats.TotalVPCs)) * 100 }
        html.WriteString(fmt.Sprintf("<tr><td style='border:1px solid #ddd; padding:8px;'>Safe VPCs</td><td style='border:1px solid #ddd; padding:8px;'>%d (%.1f%%)</td></tr>\n", data.DepartmentStats.SafeVPCs, safePercent))
        unsafePercent := 0.0; if data.DepartmentStats.TotalVPCs > 0 { unsafePercent = (float64(data.DepartmentStats.UnsafeVPCs) / float64(data.DepartmentStats.TotalVPCs)) * 100 }
		html.WriteString(fmt.Sprintf("<tr><td style='border:1px solid #ddd; padding:8px;'>Unsafe VPCs</td><td style='border:1px solid #ddd; padding:8px;'>%d (%.1f%%)</td></tr>\n", data.DepartmentStats.UnsafeVPCs, unsafePercent))
		html.WriteString(fmt.Sprintf("<tr><td style='border:1px solid #ddd; padding:8px;'>VPCs in last 90 days</td><td style='border:1px solid #ddd; padding:8px;'>%d</td></tr>\n", data.DepartmentStats.Last90DaysVPCs))
        html.WriteString("</tbody></table>\n")

        if len(data.DepartmentStats.CategoryBreakdown) > 0 {
            html.WriteString("<h3 style='margin-top:20px; font-size:1.1em;'>Category Breakdown:</h3><table style='width:100%; border-collapse:collapse; font-size:0.9em;'><thead><tr style='background-color:#f0f0f0;'><th style='border:1px solid #ddd; padding:8px;'>Category</th><th style='border:1px solid #ddd; padding:8px;'>Count</th></tr></thead><tbody>\n")
            for cat, count := range data.DepartmentStats.CategoryBreakdown {
                html.WriteString(fmt.Sprintf("<tr><td style='border:1px solid #ddd; padding:8px;'>%s</td><td style='border:1px solid #ddd; padding:8px;'>%d</td></tr>\n", cat, count))
            }
            html.WriteString("</tbody></table>\n")
        }
        // Role specific HTML content (placeholders from original)
        if options.UserRole == "safety_officer" {
            html.WriteString("<div style='margin-top:20px; padding:10px; background-color:#fff8e1; border:1px solid #ffecb3; border-radius:4px;'><h4>Emergency Protocols (Safety Officer View)</h4><p>Details of protocols specific to this incident category...</p></div>\n")
        } else if options.UserRole == "manager" {
             html.WriteString("<div style='margin-top:20px; padding:10px; background-color:#e3f2fd; border:1px solid #bbdefb; border-radius:4px;'><h4>Department Comparison (Manager View)</h4><p>Department comparison charts and insights...</p></div>\n")
        } else if options.UserRole == "admin" {
            html.WriteString("<div style='margin-top:20px; padding:10px; background-color:#f3e5f5; border:1px solid #e1bee7; border-radius:4px;'><h4>Raw Data Access (Admin View)</h4><p>Raw data export options and audit trails...</p></div>\n")
        }
        html.WriteString("</div></div>\n") // End section-content and section for stats
	}

    if len(data.ReportingManagers) > 0 {
        html.WriteString("<div class=\"section\">\n<h2 class=\"section-title\">Escalation Path</h2><div class=\"section-content\">\n")
        reporterEscName := "N/A"; if data.Reporter.ID != uuid.Nil { reporterEscName = fmt.Sprintf("%s %s (%s)", data.Reporter.FirstName, data.Reporter.LastName, data.Reporter.Position) }
        html.WriteString("<div class=\"row\"><span class=\"label\">Initial Reporter:</span> <span class=\"value\">" + reporterEscName + "</span></div>\n")
        for i, manager := range data.ReportingManagers {
            managerEscName := "N/A"; if manager.ID != uuid.Nil { managerEscName = fmt.Sprintf("%s %s (%s)", manager.FirstName, manager.LastName, manager.Position) }
            html.WriteString(fmt.Sprintf("<div class=\"row\"><span class=\"label\">Level %d Manager:</span> <span class=\"value\">%s</span></div>\n", i+1, managerEscName))
        }
        html.WriteString("</div></div>\n")
    }

	html.WriteString("</div>\n</body>\n</html>\n")
	return html.String(), nil
}
