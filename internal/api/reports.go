package api

import (
	"bytes"
	"errors"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/services"
)

type ReportHandler struct {
	reportService *services.ReportService
}

func NewReportHandler(reportService *services.ReportService) *ReportHandler {
	return &ReportHandler{
		reportService: reportService,
	}
}

// GenerateReport generates a report in JSON format.
func (h *ReportHandler) GenerateReport(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodPost {
		return c.Status(fiber.StatusMethodNotAllowed).SendString("Method not allowed")
	}

	var req services.ReportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).SendString("Invalid request body")
	}
	// Validate request
	if err := validateReportRequest(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Validate request
	if err := validateReportRequest(req); err != nil {
		return c.Status(fiber.StatusBadRequest).SendString(err.Error())
	}

	// Generate report
	data, err := h.reportService.GenerateReport(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to generate report")
	}

	return c.JSON(data)
}

// DownloadReport downloads a report in the specified format (PDF or Excel).
func (h *ReportHandler) DownloadReport(c *fiber.Ctx) error {
	if c.Method() != fiber.MethodPost {
		return c.Status(fiber.StatusMethodNotAllowed).SendString("Method not allowed")
	}

	var req services.ReportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).SendString("Invalid request body")
	}
	// Validate request
	if err := validateReportRequest(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Validate request
	if err := validateReportRequest(req); err != nil {
		return c.Status(fiber.StatusBadRequest).SendString(err.Error())
	}

	// Generate report data
	data, err := h.reportService.GenerateReport(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).SendString("Failed to generate report")
	}

	// Generate file name
	fileName := generateFileName(req.ReportType, req.Format)

	// Export based on format
	switch req.Format {
	case "pdf":
		buffer, err := h.reportService.ExportToPDF(data, req.ReportType)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).SendString("Failed to export PDF")
		}
		c.Response().Header.Set("Content-Type", "application/pdf")
		c.Response().Header.Set("Content-Disposition", "attachment; filename=report.pdf")
		return c.Send(buffer.Bytes())

	case "excel":
		file, err := h.reportService.ExportToExcel(data, req.ReportType)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).SendString("Failed to export Excel")
		}
		// c.Response().Header.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		// c.Response().Header.Set("Content-Disposition", "attachment; filename=report.xlsx")
		// return c.SendFile(file)
		// Write to buffer
		var buffer bytes.Buffer
		if err := file.Write(&buffer); err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to write Excel file",
			})
		}

		c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Set("Content-Disposition", "attachment; filename="+fileName)
		return c.Send(buffer.Bytes())

	default:
		return c.Status(fiber.StatusBadRequest).SendString("Unsupported format")
	}
}

func validateReportRequest(req services.ReportRequest) error {
	if req.ReportType == "" {
		return errors.New("report type is required")
	}
	if req.StartDate.IsZero() {
		return errors.New("start date is required")
	}
	if req.EndDate.IsZero() {
		return errors.New("end date is required")
	}
	if req.Format != "pdf" && req.Format != "excel" {
		return errors.New("invalid format, must be pdf or excel")
	}
	return nil
}

func generateFileName(reportType services.ReportType, format string) string {
	timestamp := time.Now().Format("20060102_150405")
	return fmt.Sprintf("report_%s_%s.%s", reportType, timestamp, format)
}
