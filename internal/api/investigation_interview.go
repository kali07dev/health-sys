package api

import (
	"errors"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/schema"
	"github.com/hopkali04/health-sys/internal/services"
	"gorm.io/gorm"
)

type InterviewHandler struct {
	Service *services.InterviewService
}

func NewInterviewHandler(svc *services.InterviewService) *InterviewHandler {
	return &InterviewHandler{Service: svc}
}

// Handler method
//
//	interviews.PUT("/:id/status", handler.UpdateInterviewStatus)
func (h *InterviewHandler) UpdateInterviewStatus(c *fiber.Ctx) error {
	var request struct {
		Status string `json:"status" validate:"required,oneof=scheduled completed cancelled rescheduled"`
		Notes  string `json:"notes"`
	}

	// Parse interview ID from the URL parameter
	interviewID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid interview ID",
		})
	}

	// Parse the request body
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Validate the request (optional, using Fiber's validator)
	// if err := validateRequest(request); err != nil {
	// 	return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
	// 		"error": err.Error(),
	// 	})
	// }

	// Update the interview status using the service
	interview, err := h.Service.UpdateInterviewStatus(interviewID, request.Status, request.Notes)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Return the updated interview
	return c.Status(fiber.StatusOK).JSON(interview)
}
func (h *InterviewHandler) GetInterviewDetails(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid interview ID format",
		})
	}

	interview, err := h.Service.GetInterviewDetails(c.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Interview not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(interview)
}
func (h *InterviewHandler) GetEvidenceDetails(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid evidence ID format",
		})
	}

	evidence, err := h.Service.GetEvidenceDetails(c.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Evidence not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(evidence)
}

// ScheduleInterviewHandler handles the scheduling of an interview
func (h *InterviewHandler) ScheduleInterviewHandler(c *fiber.Ctx) error {
	var dto schema.CreateInterviewDTO

	// Parse the request body into the DTO
	if err := c.BodyParser(&dto); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Validate the DTO (you can use a validation library like go-playground/validator)
	if dto.InvestigationID == uuid.Nil || dto.IntervieweeID == uuid.Nil|| dto.ScheduledFor.IsZero() || dto.Location == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Missing required fields",
		})
	}

	// Call the service method to schedule the interview
	interview, err := h.Service.ScheduleInterview(dto)
	if err != nil {
		log.Printf("Failed to schedule interview: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to schedule interview",
		})
	}

	// Return the scheduled interview as a response
	return c.Status(fiber.StatusCreated).JSON(interview)
}

// Route registration
//  func RegisterInterviewRoutes(router *gin.RouterGroup, handler *InterviewHandler) {
// 	interviews := router.Group("/interviews")
// 	{
// 		// Other routes...

// 	}
//  }
