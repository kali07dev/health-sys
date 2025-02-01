package api

// import (
// 	"github.com/gofiber/fiber/v2"
// 	"github.com/google/uuid"
// 	"github.com/hopkali04/health-sys/internal/models"
// 	"github.com/hopkali04/health-sys/internal/services/notification"
// )

// type NotificationHandler struct {
// 	service notification.Service
// }

// func NewNotificationHandler(service notification.Service) *NotificationHandler {
// 	return &NotificationHandler{service: service}
// }

// func (h *NotificationHandler) CreateNotification(c *fiber.Ctx) error {
// 	var notification models.Notification
// 	if err := c.BodyParser(&notification); err != nil {
// 		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
// 			"error": "Invalid request body",
// 		})
// 	}

// 	if err := h.service.CreateNotification(&notification); err != nil {
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}

// 	return c.Status(fiber.StatusCreated).JSON(notification)
// }

// func (h *NotificationHandler) GetNotifications(c *fiber.Ctx) error {
// 	userID := c.Locals("userID").(uuid.UUID)
// 	notifications, err := h.service.GetNotificationsByUserID(userID)
// 	if err != nil {
// 		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
// 			"error": err.Error(),
// 		})
// 	}
// 	return c.JSON(notifications)
// }
