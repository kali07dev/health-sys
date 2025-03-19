package api

import (
	"math"
	"reflect"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"github.com/hopkali04/health-sys/internal/models"
	"github.com/hopkali04/health-sys/internal/services"
	"github.com/hopkali04/health-sys/internal/utils"
)

type SafetyDashboardHandler struct {
	svc *services.SafetyDashboardService
}

func NewSafetyDashboardHandler(svc *services.SafetyDashboardService) *SafetyDashboardHandler {
	return &SafetyDashboardHandler{svc: svc}
}

// GetEmployeeDashboard handles the employee dashboard request
func (h *SafetyDashboardHandler) GetEmployeeDashboard(c *fiber.Ctx) error {
	utils.LogInfo("Processing employee dashboard request", map[string]interface{}{
		"path":  c.Path(),
		"query": c.Query("timeRange"),
	})

	employeeID, err := uuid.Parse(c.Params("employeeID"))
	if err != nil {
		utils.LogError("Invalid employee ID format", map[string]interface{}{
			"employeeID": c.Params("employeeID"),
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid employee ID",
		})
	}

	timeRange := c.Query("timeRange", "month")
	utils.LogDebug("Fetching employee dashboard", map[string]interface{}{
		"employeeID": employeeID,
		"timeRange":  timeRange,
	})

	dashboard, err := h.svc.GetEmployeeDashboard(employeeID, timeRange)
	if err != nil {
		utils.LogError("Failed to get employee dashboard", map[string]interface{}{
			"employeeID": employeeID,
			"timeRange":  timeRange,
			"error":      err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	if containsNaN(dashboard) {
		utils.LogWarn("Dashboard contains NaN values", map[string]interface{}{
			"employeeID": employeeID,
			"timeRange":  timeRange,
		})
		return c.JSON(fiber.Map{})
	}

	utils.LogInfo("Successfully retrieved employee dashboard", map[string]interface{}{
		"employeeID": employeeID,
		"timeRange":  timeRange,
	})
	return c.JSON(dashboard)
}

// GetAdminDashboard handles the admin dashboard request
func (h *SafetyDashboardHandler) GetAdminDashboard(c *fiber.Ctx) error {
	utils.LogInfo("Processing admin dashboard request", map[string]interface{}{
		"path":  c.Path(),
		"query": c.Queries(),
	})

	var filters models.DashboardFilters

	if err := c.QueryParser(&filters); err != nil {
		utils.LogError("Failed to parse query parameters", map[string]interface{}{
			"error":    err.Error(),
			"rawQuery": string(c.Request().URI().QueryString()),
		})
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid query parameters",
		})
	}

	// Validate date range if provided
	if !filters.StartDate.IsZero() && !filters.EndDate.IsZero() {
		utils.LogDebug("Validating date range", map[string]interface{}{
			"startDate": filters.StartDate,
			"endDate":   filters.EndDate,
		})

		if filters.StartDate.After(filters.EndDate) {
			utils.LogError("Invalid date range", map[string]interface{}{
				"startDate": filters.StartDate,
				"endDate":   filters.EndDate,
			})
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Start date must be before end date",
			})
		}
	}

	utils.LogDebug("Fetching admin dashboard", map[string]interface{}{
		"filters": filters,
	})

	dashboard, err := h.svc.GetAdminDashboard(filters)
	if err != nil {
		utils.LogError("Failed to get admin dashboard", map[string]interface{}{
			"filters": filters,
			"error":   err.Error(),
		})
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	// Check for NaN values in the dashboard response
	if containsNaN(dashboard) {
		utils.LogWarn("Dashboard contains NaN values", map[string]interface{}{
			"filters": filters,
		})
		return c.JSON(fiber.Map{})
	}

	utils.LogInfo("Successfully retrieved admin dashboard", map[string]interface{}{
		"filters": filters,
	})
	return c.JSON(dashboard)
}

func containsNaN(v interface{}) bool {
	val := reflect.ValueOf(v)
	return checkForNaN(val)
}

func checkForNaN(val reflect.Value) bool {
	switch val.Kind() {
	case reflect.Float32, reflect.Float64:
		return math.IsNaN(val.Float())

	case reflect.Ptr:
		if val.IsNil() {
			return false
		}
		return checkForNaN(val.Elem())

	case reflect.Struct:
		for i := 0; i < val.NumField(); i++ {
			// Skip unexported fields
			if !val.Type().Field(i).IsExported() {
				continue
			}
			if checkForNaN(val.Field(i)) {
				return true
			}
		}

	case reflect.Slice, reflect.Array:
		for i := 0; i < val.Len(); i++ {
			if checkForNaN(val.Index(i)) {
				return true
			}
		}

	case reflect.Map:
		for _, key := range val.MapKeys() {
			if checkForNaN(val.MapIndex(key)) {
				return true
			}
		}
	}

	return false
}