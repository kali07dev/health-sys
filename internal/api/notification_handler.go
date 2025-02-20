package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/services/user"
)

type NotificationHandler struct {
	notificationService *services.NotificationService
	userService         *user.UserService
}

func NewNotificationHandler(notificationService *services.NotificationService, userService *user.UserService) *NotificationHandler {
	return &NotificationHandler{notificationService: notificationService,
		userService: userService,
	}
}

// NotificationRequest represents the incoming notification request
type NotificationRequest struct {
	UserID        uuid.UUID `json:"user_id" validate:"required"`
	Type          string    `json:"type" validate:"required"`
	Title         string    `json:"title" validate:"required"`
	Message       string    `json:"message" validate:"required"`
	ReferenceID   uuid.UUID `json:"reference_id" validate:"required"`
	ReferenceType string    `json:"reference_type" validate:"required"`
}

// SendNotification handles the notification request
func (h *NotificationHandler) SendNotification(c *fiber.Ctx) error {
	var request NotificationRequest
	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request payload",
		})
	}

	// Validate that the notification type is valid
	if !isValidNotificationType(request.Type) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid notification type",
		})
	}

	// Send the notification
	err := h.notificationService.SendNotification(
		request.UserID,
		request.Type,
		request.Title,
		request.Message,
		request.ReferenceID,
		request.ReferenceType,
	)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Notification sent successfully",
	})
}

// Helper function to validate notification type
func isValidNotificationType(notificationType string) bool {
	switch services.NotificationType(notificationType) {
	case services.ActionAssigned,
		services.ActionDueSoon,
		services.ActionOverdue,
		services.UrgentIncident,
		services.InterviewScheduled:
		return true
	}
	return false
}
