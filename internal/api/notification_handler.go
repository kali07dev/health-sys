package api

import (
	"time"

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
type NotificationResponse struct {
	ID            uuid.UUID `json:"id"`
	UserName      string    `json:"userName"`
	Type          string    `json:"type"`
	Title         string    `json:"title"`
	Message       string    `json:"message"`
	ReferenceID   uuid.UUID `json:"referenceId"`
	ReferenceType string    `json:"referenceType"`
	ReadAt        time.Time `json:"readAt"`
	CreatedAt     time.Time `json:"createdAt"`
}

type NotificationsListResponse struct {
	Notifications []NotificationResponse `json:"notifications"`
	Total         int64                  `json:"total"`
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
func (h *NotificationHandler) GetUserNotifications(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	filter := services.NotificationFilter{
		Type:      c.Query("type"),
		SortBy:    c.Query("sortBy", "created_at"),
		SortOrder: c.Query("sortOrder", "desc"),
		Page:      c.QueryInt("page", 1),
		PageSize:  c.QueryInt("pageSize", 10),
	}

	notifications, total, err := h.notificationService.GetUserNotifications(userID, filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch notifications",
		})
	}

	// Convert to response format
	response := make([]NotificationResponse, len(notifications))
	for i, notification := range notifications {
		response[i] = NotificationResponse{
			ID:            notification.ID,
			UserName:      notification.User.Email, // Assuming User has a Name field
			Type:          notification.Type,
			Title:         notification.Title,
			Message:       notification.Message,
			ReferenceID:   notification.ReferenceID,
			ReferenceType: notification.ReferenceType,
			ReadAt:        notification.ReadAt,
			CreatedAt:     notification.CreatedAt,
		}
	}

	return c.JSON(NotificationsListResponse{
		Notifications: response,
		Total:         total,
	})
}

func (h *NotificationHandler) GetSystemNotifications(c *fiber.Ctx) error {
	// Check user role from JWT token
	role := c.Locals("role").(string)
	if role != "admin" && role != "safety_officer" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Unauthorized access",
		})
	}

	filter := services.NotificationFilter{
		Type:      c.Query("type"),
		SortBy:    c.Query("sortBy", "created_at"),
		SortOrder: c.Query("sortOrder", "desc"),
		Page:      c.QueryInt("page", 1),
		PageSize:  c.QueryInt("pageSize", 10),
	}

	notifications, total, err := h.notificationService.GetSystemNotifications(filter)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch notifications",
		})
	}

	// Convert to response format
	response := make([]NotificationResponse, len(notifications))
	for i, notification := range notifications {
		response[i] = NotificationResponse{
			ID:            notification.ID,
			UserName:      notification.User.Email,
			Type:          notification.Type,
			Title:         notification.Title,
			Message:       notification.Message,
			ReferenceID:   notification.ReferenceID,
			ReferenceType: notification.ReferenceType,
			ReadAt:        notification.ReadAt,
			CreatedAt:     notification.CreatedAt,
		}
	}

	return c.JSON(NotificationsListResponse{
		Notifications: response,
		Total:         total,
	})
}

func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	notificationID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid notification ID",
		})
	}

	if err := h.notificationService.MarkAsRead(notificationID); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to mark notification as read",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Notification marked as read",
	})
}
