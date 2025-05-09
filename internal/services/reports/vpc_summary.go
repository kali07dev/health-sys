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
	"github.com/jung-kurt/gofpdf"
)

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
	// (Content from previous response, this is for NEW feature and should be fine)
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.AddPage()
	pdf.SetFont("Helvetica", "B", 18)
	pdf.CellFormat(0, 10, data.ReportTitle, "", 1, "C", false, 0, "")
	pdf.Ln(5)
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, fmt.Sprintf("Generated: %s", data.GeneratedTimestamp.Format("January 02, 2006 15:04 MST")), "", 1, "R", false, 0, "")
	pdf.Ln(5)
	pdf.SetFont("Helvetica", "B", 12)
	pdf.CellFormat(0, 8, "Filters Applied:", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	if data.Filters.StartDate != nil || data.Filters.EndDate != nil {
		pdf.CellFormat(0, 6, fmt.Sprintf("  Date Range: %s", data.DateRangeCovered), "", 1, "L", false, 0, "")
	}
	if df := data.Filters.DepartmentFilter; df != "" && df != "all" {
		pdf.CellFormat(0, 6, fmt.Sprintf("  Department: %s", df), "", 1, "L", false, 0, "")
	}
	if vtf := data.Filters.VPCTypeFilter; vtf != "" && vtf != "all" {
		pdf.CellFormat(0, 6, fmt.Sprintf("  VPC Type: %s", vtf), "", 1, "L", false, 0, "")
	}
	if al := data.Filters.AggregationLevel; al != "" && al != "none" {
		pdf.CellFormat(0, 6, fmt.Sprintf("  Aggregation: %s", strings.Title(al)), "", 1, "L", false, 0, "")
	}
	pdf.CellFormat(0, 6, fmt.Sprintf("  Report View As Role: %s", strings.Title(strings.ReplaceAll(data.Filters.UserRole, "_", " "))), "", 1, "L", false, 0, "")
	pdf.Ln(8)
	pdf.SetFont("Helvetica", "B", 14)
	pdf.SetFillColor(240, 240, 240)
	pdf.CellFormat(0, 10, "Overall Summary", "1", 1, "L", true, 0, "")
	pdf.SetFont("Helvetica", "", 11)
	pdf.CellFormat(60, 7, "Total VPCs Found:", "L", 0, "L", false, 0, "")
	pdf.CellFormat(0, 7, fmt.Sprintf("%d", data.TotalVPCs), "R", 1, "L", false, 0, "")
	if options.IncludeStats {
		pdf.Ln(5)
		pdf.SetFont("Helvetica", "B", 12)
		pdf.CellFormat(0, 8, "VPCs by Type:", "T L R", 1, "L", true, 0, "")
		pdf.SetFont("Helvetica", "", 10)
		for vpcType, count := range data.VPCsByType {
			pdf.CellFormat(60, 6, fmt.Sprintf("  %s:", strings.Title(vpcType)), "L", 0, "L", false, 0, "")
			pdf.CellFormat(0, 6, fmt.Sprintf("%d", count), "R", 1, "L", false, 0, "")
		}
		pdf.CellFormat(0, 0, "", "T", 0, "C", false, 0, "")
		pdf.Ln(5)
		if len(data.VPCsByDepartment) > 0 {
			pdf.SetFont("Helvetica", "B", 12)
			pdf.CellFormat(0, 8, "VPCs by Department:", "T L R", 1, "L", true, 0, "")
			pdf.SetFont("Helvetica", "", 10)
			for dept, count := range data.VPCsByDepartment {
				pdf.CellFormat(60, 6, fmt.Sprintf("  %s:", dept), "L", 0, "L", false, 0, "")
				pdf.CellFormat(0, 6, fmt.Sprintf("%d", count), "R", 1, "L", false, 0, "")
			}
			pdf.CellFormat(0, 0, "", "T", 0, "C", false, 0, "")
			pdf.Ln(5)
		}
	}
	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		utils.LogError("Error generating PDF", map[string]interface{}{"error": err})
		return c.Status(500).JSON(fiber.Map{"error": "Failed to generate summary PDF: " + err.Error()})
	}

	filename := fmt.Sprintf("vpc-summary-report-%s.pdf", time.Now().Format("20060102"))
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	return c.Send(buf.Bytes())
}

func (s *ReportService) generateSummaryHTML(c *fiber.Ctx, data *SummaryReportData, options ReportOptions) error {
	// (Content from previous response, this is for NEW feature and should be fine)
	var sb strings.Builder
	sb.WriteString(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>VPC Summary Report</title>`)
	sb.WriteString(`<style> body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #334155; line-height: 1.6; } .container { max-width: 900px; margin: 20px auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); } h1, h2, h3 { color: #1e293b; margin-top: 0; } h1 { font-size: 2em; margin-bottom: 10px; text-align: center; color: #dc2626; } .report-meta { font-size: 0.85em; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; text-align:center; } .section { margin-bottom: 30px; padding: 20px; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 6px; } .section h2 { font-size: 1.5em; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 20px; } .grid-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; } .summary-card { background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0; text-align: center; } .summary-card .value { font-size: 2em; font-weight: 700; color: #dc2626; display: block; } .summary-card .label { font-size: 0.9em; color: #475569; } table { width: 100%; border-collapse: collapse; margin-top: 15px; } th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 0.9em; } th { background-color: #f1f5f9; font-weight: 600; color: #334155; } .filters-applied ul { list-style: none; padding-left: 0; } .filters-applied li { margin-bottom: 5px; } </style></head><body><div class="container">`)
	sb.WriteString(fmt.Sprintf(`<h1>%s</h1>`, data.ReportTitle))
	sb.WriteString(fmt.Sprintf(`<div class="report-meta"><p>Generated: %s</p></div>`, data.GeneratedTimestamp.Format("January 02, 2006 15:04 MST")))
	sb.WriteString(`<div class="section filters-applied"><h2>Filters Applied</h2><ul>`)
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
	sb.WriteString(`<div class="section"><div class="grid-summary">`)
	sb.WriteString(fmt.Sprintf(`<div class="summary-card"><span class="value">%d</span><span class="label">Total VPCs</span></div>`, data.TotalVPCs))
	sb.WriteString(`</div></div>`)
	if options.IncludeStats {
		if len(data.VPCsByType) > 0 {
			sb.WriteString(`<div class="section"><h2>VPCs by Type</h2><table><thead><tr><th>Type</th><th>Count</th></tr></thead><tbody>`)
			for vpcType, count := range data.VPCsByType {
				sb.WriteString(fmt.Sprintf(`<tr><td>%s</td><td>%d</td></tr>`, strings.Title(vpcType), count))
			}
			sb.WriteString(`</tbody></table></div>`)
		}
		if len(data.VPCsByDepartment) > 0 {
			sb.WriteString(`<div class="section"><h2>VPCs by Department</h2><table><thead><tr><th>Department</th><th>Count</th></tr></thead><tbody>`)
			for dept, count := range data.VPCsByDepartment {
				sb.WriteString(fmt.Sprintf(`<tr><td>%s</td><td>%d</td></tr>`, dept, count))
			}
			sb.WriteString(`</tbody></table></div>`)
		}
	}
	sb.WriteString(`</div></body></html>`)
	filename := fmt.Sprintf("vpc-summary-report-%s.html", time.Now().Format("20060102"))
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
