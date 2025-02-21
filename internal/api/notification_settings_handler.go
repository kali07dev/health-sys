package api

import (
	"time"

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
type NotificationSettingsResponse struct {
	ID                uuid.UUID `json:"id"`
	UserID            uuid.UUID `json:"userId"`
	ReminderFrequency string    `json:"reminderFrequency"`
	LastReminderAt    time.Time `json:"lastReminderAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

func (h *NotificationSettingsHandler) GetSettings(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	settings, err := h.settingsService.GetByUserID(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch notification settings",
		})
	}

	return c.JSON(NotificationSettingsResponse{
		ID:                settings.ID,
		UserID:            settings.UserID,
		ReminderFrequency: settings.ReminderFrequency,
		LastReminderAt:    settings.LastReminderAt,
		UpdatedAt:         settings.UpdatedAt,
	})
}

func (h *NotificationSettingsHandler) UpdateSettings(c *fiber.Ctx) error {
	userID, err := uuid.Parse(c.Params("userId"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
		})
	}

	type UpdateRequest struct {
		ReminderFrequency string `json:"reminderFrequency"`
	}

	var req UpdateRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	settings, err := h.settingsService.Update(userID, req.ReminderFrequency)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(NotificationSettingsResponse{
		ID:                settings.ID,
		UserID:            settings.UserID,
		ReminderFrequency: settings.ReminderFrequency,
		LastReminderAt:    settings.LastReminderAt,
		UpdatedAt:         settings.UpdatedAt,
	})
}
