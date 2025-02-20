package api

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/services"
)

type SafetyDashboardHandler struct {
	svc *services.SafetyDashboardService
}

func NewSafetyDashboardHandler(svc *services.SafetyDashboardService) *SafetyDashboardHandler {
	return &SafetyDashboardHandler{svc: svc}
}

// GetEmployeeDashboard handles the employee dashboard request
func (h *SafetyDashboardHandler) GetEmployeeDashboard(c *fiber.Ctx) error {
	employeeID, err := uuid.Parse(c.Params("employeeID"))
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}

	timeRange := c.Query("timeRange", "month")

	dashboard, err := h.svc.GetEmployeeDashboard(employeeID, timeRange)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(dashboard)
}

// GetAdminDashboard handles the admin dashboard request
func (h *SafetyDashboardHandler) GetAdminDashboard(c *fiber.Ctx) error {
	var filters models.DashboardFilters

	if err := c.QueryParser(&filters); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid query parameters",
		})
	}

	// Validate date range if provided
	if !filters.StartDate.IsZero() && !filters.EndDate.IsZero() {
		if filters.StartDate.After(filters.EndDate) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Start date must be before end date",
			})
		}
	}

	dashboard, err := h.svc.GetAdminDashboard(filters)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(dashboard)
}

