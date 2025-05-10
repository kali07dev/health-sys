package reports

import (
	"bytes"
	"fmt"
	"html/template"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/utils"

	// "github.com/jung-kurt/gofpdf"
	"github.com/go-pdf/fpdf"
)

func setupPdfPage(pdf *fpdf.Fpdf, companyName string, reportType string, genTimestamp time.Time) {
	pdf.SetMargins(20, 20, 20) // Consistent margins
	pdf.SetAutoPageBreak(true, 20)

	// Header function
	pdf.SetHeaderFunc(func() {
		pdf.SetFillColor(153, 0, 0)  // Dark Red (#990000)
		pdf.Rect(0, 0, 210, 20, "F") // Full width header bar at the top
		pdf.SetFont("Helvetica", "B", 16)
		pdf.SetTextColor(255, 255, 255) // White text
		currentX, currentY := pdf.GetXY()
		pdf.SetXY(20, 5) // Position within the header bar
		pdf.CellFormat(0, 10, companyName, "", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 10)
		pdf.SetXY(20, 5) // Reset X to align right or use specific X
		pdf.CellFormat(0, 10, reportType, "", 0, "R", false, 0, "")
		pdf.SetXY(currentX, currentY+15) // Move below header bar area + small margin
		pdf.SetTextColor(0, 0, 0)        // Reset text color
	})

	// Footer function
	pdf.SetFooterFunc(func() {
		pdf.SetY(-15) // Position at 1.5 cm from bottom
		pdf.SetFont("Helvetica", "I", 8)
		pdf.SetTextColor(119, 119, 119) // Gray (#777777)
		footerText := fmt.Sprintf("Generated on: %s  •  © %d %s. All rights reserved.  •  System-Generated Report",
			genTimestamp.Format("January 02, 2006 15:04 MST"),
			genTimestamp.Year(),
			companyName,
		)
		pdf.CellFormat(0, 10, footerText, "T", 0, "C", false, 0, "")
		pdf.SetTextColor(0, 0, 0) // Reset text color
	})
}

// PDF Section Title Helper
func addSectionTitlePDF(pdf *fpdf.Fpdf, title string) {
	pdf.SetFillColor(204, 0, 0)     // Dark Red (#CC0000)
	pdf.SetTextColor(255, 255, 255) // White
	pdf.SetFont("Helvetica", "B", 12)
	// Using CellFormat with fill, no border for a solid bar look. Height 8.
	pdf.CellFormat(0, 8, " "+title, "", 1, "L", true, 0, "") // Added a space for padding
	pdf.SetTextColor(0, 0, 0)                                // Reset to black for subsequent text
	pdf.Ln(5)
}
func (s *ReportService) generateSummaryReport(c *fiber.Ctx, options ReportOptions) error {
	summaryData, err := s.gatherSummaryReportData(options)
	if err != nil {
		utils.LogError("VPCID is required for single VPC report", map[string]interface{}{"error": err})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": fmt.Sprintf("Error gathering summary data: %v", err)})
	}

	switch options.OutputFormat {
	case "pdf":
		return s.generateSummaryPDF(c, summaryData, options)
	case "html":
		return s.generateSummaryHTML(c, summaryData, options)
	case "preview":
		return s.generateSummaryPreview(c, summaryData, options)
	default:
		utils.LogError("Invalid output format for summary report", map[string]interface{}{"outputFormat": options.OutputFormat})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid output format for summary report"})
	}
}

