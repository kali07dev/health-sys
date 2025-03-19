package api

import (
	"bytes"
	"errors"
	"fmt"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
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
	utils.LogInfo("Processing request to generate report", map[string]interface{}{
		"path": c.Path(),
	})

	if c.Method() != fiber.MethodPost {
		utils.LogError("Invalid HTTP method", map[string]interface{}{
			"method": c.Method(),
			"error":  "Method not allowed",
		})
		return c.Status(fiber.StatusMethodNotAllowed).SendString("Method not allowed")
	}

	var req services.ReportRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).SendString("Invalid request body")
	}

	utils.LogDebug("Validating report request", map[string]interface{}{
		"request": req,
	})

	if err := validateReportRequest(req); err != nil {
		utils.LogError("Invalid report request", map[string]interface{}{
			"request": req,
			"error":   err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogDebug("Generating report", map[string]interface{}{
		"reportType": req.ReportType,
		"startDate":  req.StartDate,
		"endDate":    req.EndDate,
	})

	data, err := h.reportService.GenerateReport(req)
	if err != nil {
		utils.LogError("Failed to generate report", map[string]interface{}{
			"reportType": req.ReportType,
			"startDate":  req.StartDate,
			"endDate":    req.EndDate,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}

	utils.LogInfo("Successfully generated report", map[string]interface{}{
		"reportType": req.ReportType,
	})
	return c.JSON(data)
}

// DownloadReport downloads a report in the specified format (PDF or Excel).
func (h *ReportHandler) DownloadReport(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to download report", map[string]interface{}{
		"path": c.Path(),
	})

	if c.Method() != fiber.MethodPost {
		utils.LogError("Invalid HTTP method", map[string]interface{}{
			"method": c.Method(),
			"error":  "Method not allowed",
		})
		return c.Status(fiber.StatusMethodNotAllowed).SendString("Method not allowed")
	}

	var req services.ReportRequest
	if err := c.BodyParser(&req); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).SendString(err.Error())
	}

	utils.LogDebug("Validating report request", map[string]interface{}{
		"request": req,
	})

	if err := validateReportRequest(req); err != nil {
		utils.LogError("Invalid report request", map[string]interface{}{
			"request": req,
			"error":   err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogDebug("Generating report data", map[string]interface{}{
		"reportType": req.ReportType,
		"startDate":  req.StartDate,
		"endDate":    req.EndDate,
	})

	data, err := h.reportService.GenerateReport(req)
	if err != nil {
		utils.LogError("Failed to generate report data", map[string]interface{}{
			"reportType": req.ReportType,
			"startDate":  req.StartDate,
			"endDate":    req.EndDate,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
	}

	fileName := generateFileName(req.ReportType, req.Format)
	utils.LogDebug("Generated file name", map[string]interface{}{
		"fileName": fileName,
	})

	switch req.Format {
	case "pdf":
		utils.LogDebug("Exporting report to PDF", map[string]interface{}{
			"reportType": req.ReportType,
		})

		buffer, err := h.reportService.ExportToPDF(data, req.ReportType)
		if err != nil {
			utils.LogError("Failed to export report to PDF", map[string]interface{}{
				"reportType": req.ReportType,
				"error":      err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
		}

		c.Response().Header.Set("Content-Type", "application/pdf")
		c.Response().Header.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
		return c.Send(buffer.Bytes())

	case "excel":
		utils.LogDebug("Exporting report to Excel", map[string]interface{}{
			"reportType": req.ReportType,
		})

		file, err := h.reportService.ExportToExcel(data, req.ReportType)
		if err != nil {
			utils.LogError("Failed to export report to Excel", map[string]interface{}{
				"reportType": req.ReportType,
				"error":      err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).SendString(err.Error())
		}

		var buffer bytes.Buffer
		if err := file.Write(&buffer); err != nil {
			utils.LogError("Failed to write Excel file", map[string]interface{}{
				"reportType": req.ReportType,
				"error":      err.Error(),
			})
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to write Excel file",
			})
		}

		c.Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
		c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", fileName))
		return c.Send(buffer.Bytes())

	default:
		utils.LogError("Unsupported report format", map[string]interface{}{
			"format": req.Format,
		})
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
