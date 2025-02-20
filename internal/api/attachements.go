package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/services"
)

// Add handlers for attachments
type AttachmentHandler struct {
	service *services.AttachmentService
}

func NewAttachmentHandler(service *services.AttachmentService) *AttachmentHandler {
	return &AttachmentHandler{service: service}
}

func (h *AttachmentHandler) ListAttachments(c *fiber.Ctx) error {
	incidentID, err := uuid.Parse(c.Params("incidentID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid incident ID",
		})
	}

	attachments, err := h.service.ListAttachments(incidentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to list attachments",
		})
	}

	return c.JSON(attachments)
}

func (h *AttachmentHandler) DeleteAttachment(c *fiber.Ctx) error {
	id, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid attachment ID",
		})
	}

	if err := h.service.DeleteAttachment(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete attachment",
		})
	}

	return c.SendStatus(fiber.StatusNoContent)
}

// Add routes for attachments
func SetupAttachmentRoutes(app *fiber.App, handler *AttachmentHandler) {
	attachments := app.Group("/api/v1/incidents/:incidentID/attachments")
	attachments.Get("/", handler.ListAttachments)
	attachments.Delete("/:id", handler.DeleteAttachment)
}