func (s *ReportService) gatherSummaryReportData(options ReportOptions) (*SummaryReportData, error) {
	data := &SummaryReportData{
		Filters:            options,
		VPCsByType:         make(map[string]int64),
		VPCsByDepartment:   make(map[string]int64),
		GeneratedTimestamp: time.Now(),
		ReportTitle:        "VPC Summary Report",
		EstimatedTime:      "~5-15 sec",
	}

	baseQuery := s.DB.Model(&models.VPC{})

	if options.StartDate != nil {
		baseQuery = baseQuery.Where("reported_date >= ?", *options.StartDate)
		data.ReportTitle += fmt.Sprintf(" from %s", options.StartDate.Format("Jan 2, 2006"))
	}
	if options.EndDate != nil {
		endOfDay := time.Date(options.EndDate.Year(), options.EndDate.Month(), options.EndDate.Day(), 23, 59, 59, 0, options.EndDate.Location())
		baseQuery = baseQuery.Where("reported_date <= ?", endOfDay)
		data.ReportTitle += fmt.Sprintf(" to %s", options.EndDate.Format("Jan 2, 2006"))
	}
	if options.DepartmentFilter != "" && options.DepartmentFilter != "all" {
		baseQuery = baseQuery.Where("department = ?", options.DepartmentFilter)
		data.ReportTitle += fmt.Sprintf(" for Dept: %s", options.DepartmentFilter)
	}
	if options.VPCTypeFilter != "" && options.VPCTypeFilter != "all" {
		baseQuery = baseQuery.Where("vpc_type = ?", options.VPCTypeFilter)
		data.ReportTitle += fmt.Sprintf(" (Type: %s)", options.VPCTypeFilter)
	}

	if err := baseQuery.Count(&data.TotalVPCs).Error; err != nil {
		utils.LogError("Error counting total VPCs", map[string]interface{}{"error": err})
		return nil, fmt.Errorf("counting total VPCs: %w", err)
	}
	data.RecordCount = int(data.TotalVPCs)

	typeCounts := []struct {
		VpcType string
		Count   int64
	}{}
	if err := baseQuery.Select("vpc_type, COUNT(*) as count").Group("vpc_type").Scan(&typeCounts).Error; err != nil {
		utils.LogError("Error counting VPCs by type", map[string]interface{}{"error": err})
		return nil, fmt.Errorf("counting VPCs by type: %w", err)
	}
	for _, tc := range typeCounts {
		data.VPCsByType[tc.VpcType] = tc.Count
	}

	if options.DepartmentFilter == "" || options.DepartmentFilter == "all" {
		deptCounts := []struct {
			Department string
			Count      int64
		}{}
		deptAggQuery := s.DB.Model(&models.VPC{})
		if options.StartDate != nil {
			deptAggQuery = deptAggQuery.Where("reported_date >= ?", *options.StartDate)
		}
		if options.EndDate != nil {
			endOfDay := time.Date(options.EndDate.Year(), options.EndDate.Month(), options.EndDate.Day(), 23, 59, 59, 0, options.EndDate.Location())
			deptAggQuery = deptAggQuery.Where("reported_date <= ?", endOfDay)
		}
		if options.VPCTypeFilter != "" && options.VPCTypeFilter != "all" {
			deptAggQuery = deptAggQuery.Where("vpc_type = ?", options.VPCTypeFilter)
		}
		if err := deptAggQuery.Select("department, COUNT(*) as count").Where("department IS NOT NULL AND department != ''").Group("department").Scan(&deptCounts).Error; err != nil {
			utils.LogError("Error counting VPCs by department", map[string]interface{}{"error": err})
			return nil, fmt.Errorf("counting VPCs by department: %w", err)
		}
		for _, dc := range deptCounts {
			data.VPCsByDepartment[dc.Department] = dc.Count
		}
	}

	if options.StartDate != nil && options.EndDate != nil {
		data.DateRangeCovered = fmt.Sprintf("%s to %s", options.StartDate.Format("Jan 02, 2006"), options.EndDate.Format("Jan 02, 2006"))
	} else if options.StartDate != nil {
		data.DateRangeCovered = fmt.Sprintf("From %s", options.StartDate.Format("Jan 02, 2006"))
	} else if options.EndDate != nil {
		data.DateRangeCovered = fmt.Sprintf("Up to %s", options.EndDate.Format("Jan 02, 2006"))
	} else {
		data.DateRangeCovered = "All time"
	}

	data.DataCompleteness = "Filtered data based on selections."

	if data.RecordCount > 500 {
		data.EstimatedTime = "~30-90 sec"
	} else if data.RecordCount > 100 {
		data.EstimatedTime = "~10-30 sec"
	}

	// TODO: AggregationLevel
	return data, nil
}

