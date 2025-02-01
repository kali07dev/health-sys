package api

import (
	"net/http"
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/services"
)

type NotificationSettingsHandler struct {
	settingsService *services.NotificationSettingsService
}

func NewNotificationSettingsHandler(settingsService *services.NotificationSettingsService) *NotificationSettingsHandler {
	return &NotificationSettingsHandler{settingsService: settingsService}
}

// GetNotificationSettings retrieves notification settings for a user
func (h *NotificationSettingsHandler) GetNotificationSettings(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	settings, err := h.settingsService.GetNotificationSettings(c.Context(), userID)
	if err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusOK).JSON(settings)
}

// UpdateNotificationSettings updates notification settings for a user
func (h *NotificationSettingsHandler) UpdateNotificationSettings(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("id"))
	if err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID"})
	}

	var request struct {
		Frequency string `json:"frequency"`
	}
	if err := c.BodyParser(&request); err != nil {
		return c.Status(http.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request payload"})
	}

	if err := h.settingsService.UpdateNotificationSettings(c.Context(), userID, request.Frequency); err != nil {
		return c.Status(http.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.Status(http.StatusOK).JSON(fiber.Map{"message": "Notification settings updated successfully"})
}