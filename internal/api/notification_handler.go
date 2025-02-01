package api

import (
	"net/http"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/services"
)

type NotificationHandler struct {
	notificationService *services.NotificationService
}

func NewNotificationHandler(notificationService *services.NotificationService) *NotificationHandler {
	return &NotificationHandler{notificationService: notificationService}
}

// SendNotification sends a notification to a user
func (h *NotificationHandler) SendNotification(c *fiber.Ctx) error {
	var request struct {
		UserID        uuid.UUID `json:"user_id"`
		Type          string    `json:"type"`
		Title         string    `json:"title"`
		Message       string    `json:"message"`
		ReferenceID   uuid.UUID `json:"reference_id"`
		ReferenceType string    `json:"reference_type"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	if err := h.notificationService.SendNotification(c.Context(), request.UserID, request.Type, request.Title, request.Message, request.ReferenceID, request.ReferenceType); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Notification sent successfully"})
}