func (s *ReportService) generateSummaryPreview(c *fiber.Ctx, data *SummaryReportData, options ReportOptions) error {
	// (Content from previous response, this is for NEW feature and should be fine)
	tmplString := `
        <div class="report-snippet p-4 bg-white rounded shadow-md">
            <meta name="record-count" content="{{.SummaryData.RecordCount}}">
            <meta name="estimated-time" content="{{.SummaryData.EstimatedTime}}">
            <h3 class="text-xl font-semibold text-red-600 mb-2">{{.SummaryData.ReportTitle}}</h3>
            <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-slate-700 mb-3">
                <p><strong>Total VPCs Found:</strong> {{.SummaryData.TotalVPCs}}</p>
                <p><strong>Date Range:</strong> {{.SummaryData.DateRangeCovered}}</p>
                <p><strong>Generated:</strong> {{.SummaryData.GeneratedTimestamp.Format "Jan 02, 2006 15:04"}}</p>
                <p><strong>Data:</strong> {{.SummaryData.DataCompleteness}}</p>
            </div>
            {{if .Options.IncludeStats}}
            <div class="mt-4 pt-3 border-t border-slate-200">
                {{if .SummaryData.VPCsByType}}
                <h4 class="text-md font-medium text-slate-700 mb-1">Breakdown by Type:</h4>
                <ul class="text-xs text-slate-500 list-disc list-inside pl-4 mb-2">
                {{range $type, $count := .SummaryData.VPCsByType}}
                    <li>{{$type | Title}}: {{$count}}</li>
                {{end}}
                </ul>
                {{end}}
                {{if .SummaryData.VPCsByDepartment}}
                 <h4 class="text-md font-medium text-slate-700 mb-1">Breakdown by Department:</h4>
                <ul class="text-xs text-slate-500 list-disc list-inside pl-4">
                {{range $dept, $count := .SummaryData.VPCsByDepartment}}
                    <li>{{$dept}}: {{$count}}</li>
                {{end}}
                </ul>
                {{end}}
            </div>
            {{end}}
        </div>
    `
	funcMap := template.FuncMap{"Title": strings.Title}
	tmpl, err := template.New("summaryPreview").Funcs(funcMap).Parse(tmplString)
	if err != nil {
		return c.Status(500).SendString("Error parsing summary template: " + err.Error())
	}
	var buf bytes.Buffer
	templateData := struct {
		SummaryData *SummaryReportData
		Options     ReportOptions
	}{SummaryData: data, Options: options}
	if err := tmpl.Execute(&buf, templateData); err != nil {
		utils.LogError("Error executing summary template", map[string]interface{}{"error": err})
		return c.Status(500).SendString("Error executing summary template: " + err.Error())
	}
	c.Set("Content-Type", "text/html; charset=utf-8")
	return c.Send(buf.Bytes())
}

