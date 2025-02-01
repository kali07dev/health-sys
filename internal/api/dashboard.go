package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/hopkali04/health-sys/internal/services/dashboard"
)

type DashboardHandler struct {
	service dashboard.Service
}

func NewDashboardHandler(service dashboard.Service) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) GetSummary(c *fiber.Ctx) error {
	summary, err := h.service.GetIncidentSummary()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}
	return c.JSON(summary)
}
