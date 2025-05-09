package api

import (
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/services/reports"
)

func parseDateQueryParam(dateStr string) (*time.Time, error) {
	if dateStr == "" {
		return nil, nil
	}
	parsedDate, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, fmt.Errorf("invalid date format '%s'. Use YYYY-MM-DD", dateStr)
	}
	return &parsedDate, nil
}

func getSummaryReportOptionsFromCtx(c *fiber.Ctx) (reports.ReportOptions, error) {
	opts := reports.ReportOptions{IsSummaryReport: true}
	var err error

	opts.StartDate, err = parseDateQueryParam(c.Query("startDate"))
	if err != nil {
		return opts, err
	}
	opts.EndDate, err = parseDateQueryParam(c.Query("endDate"))
	if err != nil {
		return opts, err
	}

	opts.UserRole = c.Query("userRole", "employee")
	// TODO: Validate UserRole from a predefined list/map
	validRoles := map[string]bool{"admin": true, "safety_officer": true, "manager": true, "employee": true}
	if !validRoles[opts.UserRole] {
		return opts, fmt.Errorf("invalid userRole: %s", opts.UserRole)
	}

	opts.IncludeStats = c.QueryBool("includeStats", true)
	opts.DepartmentFilter = c.Query("department", "all")   // Default to all
	opts.VPCTypeFilter = c.Query("vpcType", "all")         // Default to all
	opts.AggregationLevel = c.Query("aggregation", "none") // Default to no aggregation

	return opts, nil
}

// GET /api/v1/vpc/reports/summary/preview
func (h *VPCReportHandler) GetSummaryReportPreview(c *fiber.Ctx) error {
	options, err := getSummaryReportOptionsFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	options.OutputFormat = "preview" // Fixed for this endpoint
	options.IsSummaryReport = true

	return h.ReportService.GenerateVPCReport(c, options)
}

// GET /api/v1/vpc/reports/summary/download
func (h *VPCReportHandler) GetSummaryReportDownload(c *fiber.Ctx) error {
	options, err := getSummaryReportOptionsFromCtx(c)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	options.IsSummaryReport = true

	options.OutputFormat = c.Query("outputFormat", "pdf") // pdf or html from query
	validFormats := map[string]bool{"pdf": true, "html": true}
	if !validFormats[options.OutputFormat] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": fmt.Sprintf("invalid outputFormat for summary: %s", options.OutputFormat)})
	}

	return h.ReportService.GenerateVPCReport(c, options)
}
