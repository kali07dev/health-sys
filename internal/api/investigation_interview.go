package api

import (
	"errors"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
	"gorm.io/gorm"
)

type InterviewHandler struct {
	Service *services.InterviewService
}

func NewInterviewHandler(svc *services.InterviewService) *InterviewHandler {
	return &InterviewHandler{Service: svc}
}

// UpdateInterviewStatus updates the status of an interview
func (h *InterviewHandler) UpdateInterviewStatus(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to update interview status", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	var request struct {
		Status string `json:"status" validate:"required,oneof=scheduled completed cancelled rescheduled"`
		Notes  string `json:"notes"`
	}

	// Parse interview ID from the URL parameter
	interviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid interview ID format", map[string]interface{}{
			"interviewID": c.Params("id"),
			"error":       err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid interview ID",
		})
	}

	// Parse the request body
	if err := c.BodyParser(&request); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogDebug("Updating interview status", map[string]interface{}{
		"interviewID": interviewID,
		"status":      request.Status,
		"notes":       request.Notes,
	})

	// Update the interview status using the service
	interview, err := h.Service.UpdateInterviewStatus(interviewID, request.Status, request.Notes)
	if err != nil {
		utils.LogError("Failed to update interview status", map[string]interface{}{
			"interviewID": interviewID,
			"status":      request.Status,
			"notes":       request.Notes,
			"error":       err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogInfo("Successfully updated interview status", map[string]interface{}{
		"interviewID": interview.ID,
		"status":      request.Status,
	})
	return c.Status(fiber.StatusOK).JSON(interview)
}

// GetInterviewDetails retrieves details of a specific interview
func (h *InterviewHandler) GetInterviewDetails(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch interview details", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid interview ID format", map[string]interface{}{
			"interviewID": c.Params("id"),
			"error":       err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid interview ID format",
		})
	}

	utils.LogDebug("Fetching interview details", map[string]interface{}{
		"interviewID": id,
	})

	interview, err := h.Service.GetInterviewDetails(c.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.LogError("Interview not found", map[string]interface{}{
				"interviewID": id,
			})
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Interview not found",
			})
		}
		utils.LogError("Failed to fetch interview details", map[string]interface{}{
			"interviewID": id,
			"error":       err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogInfo("Successfully retrieved interview details", map[string]interface{}{
		"interviewID": interview.ID,
	})
	return c.JSON(interview)
}

// GetEvidenceDetails retrieves details of a specific evidence
func (h *InterviewHandler) GetEvidenceDetails(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to fetch evidence details", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid evidence ID format", map[string]interface{}{
			"evidenceID": c.Params("id"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid evidence ID format",
		})
	}

	utils.LogDebug("Fetching evidence details", map[string]interface{}{
		"evidenceID": id,
	})

	evidence, err := h.Service.GetEvidenceDetails(c.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			utils.LogError("Evidence not found", map[string]interface{}{
				"evidenceID": id,
			})
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Evidence not found",
			})
		}
		utils.LogError("Failed to fetch evidence details", map[string]interface{}{
			"evidenceID": id,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	utils.LogInfo("Successfully retrieved evidence details", map[string]interface{}{
		"evidenceID": evidence.ID,
	})
	return c.JSON(evidence)
}

// ScheduleInterviewHandler handles the scheduling of an interview
func (h *InterviewHandler) ScheduleInterviewHandler(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to schedule an interview", map[string]interface{}{
		"path": c.Path(),
	})

	var dto schema.CreateInterviewDTO

	// Parse the request body into the DTO
	if err := c.BodyParser(&dto); err != nil {
		utils.LogError("Failed to parse request body", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate the DTO
	if dto.InvestigationID == uuid.Nil || dto.IntervieweeID == uuid.Nil || dto.ScheduledFor.IsZero() || dto.Location == "" {
		utils.LogError("Missing required fields in request", map[string]interface{}{
			"request": dto,
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing required fields",
		})
	}

	utils.LogDebug("Scheduling interview", map[string]interface{}{
		"investigationID": dto.InvestigationID,
		"intervieweeID":   dto.IntervieweeID,
		"scheduledFor":    dto.ScheduledFor,
		"location":        dto.Location,
	})

	// Call the service method to schedule the interview
	interview, err := h.Service.ScheduleInterview(dto)
	if err != nil {
		utils.LogError("Failed to schedule interview", map[string]interface{}{
			"request": dto,
			"error":   err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to schedule interview",
		})
	}

	utils.LogInfo("Successfully scheduled interview", map[string]interface{}{
		"interviewID": interview.ID,
	})
	return c.Status(fiber.StatusCreated).JSON(interview)
}