func (s *ReportService) generateSummaryPDF(c *fiber.Ctx, data *SummaryReportData, options ReportOptions) error {
	companyName := "VPC Analytics" // Placeholder company name
	reportType := "System-Generated Summary Report"

	pdf := fpdf.New("P", "mm", "A4", "")
	setupPdfPage(pdf, companyName, reportType, data.GeneratedTimestamp) // Use helper for header/footer
	pdf.AddPage()

	// Main Report Title
	pdf.SetFont("Helvetica", "B", 18)
	pdf.SetTextColor(0, 0, 0) // Black
	pdf.CellFormat(0, 10, data.ReportTitle, "", 1, "C", false, 0, "")
	pdf.Ln(8)

	// Filters Applied Section
	addSectionTitlePDF(pdf, "Filters Applied")
	pdf.SetFont("Helvetica", "", 10)
	pdf.SetFillColor(255, 255, 255) // Reset fill color for content

	filterItem := func(key, value string) {
		pdf.SetFont("Helvetica", "B", 10)
		pdf.CellFormat(40, 6, key+":", "", 0, "L", false, 0, "")
		pdf.SetFont("Helvetica", "", 10)
		pdf.CellFormat(0, 6, value, "", 1, "L", false, 0, "")
		pdf.Ln(1)
	}

	if data.Filters.StartDate != nil || data.Filters.EndDate != nil {
		filterItem("Date Range", data.DateRangeCovered)
	}
	if df := data.Filters.DepartmentFilter; df != "" && df != "all" {
		filterItem("Department", df)
	}
	if vtf := data.Filters.VPCTypeFilter; vtf != "" && vtf != "all" {
		filterItem("VPC Type", vtf)
	}
	if al := data.Filters.AggregationLevel; al != "" && al != "none" {
		filterItem("Aggregation", strings.Title(al))
	}
	filterItem("View As Role", strings.Title(strings.ReplaceAll(data.Filters.UserRole, "_", " ")))
	filterItem("Include Stats", fmt.Sprintf("%t", options.IncludeStats))
	pdf.Ln(8)

	// Overall Summary Section
	addSectionTitlePDF(pdf, "Overall Summary")
	pdf.SetFont("Helvetica", "B", 11)
	pdf.CellFormat(60, 7, "Total VPCs Found:", "", 0, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 11)
	pdf.SetFillColor(255, 238, 238) // Light Pink (#FFEEEE) for value background
	pdf.CellFormat(0, 7, fmt.Sprintf("%d", data.TotalVPCs), "", 1, "L", true, 0, "")
	pdf.SetFillColor(255, 255, 255) // Reset fill
	pdf.Ln(1)                       // Small gap

	// Draw a divider line
	pdf.SetDrawColor(255, 51, 51)                                // Accent Red (#FF3333)
	pdf.Line(pdf.GetX(), pdf.GetY(), pdf.GetX()+170, pdf.GetY()) // 170 = A4 width - 2*margins
	pdf.Ln(5)
	pdf.SetDrawColor(0, 0, 0) // Reset draw color

	// Statistics Sections
	if options.IncludeStats {
		if len(data.VPCsByType) > 0 {
			pdf.Ln(5)
			addSectionTitlePDF(pdf, "VPCs by Type")
			pdf.SetFont("Helvetica", "", 10)
			isEvenRow := false
			for vpcType, count := range data.VPCsByType {
				if isEvenRow {
					pdf.SetFillColor(255, 238, 238) // Light Pink (#FFEEEE)
				} else {
					pdf.SetFillColor(255, 255, 255) // White
				}
				pdf.CellFormat(60, 7, fmt.Sprintf("  %s:", strings.Title(vpcType)), "L", 0, "L", true, 0, "")
				pdf.CellFormat(0, 7, fmt.Sprintf("%d", count), "R", 1, "L", true, 0, "")
				isEvenRow = !isEvenRow
			}
			pdf.SetFillColor(255, 255, 255) // Reset fill
			pdf.Ln(5)
		}

		if len(data.VPCsByDepartment) > 0 {
			pdf.Ln(5)
			addSectionTitlePDF(pdf, "VPCs by Department")
			pdf.SetFont("Helvetica", "", 10)
			isEvenRow := false
			for dept, count := range data.VPCsByDepartment {
				if isEvenRow {
					pdf.SetFillColor(255, 238, 238) // Light Pink (#FFEEEE)
				} else {
					pdf.SetFillColor(255, 255, 255) // White
				}
				pdf.CellFormat(60, 7, fmt.Sprintf("  %s:", dept), "L", 0, "L", true, 0, "")
				pdf.CellFormat(0, 7, fmt.Sprintf("%d", count), "R", 1, "L", true, 0, "")
				isEvenRow = !isEvenRow
			}
			pdf.SetFillColor(255, 255, 255) // Reset fill
			pdf.Ln(5)
		}
	}

	// Estimated Time / Record Count (optional - can be part of footer or a final section)
	if data.RecordCount > 100 || data.EstimatedTime != "" {
		pdf.Ln(5)
		addSectionTitlePDF(pdf, "Report Generation Notes")
		if data.RecordCount > 100 {
			pdf.SetFont("Helvetica", "I", 9)
			pdf.SetTextColor(100, 100, 100)
			pdf.MultiCell(0, 5, fmt.Sprintf("Note: This report includes %d records. Consider refining filters for faster generation or more targeted analysis if needed.", data.RecordCount), "", "L", false)
			pdf.SetTextColor(0, 0, 0)
		}
		if data.EstimatedTime != "" {
			pdf.SetFont("Helvetica", "I", 9)
			pdf.SetTextColor(100, 100, 100)
			pdf.CellFormat(0, 5, fmt.Sprintf("Estimated generation time for similar reports: %s", data.EstimatedTime), "", 1, "L", false, 0, "")
			pdf.SetTextColor(0, 0, 0)
		}
		pdf.Ln(5)
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		utils.LogError("Error generating PDF", map[string]interface{}{"error": err})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate summary PDF: " + err.Error()})
	}

	filename := fmt.Sprintf("vpc-summary-report-%s.pdf", time.Now().Format("20060102-150405"))
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	return c.Send(buf.Bytes())
}

