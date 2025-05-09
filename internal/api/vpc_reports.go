package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/services/reports"
)

type VPCReportHandler struct {
	ReportService *reports.ReportService
}

func NewVPCReportHandler(reportService *reports.ReportService) *VPCReportHandler {
	return &VPCReportHandler{
		ReportService: reportService,
	}
}

// GET /api/v1/vpcs/reports/:id/preview
func (h *VPCReportHandler) GetVPCReportPreview(c *fiber.Ctx) error {
	vpcID := c.Params("id")
	if vpcID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "VPC ID is required"})
	}

	options := reports.ReportOptions{
		VPCID:        vpcID,
		UserRole:     c.Query("role", "employee"),
		IncludeStats: c.QueryBool("stats", true),
		OutputFormat: "preview", // Fixed for this endpoint
	}
	// Date range params are not typically used for single VPC preview/report but can be added if needed
	return h.ReportService.GenerateVPCReport(c, options)
}

// func (c *VPCReportHandler) GetVPCReport(ctx *fiber.Ctx) error {
// 	// Get VPC ID from URL parameters
// 	vpcID := ctx.Params("id")
// 	if vpcID == "" {
// 		return ctx.Status(400).JSON(fiber.Map{
// 			"error": "VPC ID is required",
// 		})
// 	}

// 	// Extract query parameters
// 	startDateStr := ctx.Query("start_date")
// 	endDateStr := ctx.Query("end_date")
// 	userRole := ctx.Query("role", "employee")    // Default to employee role
// 	outputFormat := ctx.Query("format", "pdf")   // Default to PDF
// 	includeStats := ctx.QueryBool("stats", true) // Default to include stats

// 	// Parse date parameters if provided
// 	var startDate, endDate *time.Time
// 	if startDateStr != "" {
// 		parsedStartDate, err := time.Parse("2006-01-02", startDateStr)
// 		if err != nil {
// 			return ctx.Status(400).JSON(fiber.Map{
// 				"error": "Invalid start date format. Use YYYY-MM-DD",
// 			})
// 		}
// 		startDate = &parsedStartDate
// 	}

// 	if endDateStr != "" {
// 		parsedEndDate, err := time.Parse("2006-01-02", endDateStr)
// 		if err != nil {
// 			return ctx.Status(400).JSON(fiber.Map{
// 				"error": "Invalid end date format. Use YYYY-MM-DD",
// 			})
// 		}
// 		endDate = &parsedEndDate
// 	}

// 	// Validate user role
// 	validRoles := map[string]bool{
// 		"admin":          true,
// 		"safety_officer": true,
// 		"manager":        true,
// 		"employee":       true,
// 	}

// 	if !validRoles[userRole] {
// 		return ctx.Status(400).JSON(fiber.Map{
// 			"error": "Invalid role. Must be one of: admin, safety_officer, manager, employee",
// 		})
// 	}

// 	// Validate output format
// 	validFormats := map[string]bool{
// 		"pdf":  true,
// 		"html": true,
// 	}

// 	if !validFormats[outputFormat] {
// 		return ctx.Status(400).JSON(fiber.Map{
// 			"error": "Invalid format. Must be one of: pdf, html",
// 		})
// 	}

// 	// Create report options
// 	options := reports.ReportOptions{
// 		StartDate:    startDate,
// 		EndDate:      endDate,
// 		UserRole:     userRole,
// 		OutputFormat: outputFormat,
// 		IncludeStats: includeStats,
// 	}

// 	// Generate the report
// 	return c.ReportService.GenerateVPCReport(ctx, vpcID, options)
// }

// GetVPCReportPDF generates a PDF report for a VPC
// GET /api/v1/vpcs/reports/:id/pdf
func (h *VPCReportHandler) GetVPCReportPDF(c *fiber.Ctx) error {
	vpcID := c.Params("id")
	if vpcID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "VPC ID is required"})
	}
	options := reports.ReportOptions{
		VPCID:        vpcID,
		UserRole:     c.Query("role", "employee"),
		IncludeStats: c.QueryBool("stats", true),
		OutputFormat: "pdf", // Fixed
	}
	return h.ReportService.GenerateVPCReport(c, options)
}

// GetVPCReportHTML generates an HTML report for a VPC
// GET /api/v1/vpcs/reports/:id/html
func (h *VPCReportHandler) GetVPCReportHTML(c *fiber.Ctx) error {
	vpcID := c.Params("id")
	if vpcID == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "VPC ID is required"})
	}
	options := reports.ReportOptions{
		VPCID:        vpcID,
		UserRole:     c.Query("role", "employee"),
		IncludeStats: c.QueryBool("stats", true),
		OutputFormat: "html", // Fixed
	}
	return h.ReportService.GenerateVPCReport(c, options)
}
