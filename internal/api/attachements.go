package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

// Add handlers for attachments
type AttachmentHandler struct {
	service *services.AttachmentService
}

func NewAttachmentHandler(service *services.AttachmentService) *AttachmentHandler {
	return &AttachmentHandler{service: service}
}

// ListAttachments retrieves all attachments for a specific incident
func (h *AttachmentHandler) ListAttachments(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to list attachments", map[string]interface{}{
		"path":       c.Path(),
		"incidentID": c.Params("incidentID"),
	})

	incidentID, err := uuid.Parse(c.Params("incidentID"))
	if err != nil {
		utils.LogError("Invalid incident ID format", map[string]interface{}{
			"incidentID": c.Params("incidentID"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid incident ID",
		})
	}

	utils.LogDebug("Fetching attachments for incident", map[string]interface{}{
		"incidentID": incidentID,
	})

	attachments, err := h.service.ListAttachments(incidentID)
	if err != nil {
		utils.LogError("Failed to fetch attachments", map[string]interface{}{
			"incidentID": incidentID,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to list attachments",
		})
	}

	utils.LogInfo("Successfully retrieved attachments", map[string]interface{}{
		"incidentID": incidentID,
		"count":      len(attachments),
	})
	return c.JSON(attachments)
}

// DeleteAttachment deletes an attachment by ID
func (h *AttachmentHandler) DeleteAttachment(c *fiber.Ctx) error {
	utils.LogInfo("Processing request to delete attachment", map[string]interface{}{
		"path": c.Path(),
		"id":   c.Params("id"),
	})

	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		utils.LogError("Invalid attachment ID format", map[string]interface{}{
			"attachmentID": c.Params("id"),
			"error":        err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attachment ID",
		})
	}

	utils.LogDebug("Deleting attachment", map[string]interface{}{
		"attachmentID": id,
	})

	if err := h.service.DeleteAttachment(id); err != nil {
		utils.LogError("Failed to delete attachment", map[string]interface{}{
			"attachmentID": id,
			"error":        err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete attachment",
		})
	}

	utils.LogInfo("Successfully deleted attachment", map[string]interface{}{
		"attachmentID": id,
	})
	return c.SendStatus(fiber.StatusNoContent)
}

// SetupAttachmentRoutes registers attachment routes
func SetupAttachmentRoutes(app *fiber.App, handler *AttachmentHandler) {
	attachments := app.Group("/api/v1/incidents/:incidentID/attachments")
	attachments.Get("/", handler.ListAttachments)
	attachments.Delete("/:id", handler.DeleteAttachment)
}