func (s *ReportService) generateSummaryHTML(c *fiber.Ctx, data *SummaryReportData, options ReportOptions) error {
	companyName := "VPC Analytics" // Placeholder company name

	var sb strings.Builder
	sb.WriteString(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>VPC Summary Report - ` + companyName + `</title>`)
	sb.WriteString(`<style>
		body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 0; background-color: #F5F5F5; color: #333333; line-height: 1.6; }
		.container { max-width: 900px; margin: 20px auto; background-color: #ffffff; padding: 0; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-top: 5px solid #990000; }
		.content-padding { padding: 20px 30px; }

		.corp-header { background-color: #990000; color: white; padding: 20px 30px; text-align: center; border-radius: 8px 8px 0 0; }
		.corp-header h1 { font-family: Georgia, "Times New Roman", serif; font-size: 2.2em; margin: 0 0 5px 0; }
		.corp-header p { font-family: Arial, Helvetica, sans-serif; font-size: 1em; margin: 0; }

		h2.report-title { font-family: Georgia, "Times New Roman", serif; font-size: 1.8em; color: #333333; margin-top: 20px; margin-bottom: 25px; text-align: center; }
		
		.section { margin-bottom: 25px; padding-top: 15px; border-bottom: 1px solid #FF9999; }
		.section:last-child { border-bottom: none; }
		.section-title { font-family: Georgia, "Times New Roman", serif; font-size: 1.5em; color: #990000; border-bottom: 2px solid #CC0000; padding-bottom: 8px; margin-bottom: 15px; }
		
		.filters-applied ul { list-style: none; padding-left: 0; }
		.filters-applied li { margin-bottom: 8px; padding: 8px 12px; border-left: 4px solid #FF3333; background-color: #FFEEEE; border-radius: 4px; }
		.filters-applied li strong { color: #990000; }

		.grid-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
		.summary-card { background-color: #fdf0f0; padding: 20px; border-radius: 6px; border: 1px solid #FF9999; text-align: center; }
		.summary-card .value { font-size: 2.5em; font-weight: 700; color: #990000; display: block; font-family: Arial, Helvetica, sans-serif; }
		.summary-card .label { font-size: 1em; color: #555555; font-family: Arial, Helvetica, sans-serif; }
		
		table { width: 100%; border-collapse: collapse; margin-top: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
		th, td { padding: 10px 12px; text-align: left; font-size: 0.9em; border: 1px solid #e0e0e0; }
		th { background-color: #CC0000; color: white; font-weight: bold; font-family: Arial, Helvetica, sans-serif; }
		tr:nth-child(even) td { background-color: #FFEEEE; }

		.notes-section { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin-top: 20px; font-size: 0.9em; color: #555; }
		.notes-section p { margin: 5px 0; }

		.corp-footer { font-family: Arial, Helvetica, sans-serif; font-size: 0.85em; text-align: center; color: #777777; margin-top: 30px; padding: 20px 30px 20px; border-top: 1px solid #FF9999; }
	</style></head><body><div class="container">`)

	// Corporate Header
	sb.WriteString(fmt.Sprintf(`<div class="corp-header"><h1>%s</h1><p>System-Generated Summary Report</p></div>`, companyName))

	sb.WriteString(`<div class="content-padding">`) // Start content padding

	// Report Title
	sb.WriteString(fmt.Sprintf(`<h2 class="report-title">%s</h2>`, data.ReportTitle))

	// Filters Applied Section
	sb.WriteString(`<div class="section filters-applied"><h3 class="section-title">Filters Applied</h3><ul>`)
	if data.Filters.StartDate != nil || data.Filters.EndDate != nil {
		sb.WriteString(fmt.Sprintf("<li><strong>Date Range:</strong> %s</li>", data.DateRangeCovered))
	}
	if df := data.Filters.DepartmentFilter; df != "" && df != "all" {
		sb.WriteString(fmt.Sprintf("<li><strong>Department:</strong> %s</li>", df))
	}
	if vtf := data.Filters.VPCTypeFilter; vtf != "" && vtf != "all" {
		sb.WriteString(fmt.Sprintf("<li><strong>VPC Type:</strong> %s</li>", vtf))
	}
	if al := data.Filters.AggregationLevel; al != "" && al != "none" {
		sb.WriteString(fmt.Sprintf("<li><strong>Aggregation:</strong> %s</li>", strings.Title(al)))
	}
	sb.WriteString(fmt.Sprintf("<li><strong>View As Role:</strong> %s</li>", strings.Title(strings.ReplaceAll(data.Filters.UserRole, "_", " "))))
	sb.WriteString(fmt.Sprintf("<li><strong>Include Statistics:</strong> %t</li>", data.Filters.IncludeStats))
	sb.WriteString(`</ul></div>`)

	// Overall Summary Section
	sb.WriteString(`<div class="section"><h3 class="section-title">Overall Summary</h3><div class="grid-summary">`)
	sb.WriteString(fmt.Sprintf(`<div class="summary-card"><span class="value">%d</span><span class="label">Total VPCs Found</span></div>`, data.TotalVPCs))
	// Add more summary cards if needed, e.g., data.DataCompleteness
	if data.DataCompleteness != "" {
		sb.WriteString(fmt.Sprintf(`<div class="summary-card"><span class="value" style="font-size:1.5em; padding-top:1em;">%s</span><span class="label">Data Completeness</span></div>`, data.DataCompleteness))
	}
	sb.WriteString(`</div></div>`)

	// Statistics Sections
	if options.IncludeStats {
		if len(data.VPCsByType) > 0 {
			sb.WriteString(`<div class="section"><h3 class="section-title">VPCs by Type</h3><table><thead><tr><th>Type</th><th>Count</th></tr></thead><tbody>`)
			for vpcType, count := range data.VPCsByType {
				sb.WriteString(fmt.Sprintf(`<tr><td>%s</td><td>%d</td></tr>`, strings.Title(vpcType), count))
			}
			sb.WriteString(`</tbody></table></div>`)
		}
		if len(data.VPCsByDepartment) > 0 {
			sb.WriteString(`<div class="section"><h3 class="section-title">VPCs by Department</h3><table><thead><tr><th>Department</th><th>Count</th></tr></thead><tbody>`)
			for dept, count := range data.VPCsByDepartment {
				sb.WriteString(fmt.Sprintf(`<tr><td>%s</td><td>%d</td></tr>`, dept, count))
			}
			sb.WriteString(`</tbody></table></div>`)
		}
	}

	// Report Generation Notes Section
	if data.RecordCount > 100 || data.EstimatedTime != "" {
		sb.WriteString(`<div class="section notes-section"><h3 class="section-title" style="font-size:1.2em; border-bottom:none; margin-bottom:10px;">Report Generation Notes</h3>`)
		if data.RecordCount > 100 {
			sb.WriteString(fmt.Sprintf("<p><strong>Record Count:</strong> This report includes %d records. For faster generation or more targeted analysis, consider refining filters.</p>", data.RecordCount))
		}
		if data.EstimatedTime != "" {
			sb.WriteString(fmt.Sprintf("<p><strong>Performance Hint:</strong> Estimated generation time for similar reports: %s.</p>", data.EstimatedTime))
		}
		sb.WriteString(`</div>`)
	}

	sb.WriteString(`</div>`) // End content-padding

	// Corporate Footer
	sb.WriteString(fmt.Sprintf(`<div class="corp-footer"><p>Generated on: %s  •  © %d %s. All rights reserved.</p></div>`,
		data.GeneratedTimestamp.Format("January 02, 2006 15:04 MST"),
		data.GeneratedTimestamp.Year(),
		companyName,
	))

	sb.WriteString(`</div></body></html>`) // Close container and HTML

	filename := fmt.Sprintf("vpc-summary-report-%s.html", time.Now().Format("20060102-150405"))
	c.Set("Content-Type", "text/html; charset=utf-8")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	return c.SendString(sb.String())
}

// Helper for HTML conditional string
func ifThenElse(condition bool, a, b string) string {
	if condition {
		return a
	}
	return b
}
